#!/usr/bin/env node
/**
 * Pushes a single hardcoded workout directly to the Render server,
 * which forwards it to Garmin Connect.
 *
 * Usage: node push-workout.js [server-url]
 * Default server: https://elite-race-tracker-web.onrender.com
 */
'use strict';

const https = require('https');
const http  = require('http');

const SERVER = (process.argv[2] || 'https://elite-race-tracker-web.onrender.com').replace(/\/$/, '');

// ─── Workout definition ───────────────────────────────────────────────────────
// warm-up (lap btn) → 7×1000m @ marathon pace / 1:15 rec → 3:00 rest
// → 4×500m @ 10K pace / 1:30 rec → cool-down 12 min

const SPORT  = { sportTypeId: 1, sportTypeKey: 'running' };

const STEP   = {
  warmup:   { stepTypeId: 1, stepTypeKey: 'warmup' },
  cooldown: { stepTypeId: 2, stepTypeKey: 'cooldown' },
  interval: { stepTypeId: 3, stepTypeKey: 'interval' },
  recovery: { stepTypeId: 4, stepTypeKey: 'recovery' },
  rest:     { stepTypeId: 5, stepTypeKey: 'rest' },
  repeat:   { stepTypeId: 6, stepTypeKey: 'repeat' },
};

const DUR = {
  time:      { durationTypeId: 1, durationTypeKey: 'time' },
  distance:  { durationTypeId: 2, durationTypeKey: 'distance' },
  lapButton: { durationTypeId: 3, durationTypeKey: 'lap.button' },
};

const NO_TARGET  = { workoutTargetTypeId: 1, workoutTargetTypeKey: 'no.target' };
const MARATHON_TARGET = { workoutTargetTypeId: 6, workoutTargetTypeKey: 'pace.zone' }; // zone 3 ~6:54–8:09/mi
const TEN_K_TARGET    = { workoutTargetTypeId: 6, workoutTargetTypeKey: 'pace.zone' }; // zone 4 ~5:50–6:54/mi

// Garmin pace.zone: targetValueOne = faster bound (m/s), targetValueTwo = slower bound (m/s)
const MARATHON_PACE = { targetValueOne: 3.9, targetValueTwo: 3.3 }; // ~6:54–8:09/mi
const TEN_K_PACE   = { targetValueOne: 4.6, targetValueTwo: 3.9 }; // ~5:50–6:54/mi

let order = 1;

const step = (type, durType, durVal, targetType, targetVals = {}) => ({
  stepOrder:      order++,
  stepType:       STEP[type],
  durationType:   durType,
  durationValue:  durVal,
  targetType,
  targetValueOne: targetVals.one  ?? null,
  targetValueTwo: targetVals.two  ?? null,
});

const garminWorkout = {
  workoutName: '7×1000m + 4×500m Track',
  description: 'Warm-up, 7×1000m @ marathon effort / 1:15 rec, 3 min rest, 4×500m @ 10K effort / 1:30 rec, cool-down',
  sportType: SPORT,
  workoutSegments: [{
    segmentOrder: 1,
    sportType: SPORT,
    workoutSteps: [
      // Warm-up (tap lap when ready)
      step('warmup', DUR.lapButton, null, NO_TARGET),

      // 7 × 1000 m @ marathon pace / 1:15 recovery
      (() => {
        const blockOrder  = order++;
        const childStart  = order;
        const children = [
          step('interval', DUR.distance, 1000, MARATHON_TARGET, { one: MARATHON_PACE.targetValueOne, two: MARATHON_PACE.targetValueTwo }),
          step('recovery', DUR.time,      75,  NO_TARGET),
        ];
        return {
          stepOrder:          blockOrder,
          stepType:           STEP.repeat,
          numberOfIterations: 7,
          childStepId:        childStart,
          workoutSteps:       children,
          durationType:       DUR.lapButton,
          durationValue:      null,
          targetType:         NO_TARGET,
          targetValueOne:     null,
          targetValueTwo:     null,
        };
      })(),

      // 3-minute rest
      step('rest', DUR.time, 180, NO_TARGET),

      // 4 × 500 m @ 10K pace / 1:30 recovery
      (() => {
        const blockOrder  = order++;
        const childStart  = order;
        const children = [
          step('interval', DUR.distance, 500, TEN_K_TARGET, { one: TEN_K_PACE.targetValueOne, two: TEN_K_PACE.targetValueTwo }),
          step('recovery', DUR.time,      90, NO_TARGET),
        ];
        return {
          stepOrder:          blockOrder,
          stepType:           STEP.repeat,
          numberOfIterations: 4,
          childStepId:        childStart,
          workoutSteps:       children,
          durationType:       DUR.lapButton,
          durationValue:      null,
          targetType:         NO_TARGET,
          targetValueOne:     null,
          targetValueTwo:     null,
        };
      })(),

      // 12-minute cool-down
      step('cooldown', DUR.time, 720, NO_TARGET),
    ],
  }],
};

// ─── POST to server ───────────────────────────────────────────────────────────

const body = JSON.stringify({ garminWorkout });
const url  = new URL(`${SERVER}/api/garmin/upload`);
const lib  = url.protocol === 'https:' ? https : http;

console.log(`Posting "${garminWorkout.workoutName}" to ${url.href} …`);

const req = lib.request(
  { hostname: url.hostname, port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname, method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
  (res) => {
    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        if (json.success) {
          console.log(`✓ Workout uploaded! Garmin workoutId: ${json.workoutId}`);
          console.log('  Sync your watch → Training > Workouts to find it.');
        } else {
          console.error('✗ Upload failed:', json.error);
        }
      } catch {
        console.error('✗ Unexpected response:', data);
      }
    });
  }
);

req.on('error', e => console.error('✗ Request error:', e.message));
req.write(body);
req.end();
