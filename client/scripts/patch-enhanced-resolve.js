/**
 * Patches missing files from published npm packages that webpack needs at build time.
 *
 * 1. enhanced-resolve@5.18.x omitted lib/util/memoize.js
 * 2. webpack@5 (react-scripts 5) omitted lib/javascript/ChunkFormatHelpers.js
 *
 * Runs automatically via `postinstall` in client/package.json.
 */
'use strict';

const fs   = require('fs');
const path = require('path');

// ── 1. enhanced-resolve/lib/util/memoize.js ──────────────────────────────────

const memoizeTarget = path.join(
  __dirname,
  '../node_modules/enhanced-resolve/lib/util/memoize.js'
);

if (!fs.existsSync(memoizeTarget)) {
  fs.mkdirSync(path.dirname(memoizeTarget), { recursive: true });
  fs.writeFileSync(
    memoizeTarget,
    `"use strict";
/**
 * @template T
 * @param {() => T} fn
 * @returns {() => T}
 */
const memoize = fn => {
  let result;
  let called = false;
  return () => {
    if (!called) { result = fn(); called = true; }
    return result;
  };
};
module.exports = memoize;
`
  );
  console.log('postinstall: patched enhanced-resolve/lib/util/memoize.js');
} else {
  console.log('postinstall: enhanced-resolve/lib/util/memoize.js already present');
}

// ── 2. webpack/lib/javascript/ChunkFormatHelpers.js ──────────────────────────
//
// Required by:
//   webpack/lib/javascript/CommonJsChunkFormatPlugin.js
//   webpack/lib/esm/ModuleChunkFormatPlugin.js
//
// Exports:
//   getChunkInfo(chunk, chunkGraph)  → { entries, runtimeChunk }
//   createChunkHashHandler(pluginName) → chunkHash tap handler

const chunkFormatHelpersTarget = path.join(
  __dirname,
  '../node_modules/webpack/lib/javascript/ChunkFormatHelpers.js'
);

if (!fs.existsSync(chunkFormatHelpersTarget)) {
  fs.mkdirSync(path.dirname(chunkFormatHelpersTarget), { recursive: true });
  fs.writeFileSync(
    chunkFormatHelpersTarget,
    `"use strict";

const { updateHashForEntryStartup } = require("./StartupHelpers");

/**
 * Get the entry modules and runtime chunk for a given chunk.
 * @param {import("../Chunk")} chunk
 * @param {import("../ChunkGraph")} chunkGraph
 * @returns {{ entries: Array, runtimeChunk: import("../Chunk") | null }}
 */
const getChunkInfo = (chunk, chunkGraph) => {
  const entries = [
    ...chunkGraph.getChunkEntryModulesWithChunkGroupIterable(chunk)
  ];
  let runtimeChunk = null;
  if (entries.length > 0) {
    const [, firstEntrypoint] = entries[0];
    const candidate = firstEntrypoint.getRuntimeChunk
      ? firstEntrypoint.getRuntimeChunk()
      : null;
    if (candidate && candidate !== chunk) {
      runtimeChunk = candidate;
    }
  }
  return { entries, runtimeChunk };
};

/**
 * Create a chunkHash tap handler for chunk format plugins.
 * @param {string} pluginName
 * @returns {(chunk: import("../Chunk"), hash: any, context: { chunkGraph: import("../ChunkGraph") }) => void}
 */
const createChunkHashHandler = (pluginName) => {
  return (chunk, hash, { chunkGraph }) => {
    if (chunk.hasRuntime()) return;
    hash.update(\`\${pluginName}1\`);
    const entries = [
      ...chunkGraph.getChunkEntryModulesWithChunkGroupIterable(chunk)
    ];
    updateHashForEntryStartup(hash, chunkGraph, entries, chunk);
  };
};

module.exports = { getChunkInfo, createChunkHashHandler };
`
  );
  console.log('postinstall: patched webpack/lib/javascript/ChunkFormatHelpers.js');
} else {
  console.log('postinstall: webpack/lib/javascript/ChunkFormatHelpers.js already present');
}
