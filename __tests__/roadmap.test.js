/**
 * Basic tests for HALO roadmap utilities
 * Tests validation and progress tracking functionality
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROADMAP_PATH = path.join(__dirname, '..', 'PROJECT_ROADMAP.json');

describe('Roadmap System', () => {
  test('PROJECT_ROADMAP.json exists and is valid JSON', () => {
    expect(fs.existsSync(ROADMAP_PATH)).toBe(true);
    
    const content = fs.readFileSync(ROADMAP_PATH, 'utf-8');
    const roadmap = JSON.parse(content); // Will throw if invalid
    
    expect(roadmap.project).toBe('HALO');
    expect(roadmap.model).toBe('parallel-no-deps');
    expect(Array.isArray(roadmap.tracks)).toBe(true);
  });

  test('roadmap has required structure', () => {
    const roadmap = JSON.parse(fs.readFileSync(ROADMAP_PATH, 'utf-8'));
    
    // Check required top-level fields
    expect(roadmap).toHaveProperty('project');
    expect(roadmap).toHaveProperty('model');
    expect(roadmap).toHaveProperty('tracks');
    expect(roadmap).toHaveProperty('metadata');
    
    // Check metadata
    expect(roadmap.metadata).toHaveProperty('total_tracks');
    expect(roadmap.metadata).toHaveProperty('total_tasks');
    expect(roadmap.metadata).toHaveProperty('estimated_total_hours');
  });

  test('all tracks have required fields', () => {
    const roadmap = JSON.parse(fs.readFileSync(ROADMAP_PATH, 'utf-8'));
    
    roadmap.tracks.forEach(track => {
      expect(track).toHaveProperty('id');
      expect(track).toHaveProperty('name');
      expect(track).toHaveProperty('description');
      expect(track).toHaveProperty('priority');
      expect(track).toHaveProperty('status');
      expect(track).toHaveProperty('tasks');
      expect(Array.isArray(track.tasks)).toBe(true);
    });
  });

  test('all tasks have required fields', () => {
    const roadmap = JSON.parse(fs.readFileSync(ROADMAP_PATH, 'utf-8'));
    
    roadmap.tracks.forEach(track => {
      track.tasks.forEach(task => {
        expect(task).toHaveProperty('id');
        expect(task).toHaveProperty('name');
        expect(task).toHaveProperty('description');
        expect(task).toHaveProperty('status');
        expect(task).toHaveProperty('estimated_hours');
        expect(typeof task.estimated_hours).toBe('number');
        expect(task.estimated_hours).toBeGreaterThan(0);
      });
    });
  });

  test('task IDs are unique within each track', () => {
    const roadmap = JSON.parse(fs.readFileSync(ROADMAP_PATH, 'utf-8'));
    
    roadmap.tracks.forEach(track => {
      const taskIds = track.tasks.map(t => t.id);
      const uniqueIds = new Set(taskIds);
      expect(uniqueIds.size).toBe(taskIds.length);
    });
  });

  test('metadata totals match actual counts', () => {
    const roadmap = JSON.parse(fs.readFileSync(ROADMAP_PATH, 'utf-8'));
    
    const actualTracks = roadmap.tracks.length;
    const actualTasks = roadmap.tracks.reduce((sum, track) => sum + track.tasks.length, 0);
    const actualHours = roadmap.tracks.reduce((sum, track) => {
      return sum + track.tasks.reduce((taskSum, task) => taskSum + task.estimated_hours, 0);
    }, 0);
    
    expect(roadmap.metadata.total_tracks).toBe(actualTracks);
    expect(roadmap.metadata.total_tasks).toBe(actualTasks);
    expect(roadmap.metadata.estimated_total_hours).toBe(actualHours);
  });

  test('validation script runs successfully', () => {
    try {
      execSync('node validate-roadmap.js', { 
        cwd: path.join(__dirname, '..'),
        stdio: 'pipe'
      });
      // If we get here, validation passed (exit code 0)
      expect(true).toBe(true);
    } catch (error) {
      // Validation failed (non-zero exit code)
      fail('Validation script failed: ' + error.message);
    }
  });

  test('progress script runs successfully', () => {
    try {
      const output = execSync('node roadmap-progress.js json', {
        cwd: path.join(__dirname, '..'),
        encoding: 'utf-8'
      });
      
      const progress = JSON.parse(output);
      expect(progress).toHaveProperty('overall');
      expect(progress).toHaveProperty('byTrack');
      expect(progress.overall).toHaveProperty('total');
      expect(progress.overall).toHaveProperty('completed');
      expect(progress.overall).toHaveProperty('percentage');
    } catch (error) {
      fail('Progress script failed: ' + error.message);
    }
  });

  test('valid task statuses', () => {
    const roadmap = JSON.parse(fs.readFileSync(ROADMAP_PATH, 'utf-8'));
    const validStatuses = ['not-started', 'in-progress', 'completed', 'blocked'];
    
    roadmap.tracks.forEach(track => {
      track.tasks.forEach(task => {
        expect(validStatuses).toContain(task.status);
      });
    });
  });

  test('valid track priorities', () => {
    const roadmap = JSON.parse(fs.readFileSync(ROADMAP_PATH, 'utf-8'));
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    
    roadmap.tracks.forEach(track => {
      expect(validPriorities).toContain(track.priority);
    });
  });

  test('completed tasks have implementation files', () => {
    const roadmap = JSON.parse(fs.readFileSync(ROADMAP_PATH, 'utf-8'));
    
    roadmap.tracks.forEach(track => {
      track.tasks.forEach(task => {
        if (task.status === 'completed') {
          // Completed tasks should ideally have implementation files
          // This is a soft check - we warn if missing but don't fail
          if (!task.implementation_file) {
            console.warn(`Warning: Completed task "${task.name}" missing implementation_file`);
          }
        }
      });
    });
  });
});
