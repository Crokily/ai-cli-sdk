#!/usr/bin/env node

const args = process.argv.slice(2);
const promptIndex = args.indexOf('--prompt');

if (promptIndex === -1) {
  console.error('Error: --prompt flag missing');
  process.exit(1);
}

const task = args[promptIndex + 1];

// Verify Env Var Injection
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('Error: GEMINI_API_KEY not found in env');
  process.exit(1);
}

console.log(`Gemini Mock: Processing task "${task}" with Key "${apiKey.slice(0, 4)}..."`);
console.log('Done.');
process.exit(0);
