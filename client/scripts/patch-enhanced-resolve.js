/**
 * Patches enhanced-resolve to add the missing memoize.js file.
 * This file was omitted from the published enhanced-resolve@5.18.x package
 * but is required by webpack. Runs automatically via `postinstall`.
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const target = path.join(__dirname, '../node_modules/enhanced-resolve/lib/util/memoize.js');

if (!fs.existsSync(target)) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(
    target,
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
