#!/usr/bin/env node

/**
 * HALO Project Roadmap Validator
 * 
 * Validates the PROJECT_ROADMAP.json file for:
 * - Schema correctness
 * - Data integrity
 * - Calculation accuracy
 * - Status consistency
 */

const fs = require('fs');
const path = require('path');

const ROADMAP_PATH = path.join(__dirname, 'PROJECT_ROADMAP.json');
const VALID_STATUSES = ['not-started', 'in-progress', 'completed', 'blocked'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'critical'];

class RoadmapValidator {
  constructor(roadmapPath) {
    this.roadmapPath = roadmapPath;
    this.errors = [];
    this.warnings = [];
    this.roadmap = null;
  }

  validate() {
    console.log('🔍 Validating HALO Project Roadmap...\n');

    try {
      // Load and parse JSON
      const content = fs.readFileSync(this.roadmapPath, 'utf-8');
      this.roadmap = JSON.parse(content);
    } catch (error) {
      this.errors.push(`Failed to load or parse roadmap: ${error.message}`);
      return this.printResults();
    }

    // Run validation checks
    this.validateSchema();
    this.validateTracks();
    this.validateMetadata();
    this.validateTaskIds();
    this.calculateStats();

    return this.printResults();
  }

  validateSchema() {
    const required = ['project', 'model', 'tracks', 'metadata'];
    required.forEach(field => {
      if (!this.roadmap[field]) {
        this.errors.push(`Missing required field: ${field}`);
      }
    });

    if (this.roadmap.model !== 'parallel-no-deps') {
      this.warnings.push(`Model is "${this.roadmap.model}", expected "parallel-no-deps"`);
    }
  }

  validateTracks() {
    if (!Array.isArray(this.roadmap.tracks)) {
      this.errors.push('Tracks must be an array');
      return;
    }

    const trackIds = new Set();

    this.roadmap.tracks.forEach((track, index) => {
      const prefix = `Track ${index + 1} (${track.id || 'unnamed'})`;

      // Required fields
      if (!track.id) this.errors.push(`${prefix}: Missing track ID`);
      if (!track.name) this.errors.push(`${prefix}: Missing track name`);
      if (!track.tasks) this.errors.push(`${prefix}: Missing tasks array`);

      // Duplicate track IDs
      if (track.id) {
        if (trackIds.has(track.id)) {
          this.errors.push(`${prefix}: Duplicate track ID "${track.id}"`);
        }
        trackIds.add(track.id);
      }

      // Status validation
      if (track.status && !VALID_STATUSES.includes(track.status)) {
        this.warnings.push(`${prefix}: Invalid status "${track.status}"`);
      }

      // Priority validation
      if (track.priority && !VALID_PRIORITIES.includes(track.priority)) {
        this.warnings.push(`${prefix}: Invalid priority "${track.priority}"`);
      }

      // Validate tasks
      if (Array.isArray(track.tasks)) {
        this.validateTasks(track.tasks, track.id);
      }
    });
  }

  validateTasks(tasks, trackId) {
    const taskIds = new Set();

    tasks.forEach((task, index) => {
      const prefix = `Track "${trackId}", Task ${index + 1} (${task.id || 'unnamed'})`;

      // Required fields
      if (!task.id) this.errors.push(`${prefix}: Missing task ID`);
      if (!task.name) this.errors.push(`${prefix}: Missing task name`);
      if (!task.description) this.warnings.push(`${prefix}: Missing task description`);

      // Duplicate task IDs within track
      if (task.id) {
        if (taskIds.has(task.id)) {
          this.errors.push(`${prefix}: Duplicate task ID "${task.id}" in track`);
        }
        taskIds.add(task.id);
      }

      // Status validation
      if (!task.status) {
        this.warnings.push(`${prefix}: Missing status`);
      } else if (!VALID_STATUSES.includes(task.status)) {
        this.warnings.push(`${prefix}: Invalid status "${task.status}"`);
      }

      // Estimated hours
      if (typeof task.estimated_hours !== 'number' || task.estimated_hours <= 0) {
        this.warnings.push(`${prefix}: Invalid or missing estimated_hours`);
      }

      // Implementation file for completed tasks
      if (task.status === 'completed' && !task.implementation_file) {
        this.warnings.push(`${prefix}: Completed task missing implementation_file reference`);
      }
    });
  }

  validateMetadata() {
    const meta = this.roadmap.metadata;
    if (!meta) return;

    // Count validation
    const actualTracks = this.roadmap.tracks.length;
    if (meta.total_tracks !== actualTracks) {
      this.errors.push(`Metadata total_tracks (${meta.total_tracks}) doesn't match actual count (${actualTracks})`);
    }

    const actualTasks = this.roadmap.tracks.reduce((sum, track) => {
      return sum + (track.tasks ? track.tasks.length : 0);
    }, 0);
    if (meta.total_tasks !== actualTasks) {
      this.errors.push(`Metadata total_tasks (${meta.total_tasks}) doesn't match actual count (${actualTasks})`);
    }

    const actualHours = this.roadmap.tracks.reduce((sum, track) => {
      return sum + (track.tasks || []).reduce((taskSum, task) => {
        return taskSum + (task.estimated_hours || 0);
      }, 0);
    }, 0);
    if (meta.estimated_total_hours !== actualHours) {
      this.errors.push(`Metadata estimated_total_hours (${meta.estimated_total_hours}) doesn't match calculated sum (${actualHours})`);
    }
  }

  validateTaskIds() {
    // Check for globally duplicate task IDs across all tracks
    const allTaskIds = new Map();

    this.roadmap.tracks.forEach(track => {
      (track.tasks || []).forEach(task => {
        if (task.id) {
          if (allTaskIds.has(task.id)) {
            this.warnings.push(
              `Task ID "${task.id}" appears in multiple tracks: "${allTaskIds.get(task.id)}" and "${track.id}"`
            );
          } else {
            allTaskIds.set(task.id, track.id);
          }
        }
      });
    });
  }

  calculateStats() {
    console.log('📊 Roadmap Statistics:\n');

    const stats = {
      totalTracks: this.roadmap.tracks.length,
      totalTasks: 0,
      totalHours: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      notStartedTasks: 0,
      blockedTasks: 0,
    };

    this.roadmap.tracks.forEach(track => {
      (track.tasks || []).forEach(task => {
        stats.totalTasks++;
        stats.totalHours += task.estimated_hours || 0;

        switch (task.status) {
          case 'completed':
            stats.completedTasks++;
            break;
          case 'in-progress':
            stats.inProgressTasks++;
            break;
          case 'not-started':
            stats.notStartedTasks++;
            break;
          case 'blocked':
            stats.blockedTasks++;
            break;
        }
      });
    });

    const completionPercentage = ((stats.completedTasks / stats.totalTasks) * 100).toFixed(1);

    console.log(`  Total Tracks:        ${stats.totalTracks}`);
    console.log(`  Total Tasks:         ${stats.totalTasks}`);
    console.log(`  Total Hours:         ${stats.totalHours}h`);
    console.log(`  Completed:           ${stats.completedTasks} (${completionPercentage}%)`);
    console.log(`  In Progress:         ${stats.inProgressTasks}`);
    console.log(`  Not Started:         ${stats.notStartedTasks}`);
    if (stats.blockedTasks > 0) {
      console.log(`  Blocked:             ${stats.blockedTasks}`);
    }
    console.log('');
  }

  printResults() {
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('✅ Roadmap is valid!\n');
      return true;
    }

    if (this.errors.length > 0) {
      console.log('❌ Errors found:\n');
      this.errors.forEach(error => console.log(`  - ${error}`));
      console.log('');
    }

    if (this.warnings.length > 0) {
      console.log('⚠️  Warnings:\n');
      this.warnings.forEach(warning => console.log(`  - ${warning}`));
      console.log('');
    }

    return this.errors.length === 0;
  }
}

// Run validation
const validator = new RoadmapValidator(ROADMAP_PATH);
const isValid = validator.validate();

process.exit(isValid ? 0 : 1);
