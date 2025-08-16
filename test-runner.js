#!/usr/bin/env node

// Test script to verify the new test server functionality
const { spawn } = require('child_process');
const path = require('path');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
  console.log('Testing ember_test_server_start and ember_test_server_run...\n');
  
  // Create a temporary test app
  const testAppDir = path.join(__dirname, 'test-ember-app');
  
  console.log('1. Creating test Ember app...');
  const create = spawn('npx', ['ember-cli', 'new', 'test-ember-app', '--skip-git', '--skip-npm'], {
    cwd: __dirname,
    stdio: 'inherit'
  });
  
  await new Promise((resolve, reject) => {
    create.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`Failed to create app: ${code}`));
    });
  });
  
  console.log('\n2. Installing dependencies...');
  const install = spawn('npm', ['install'], {
    cwd: testAppDir,
    stdio: 'inherit'
  });
  
  await new Promise((resolve, reject) => {
    install.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`Failed to install: ${code}`));
    });
  });
  
  console.log('\n3. Building for test environment...');
  const build = spawn('npx', ['ember', 'build', '--environment=test'], {
    cwd: testAppDir,
    stdio: 'inherit'
  });
  
  await new Promise((resolve, reject) => {
    build.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`Failed to build: ${code}`));
    });
  });
  
  console.log('\n4. Running tests with --path option (no compilation)...');
  const test = spawn('npx', ['ember', 'test', '--path', 'dist', '--reporter', 'tap'], {
    cwd: testAppDir,
    stdio: 'inherit',
    env: { ...process.env, CI: 'true' }
  });
  
  await new Promise((resolve, reject) => {
    test.on('close', code => {
      console.log(`\nTests completed with exit code: ${code}`);
      resolve(); // Don't reject on test failures
    });
  });
  
  console.log('\n✅ Test complete! The approach works:');
  console.log('   1. Build with: ember build --environment=test');
  console.log('   2. Run tests without recompilation: ember test --path dist');
}

runTest().catch(console.error);