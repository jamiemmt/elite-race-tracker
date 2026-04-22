/**
 * Minimal server for the Garmin Workout Creator feature.
 * Intentionally does NOT import the scraper infrastructure so it starts
 * cleanly even if other server dependencies (undici, cheerio) are broken.
 */
'use strict';

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app  = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Garmin workout routes (axios + child_process only — no scraper deps)
app.use('/api/garmin', require('./routes/garmin'));

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Serve React production build (whenever the build folder exists)
const buildDir  = path.join(__dirname, '../client/build');
const indexHtml = path.join(buildDir, 'index.html');
if (fs.existsSync(indexHtml)) {
  app.use(express.static(buildDir));
  app.get('*', (_req, res) => res.sendFile(indexHtml));
}

app.listen(PORT, () => console.log(`Garmin server running on http://localhost:${PORT}`));
