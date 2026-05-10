#!/usr/bin/env node
/**
 * Patches @expo/metro-config serializer to handle modules with undefined
 * `path` or `absolutePath` — a bug triggered by react-native@0.79.6 virtual
 * modules that have no file path set.
 *
 * This script is idempotent: it checks whether each patch is already present
 * before writing, so running it multiple times is always safe.
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
  console.log('[patch-metro] File not found, skipping.');
  process.exit(0);
}

let src = fs.readFileSync(file, 'utf8');
let changed = false;

// ── Patch 1 ────────────────────────────────────────────────────────────────
// Guard module.path before calling path.relative in dev mode.
// Marker: the raw (unpatched) line contains exactly the original push call.
const RAW1 = 'params.push(path_1.default.relative(options.projectRoot, module.path));';
const PATCHED1_MARKER = 'if (module.path != null) params.push(path_1.default.relative(options.projectRoot, module.path));';

if (src.includes(RAW1) && !src.includes(PATCHED1_MARKER)) {
  src = src.replace(RAW1, PATCHED1_MARKER);
  changed = true;
  console.log('[patch-metro] Applied patch 1: guard module.path');
} else if (src.includes(PATCHED1_MARKER)) {
  // Already clean — ensure no stacking (triple guards)
  while (src.includes('if (module.path != null) if (module.path != null)')) {
    src = src.replace(
      'if (module.path != null) if (module.path != null) params.push(path_1.default.relative(options.projectRoot, module.path));',
      PATCHED1_MARKER
    );
    changed = true;
    console.log('[patch-metro] Cleaned stacked patch 1');
  }
}

// ── Patch 2 ────────────────────────────────────────────────────────────────
// Guard dependency.absolutePath in the async split-bundle path block.
const RAW2 = 'const bundlePath = path_1.default.relative(options.serverRoot, dependency.absolutePath);';
const PATCHED2_MARKER = 'if (dependency.absolutePath != null) {';

// If the raw line still exists AND our guard isn't immediately above it, apply.
if (src.includes(RAW2) && !src.includes(PATCHED2_MARKER)) {
  src = src.replace(
    `                    ${RAW2}
                    paths[id] =
                        '/' +
                            path_1.default.join(path_1.default.dirname(bundlePath), 
                            // Strip the file extension
                            path_1.default.basename(bundlePath, path_1.default.extname(bundlePath))) +
                            '.bundle?' +
                            searchParams.toString();`,
    `                    ${PATCHED2_MARKER}
                        const bundlePath = path_1.default.relative(options.serverRoot, dependency.absolutePath);
                        paths[id] =
                            '/' +
                                path_1.default.join(path_1.default.dirname(bundlePath),
                                // Strip the file extension
                                path_1.default.basename(bundlePath, path_1.default.extname(bundlePath))) +
                                '.bundle?' +
                                searchParams.toString();
                    }`
  );
  changed = true;
  console.log('[patch-metro] Applied patch 2: guard dependency.absolutePath');
} else {
  console.log('[patch-metro] Patch 2 already applied or not needed.');
}

if (changed) {
  fs.writeFileSync(file, src, 'utf8');
  console.log('[patch-metro] Patches written successfully.');
} else {
  console.log('[patch-metro] No changes needed — patches already in place.');
}
