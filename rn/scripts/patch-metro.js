#!/usr/bin/env node
/**
 * Patches @expo/metro-config serializer to handle modules with undefined
 * `path` or `absolutePath` — a bug introduced when react-native@0.79.6
 * added virtual modules that lack a file path.
 *
 * Two call sites in build/serializer/fork/js.js crash in dev mode:
 *   1. path.relative(projectRoot, module.path)        — module.path can be undefined
 *   2. path.relative(serverRoot, dependency.absolutePath) — absolutePath can be undefined
 */
const fs = require('fs');
const path = require('path');

const file = path.join(
  __dirname,
  '..',
  'node_modules',
  '@expo',
  'metro-config',
  'build',
  'serializer',
  'fork',
  'js.js'
);

if (!fs.existsSync(file)) {
  console.log('[patch-metro] File not found, skipping:', file);
  process.exit(0);
}

let src = fs.readFileSync(file, 'utf8');
let changed = false;

// Patch 1: guard module.path before path.relative
const BAD1 = 'params.push(path_1.default.relative(options.projectRoot, module.path));';
const GOOD1 = 'if (module.path != null) params.push(path_1.default.relative(options.projectRoot, module.path));';
if (src.includes(BAD1)) {
  src = src.replace(BAD1, GOOD1);
  changed = true;
  console.log('[patch-metro] Applied patch 1: guard module.path');
}

// Patch 2: guard dependency.absolutePath before path.relative
const BAD2 = 'const bundlePath = path_1.default.relative(options.serverRoot, dependency.absolutePath);';
const GOOD2 = [
  'if (dependency.absolutePath == null) { /* skip split bundle path — absolutePath undefined */ }',
  '                    else {',
  '                    const bundlePath = path_1.default.relative(options.serverRoot, dependency.absolutePath);',
  '                    paths[id] =',
  "                        '/' +",
  '                            path_1.default.join(path_1.default.dirname(bundlePath), ',
  '                            // Strip the file extension',
  "                            path_1.default.basename(bundlePath, path_1.default.extname(bundlePath))) +",
  "                            '.bundle?' +",
  '                            searchParams.toString();',
  '                    }',
].join('\n');

// Only apply patch 2 if patch 1 already fixed the nearby block but this one is still raw
const ALREADY2 = 'if (dependency.absolutePath == null)';
if (src.includes(BAD2) && !src.includes(ALREADY2)) {
  // Replace the entire bundlePath block
  const blockRe = /const bundlePath = path_1\.default\.relative\(options\.serverRoot, dependency\.absolutePath\);[\s\S]*?\.bundle\?' \+\n\s+searchParams\.toString\(\);/;
  src = src.replace(blockRe, GOOD2);
  changed = true;
  console.log('[patch-metro] Applied patch 2: guard dependency.absolutePath');
}

if (changed) {
  fs.writeFileSync(file, src, 'utf8');
  console.log('[patch-metro] Patches written successfully.');
} else {
  console.log('[patch-metro] No patches needed (already applied or pattern not found).');
}
