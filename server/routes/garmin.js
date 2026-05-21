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
        description: step.notes || '',
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
- mm:ss format → seconds: (minutes × 60) + seconds. Examples: 2:30 = 150s, 1:15 = 75s, 3:00 = 180s, 4:30 = 270s

For repeat blocks (e.g. "4x800m"), use type "repeat" with "count" and nested "steps" array.
For steps with no intensity cue, use no_target.

For each step, include a "notes" field with the original pace/time/effort info exactly as written by the athlete (e.g. "@40", "@ 85-86", "3:10-12", "marathon effort"). Keep it short and verbatim. Omit notes only if the step has no pace/time target at all.

Output ONLY a JSON object matching this exact schema:
{
  "name": "string (≤50 chars, descriptive name for the workout)",
  "description": "string (one sentence summary)",
  "steps": [
    {
      "type": "warmup|cooldown|interval|recovery|rest|other",
      "duration": { "value": number, "unit": "seconds|meters|lap_button" },
      "target": { "type": "no_target" },
      "notes": "string (optional — original pace/effort notation from description)"
    },
    {
      "type": "repeat",
      "count": number,
      "steps": [
        {
          "type": "interval|recovery|rest",
          "duration": { "value": number, "unit": "seconds|meters" },
          "target": { "type": "no_target" } or { "type": "pace_zone", "zone": 1|2|3|4|5 },
          "notes": "string (optional)"
        }
      ]
    }
  ]
}`;

// ─── POST /api/garmin/parse ──────────────────────────────────────────────────

router.post('/parse', async (req, res) => {
  const { description } = req.body;

  if (!description || !description.trim()) {
    return res.status(400).json({ error: 'Workout description is required' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY is not configured on the server' });
  }

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user',   content: description.trim() },
        ],
        temperature: 0.1,
        max_tokens: 2048,
      },
      { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
    );

    const rawText = response.data.choices[0].message.content.trim();

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
    const msg = err.response?.data?.error?.message || err.response?.data?.error || err.message;
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

  // Prefer venv python (macOS system python can't install packages freely),
  // fall back to system python3 if venv doesn't exist.
  const os = require('os');
  const venvPython = path.join(os.homedir(), '.garmin-venv', 'bin', 'python3');
  const fs = require('fs');
  const pythonBin = fs.existsSync(venvPython) ? venvPython : 'python3';

  const child = execFile(pythonBin, [scriptPath], { env: process.env }, (err, stdout, stderr) => {
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

// ─── GET /api/garmin/push-now ────────────────────────────────────────────────
// One-tap endpoint: builds and uploads the hardcoded track workout directly.

router.get('/push-now', (req, res) => {
  if (!process.env.GARMIN_EMAIL || !process.env.GARMIN_PASSWORD) {
    return res.status(500).send('GARMIN_EMAIL / GARMIN_PASSWORD not set on server.');
  }

  const SPORT = { sportTypeId: 1, sportTypeKey: 'running' };
  const STEP  = {
    warmup:   { stepTypeId: 1, stepTypeKey: 'warmup' },
    cooldown: { stepTypeId: 2, stepTypeKey: 'cooldown' },
    interval: { stepTypeId: 3, stepTypeKey: 'interval' },
    recovery: { stepTypeId: 4, stepTypeKey: 'recovery' },
    rest:     { stepTypeId: 5, stepTypeKey: 'rest' },
    repeat:   { stepTypeId: 6, stepTypeKey: 'repeat' },
  };
  const DUR = {
    time:     { durationTypeId: 1, durationTypeKey: 'time' },
    distance: { durationTypeId: 2, durationTypeKey: 'distance' },
    lap:      { durationTypeId: 3, durationTypeKey: 'lap.button' },
  };
  const NO_TGT     = { workoutTargetTypeId: 1, workoutTargetTypeKey: 'no.target' };
  const PACE_ZONE  = { workoutTargetTypeId: 6, workoutTargetTypeKey: 'pace.zone' };

  let o = 1;
  const s = (type, dur, val, tgt, v1 = null, v2 = null) => ({
    stepOrder: o++, stepType: STEP[type],
    durationType: dur, durationValue: val,
    targetType: tgt, targetValueOne: v1, targetValueTwo: v2,
  });

  const rpt = (count, children) => {
    const blk = o++; const cid = o;
    return { stepOrder: blk, stepType: STEP.repeat, numberOfIterations: count,
             childStepId: cid, workoutSteps: children,
             durationType: DUR.lap, durationValue: null,
             targetType: NO_TGT, targetValueOne: null, targetValueTwo: null };
  };

  const garminWorkout = {
    workoutName: '7×1000m + 4×500m Track',
    description: 'Warm-up · 7×1000m @marathon / 1:15 rec · 3 min rest · 4×500m @10K / 1:30 rec · cool-down',
    sportType: SPORT,
    workoutSegments: [{ segmentOrder: 1, sportType: SPORT, workoutSteps: [
      s('warmup',   DUR.lap,      null, NO_TGT),
      rpt(7, [
        s('interval', DUR.distance, 1000, PACE_ZONE, 3.9, 3.3),
        s('recovery', DUR.time,       75, NO_TGT),
      ]),
      s('rest',     DUR.time,  180, NO_TGT),
      rpt(4, [
        s('interval', DUR.distance, 500, PACE_ZONE, 4.6, 3.9),
        s('recovery', DUR.time,      90, NO_TGT),
      ]),
      s('cooldown', DUR.time,  720, NO_TGT),
    ]}],
  };

  const scriptPath = path.join(__dirname, '../garmin/upload_workout.py');
  const os = require('os');
  const fs = require('fs');
  const venvPython = path.join(os.homedir(), '.garmin-venv', 'bin', 'python3');
  const pythonBin  = fs.existsSync(venvPython) ? venvPython : 'python3';

  res.setHeader('Content-Type', 'text/plain');
  res.write(`Uploading "${garminWorkout.workoutName}" to Garmin Connect…\n`);

  const child = execFile(pythonBin, [scriptPath], { env: process.env }, (err, stdout, stderr) => {
    if (err) {
      try { const r = JSON.parse(stdout); res.end(`ERROR: ${r.error || stderr || err.message}`); }
      catch { res.end(`ERROR: ${stderr || err.message}`); }
      return;
    }
    try {
      const r = JSON.parse(stdout);
      if (r.success) res.end(`\nDone! Workout "${garminWorkout.workoutName}" sent to Garmin (id: ${r.workoutId}).\nSync your watch → Training › Workouts.`);
      else           res.end(`ERROR: ${r.error}`);
    } catch { res.end(`ERROR: unexpected output: ${stdout}`); }
  });

  child.stdin.write(JSON.stringify(garminWorkout));
  child.stdin.end();
});

module.exports = router;
