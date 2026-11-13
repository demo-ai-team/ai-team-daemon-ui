#!/usr/bin/env node
'use strict';

const { spawn } = require('node:child_process');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
let electronBin;

try {
  electronBin = require('electron');
} catch {
  // electron not installed in local node_modules
}

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

if (!electronBin) {
  const child = spawn('npx', ['electron', projectRoot, ...process.argv.slice(2)], {
    stdio: 'inherit',
    env,
  });
  child.on('exit', (code) => process.exit(code || 0));
} else {
  const child = spawn(electronBin, [projectRoot, ...process.argv.slice(2)], {
    stdio: 'inherit',
    env,
  });
  child.on('exit', (code) => process.exit(code || 0));
}
