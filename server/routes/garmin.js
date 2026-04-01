const express = require('express');
const axios = require('axios');
const { execFile } = require('child_process');
const path = require('path');

const router = express.Router();

// ─── Garmin type mappings ────────────────────────────────────────────────────

const SPORT = { sportTypeId: 1, sportTypeKey: 'running' };

const STEP_TYPES = {
  warmup:   { stepTypeId: 1, stepTypeKey: 'warmup' },
  cooldown: { stepTypeId: 2, stepTypeKey: 'cooldown' },
  interval: { stepTypeId: 3, stepTypeKey: 'interval' },
  recovery: { stepTypeId: 4, stepTypeKey: 'recovery' },
  rest:     { stepTypeId: 5, stepTypeKey: 'rest' },
  repeat:   { stepTypeId: 6, stepTypeKey: 'repeat' },
  other:    { stepTypeId: 7, stepTypeKey: 'other' },
};

const DURATION_TYPES = {
  seconds:    { durationTypeId: 1, durationTypeKey: 'time' },
  meters:     { durationTypeId: 2, durationTypeKey: 'distance' },
  lap_button: { durationTypeId: 3, durationTypeKey: 'lap.button' },
};

// Pace zones: [faster m/s (targetValueOne), slower m/s (targetValueTwo)]
// Garmin pace.zone target: targetValueOne = max speed, targetValueTwo = min speed
const PACE_ZONES = {
  1: [2.8,  2.0],  // ~9:30–13:20 min/mile (easy/recovery)
  2: [3.3,  2.8],  // ~8:09–9:30  min/mile (aerobic/endurance)
  3: [3.9,  3.3],  // ~6:54–8:09  min/mile (steady/marathon)
  4: [4.6,  3.9],  // ~5:50–6:54  min/mile (threshold/tempo)
  5: [6.0,  4.6],  // ~4:28–5:50  min/mile (VO2max/race pace)
};

function buildTarget(target) {
  if (target && target.type === 'pace_zone' && PACE_ZONES[target.zone]) {
    const [fast, slow] = PACE_ZONES[target.zone];
    return {
      targetType: { workoutTargetTypeId: 6, workoutTargetTypeKey: 'pace.zone' },
      targetValueOne: fast,
      targetValueTwo: slow,
    };
  }
  return {
    targetType: { workoutTargetTypeId: 1, workoutTargetTypeKey: 'no.target' },
    targetValueOne: null,
    targetValueTwo: null,
  };
}

function convertSteps(steps, counter) {
  const result = [];
  for (const step of steps) {
    if (step.type === 'repeat') {
      const order = counter.value++;
      const childStepId = counter.value;
      const childSteps = convertSteps(step.steps, counter);
      result.push({
        stepOrder: order,
        stepType: STEP_TYPES.repeat,
        numberOfIterations: step.count,
        childStepId,
        workoutSteps: childSteps,
        durationType: DURATION_TYPES.lap_button,
        durationValue: null,
        targetType: { workoutTargetTypeId: 1, workoutTargetTypeKey: 'no.target' },
        targetValueOne: null,
        targetValueTwo: null,
      });
    } else {
      const dur = step.duration || {};
      const unit = dur.unit || 'seconds';
      const durType = DURATION_TYPES[unit] || DURATION_TYPES.seconds;
      const { targetType, targetValueOne, targetValueTwo } = buildTarget(step.target);
      result.push({
        stepOrder: counter.value++,
        stepType: STEP_TYPES[step.type] || STEP_TYPES.other,
        durationType: durType,
        durationValue: unit === 'lap_button' ? null : (dur.value || null),
        targetType,
        targetValueOne,
        targetValueTwo,
      });
    }
  }
  return result;
}

function toGarminWorkout(parsed) {
  const counter = { value: 1 };
  return {
    workoutName: parsed.name,
    description: parsed.description || '',
    sportType: SPORT,
    workoutSegments: [
      {
        segmentOrder: 1,
        sportType: SPORT,
        workoutSteps: convertSteps(parsed.steps || [], counter),
      },
    ],
  };
}

// ─── Claude system prompt ────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a running workout parser. Convert the workout description to JSON only — no markdown, no explanation, no code fences.

Step types: warmup | cooldown | interval | recovery | rest | repeat | other
Duration units: seconds (convert all times to seconds) | meters (convert all distances to meters) | lap_button
Target types: no_target | pace_zone (zone 1–5)

Pace zone guide:
- zone 1: easy / recovery / very easy / walk / jog
- zone 2: aerobic / endurance / comfortable / conversational / long run
- zone 3: steady / moderate / marathon pace / half marathon pace
- zone 4: tempo / threshold / lactate threshold / comfortably hard / 10K pace
- zone 5: VO2max / hard / race pace / fast / 5K pace / 1-mile pace

Unit conversions:
- miles → meters: multiply by 1609
- km → meters: multiply by 1000
- minutes → seconds: multiply by 60

For repeat blocks (e.g. "4x800m"), use type "repeat" with "count" and nested "steps" array.
For steps with no intensity cue, use no_target.

Output ONLY a JSON object matching this exact schema:
{
  "name": "string (≤50 chars, descriptive name for the workout)",
  "description": "string (one sentence summary)",
  "steps": [
    {
      "type": "warmup|cooldown|interval|recovery|rest|other",
      "duration": { "value": number, "unit": "seconds|meters|lap_button" },
      "target": { "type": "no_target" }
    },
    {
      "type": "repeat",
      "count": number,
      "steps": [
        {
          "type": "interval|recovery|rest",
          "duration": { "value": number, "unit": "seconds|meters" },
          "target": { "type": "no_target" } or { "type": "pace_zone", "zone": 1|2|3|4|5 }
        }
      ]
    },
    {
      "type": "interval|warmup|cooldown|other",
      "duration": { "value": number, "unit": "seconds|meters" },
      "target": { "type": "pace_zone", "zone": 1|2|3|4|5 }
    }
  ]
}`;

// ─── POST /api/garmin/parse ──────────────────────────────────────────────────

router.post('/parse', async (req, res) => {
  const { description } = req.body;

  if (!description || !description.trim()) {
    return res.status(400).json({ error: 'Workout description is required' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured on the server' });
  }

  try {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: description.trim() }],
      },
      {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
      }
    );

    const rawText = response.data.content[0].text.trim();

    let parsedWorkout;
    try {
      parsedWorkout = JSON.parse(rawText);
    } catch (parseErr) {
      // Strip any accidental markdown fences and retry
      const stripped = rawText.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();
      parsedWorkout = JSON.parse(stripped);
    }

    const garminWorkout = toGarminWorkout(parsedWorkout);
    return res.json({ parsedWorkout, garminWorkout });
  } catch (err) {
    const msg = err.response?.data?.error?.message || err.message;
    console.error('Garmin parse error:', msg);
    return res.status(500).json({ error: `Failed to parse workout: ${msg}` });
  }
});

// ─── POST /api/garmin/upload ─────────────────────────────────────────────────

router.post('/upload', (req, res) => {
  const { garminWorkout } = req.body;

  if (!garminWorkout) {
    return res.status(400).json({ error: 'garminWorkout JSON is required' });
  }

  if (!process.env.GARMIN_EMAIL || !process.env.GARMIN_PASSWORD) {
    return res.status(500).json({
      error: 'GARMIN_EMAIL and GARMIN_PASSWORD are not configured on the server',
    });
  }

  const scriptPath = path.join(__dirname, '../garmin/upload_workout.py');
  const workoutJson = JSON.stringify(garminWorkout);

  const child = execFile('python3', [scriptPath], { env: process.env }, (err, stdout, stderr) => {
    if (err) {
      console.error('Garmin upload process error:', stderr || err.message);
      // Try to parse stdout first — script may have exited non-zero but still printed JSON
      try {
        const result = JSON.parse(stdout);
        return res.status(500).json({ error: result.error || 'Upload failed' });
      } catch {
        return res.status(500).json({ error: stderr || err.message || 'Upload failed' });
      }
    }

    try {
      const result = JSON.parse(stdout);
      if (!result.success) {
        return res.status(500).json({ error: result.error || 'Upload failed' });
      }
      return res.json({ success: true, workoutId: result.workoutId, workoutName: garminWorkout.workoutName });
    } catch (parseErr) {
      console.error('Failed to parse Python script output:', stdout);
      return res.status(500).json({ error: 'Unexpected response from upload script' });
    }
  });

  // Write workout JSON to the Python script's stdin
  child.stdin.write(workoutJson);
  child.stdin.end();
});

module.exports = router;
