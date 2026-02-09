#!/usr/bin/env node

/**
 * Simple standalone test for HALO roadmap
 * Doesn't require Jest or any test framework
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROADMAP_PATH = path.join(__dirname, 'PROJECT_ROADMAP.json');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  ${error.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

console.log('\n🧪 Running Roadmap Tests...\n');

// Test 1: File exists
test('PROJECT_ROADMAP.json exists', () => {
  assert(fs.existsSync(ROADMAP_PATH), 'Roadmap file not found');
});

// Test 2: Valid JSON
let roadmap;
test('PROJECT_ROADMAP.json is valid JSON', () => {
  const content = fs.readFileSync(ROADMAP_PATH, 'utf-8');
  roadmap = JSON.parse(content);
  assert(roadmap !== null, 'Failed to parse JSON');
});

// Test 3: Required structure
test('Roadmap has required structure', () => {
  assert(roadmap.project === 'HALO', 'Missing project field');
  assert(roadmap.model === 'parallel-no-deps', 'Missing or incorrect model');
  assert(Array.isArray(roadmap.tracks), 'Tracks is not an array');
  assert(roadmap.metadata, 'Missing metadata');
});

// Test 4: Tracks structure
test('All tracks have required fields', () => {
  roadmap.tracks.forEach((track, i) => {
    assert(track.id, `Track ${i} missing id`);
    assert(track.name, `Track ${i} missing name`);
    assert(track.description, `Track ${i} missing description`);
    assert(track.priority, `Track ${i} missing priority`);
    assert(track.status, `Track ${i} missing status`);
    assert(Array.isArray(track.tasks), `Track ${i} tasks is not an array`);
  });
});

// Test 5: Tasks structure
test('All tasks have required fields', () => {
  roadmap.tracks.forEach((track) => {
    track.tasks.forEach((task, i) => {
      assert(task.id, `Task ${i} in ${track.id} missing id`);
      assert(task.name, `Task ${i} in ${track.id} missing name`);
      assert(task.description, `Task ${i} in ${track.id} missing description`);
      assert(task.status, `Task ${i} in ${track.id} missing status`);
      assert(typeof task.estimated_hours === 'number', `Task ${i} in ${track.id} missing estimated_hours`);
      assert(task.estimated_hours > 0, `Task ${i} in ${track.id} has invalid estimated_hours`);
    });
  });
});

// Test 6: Unique task IDs per track
test('Task IDs are unique within each track', () => {
  roadmap.tracks.forEach(track => {
    const taskIds = track.tasks.map(t => t.id);
    const uniqueIds = new Set(taskIds);
    assert(uniqueIds.size === taskIds.length, `Duplicate task IDs in track ${track.id}`);
  });
});

// Test 7: Metadata accuracy
test('Metadata totals match actual counts', () => {
  const actualTracks = roadmap.tracks.length;
  const actualTasks = roadmap.tracks.reduce((sum, track) => sum + track.tasks.length, 0);
  const actualHours = roadmap.tracks.reduce((sum, track) => {
    return sum + track.tasks.reduce((taskSum, task) => taskSum + task.estimated_hours, 0);
  }, 0);
  
  assert(roadmap.metadata.total_tracks === actualTracks, 
    `Metadata tracks count ${roadmap.metadata.total_tracks} doesn't match actual ${actualTracks}`);
  assert(roadmap.metadata.total_tasks === actualTasks,
    `Metadata tasks count ${roadmap.metadata.total_tasks} doesn't match actual ${actualTasks}`);
  assert(roadmap.metadata.estimated_total_hours === actualHours,
    `Metadata hours ${roadmap.metadata.estimated_total_hours} doesn't match actual ${actualHours}`);
});

// Test 8: Valid statuses
test('All tasks have valid statuses', () => {
  const validStatuses = ['not-started', 'in-progress', 'completed', 'blocked'];
  roadmap.tracks.forEach(track => {
    track.tasks.forEach(task => {
      assert(validStatuses.includes(task.status), 
        `Task ${task.id} has invalid status: ${task.status}`);
    });
  });
});

// Test 9: Valid priorities
test('All tracks have valid priorities', () => {
  const validPriorities = ['low', 'medium', 'high', 'critical'];
  roadmap.tracks.forEach(track => {
    assert(validPriorities.includes(track.priority),
      `Track ${track.id} has invalid priority: ${track.priority}`);
  });
});

// Test 10: Validation script
test('Validation script runs successfully', () => {
  try {
    execSync('node validate-roadmap.js', { 
      cwd: __dirname,
      stdio: 'pipe'
    });
  } catch (error) {
    throw new Error(`Validation script failed with exit code ${error.status}`);
  }
});

// Test 11: Progress script
test('Progress script runs successfully', () => {
  try {
    const output = execSync('node roadmap-progress.js json', {
      cwd: __dirname,
      encoding: 'utf-8'
    });
    
    const progress = JSON.parse(output);
    assert(progress.overall, 'Missing overall progress');
    assert(progress.byTrack, 'Missing track progress');
    assert(typeof progress.overall.total === 'number', 'Missing overall.total');
    assert(typeof progress.overall.completed === 'number', 'Missing overall.completed');
  } catch (error) {
    throw new Error(`Progress script failed: ${error.message}`);
  }
});

// Summary
console.log('\n' + '─'.repeat(50));
console.log(`✓ Passed: ${passed}`);
if (failed > 0) {
  console.log(`✗ Failed: ${failed}`);
  console.log('\n❌ Some tests failed\n');
  process.exit(1);
} else {
  console.log('\n✅ All tests passed!\n');
  process.exit(0);
}
