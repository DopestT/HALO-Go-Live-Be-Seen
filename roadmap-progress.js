#!/usr/bin/env node

/**
 * HALO Roadmap Progress Tracker
 * 
 * Generates a progress report from PROJECT_ROADMAP.json
 * Useful for stand-ups, status updates, and milestone tracking
 */

const fs = require('fs');
const path = require('path');

const ROADMAP_PATH = path.join(__dirname, 'PROJECT_ROADMAP.json');

class ProgressTracker {
  constructor(roadmapPath) {
    this.roadmapPath = roadmapPath;
    this.roadmap = null;
  }

  generateReport(format = 'console') {
    try {
      const content = fs.readFileSync(this.roadmapPath, 'utf-8');
      this.roadmap = JSON.parse(content);
    } catch (error) {
      console.error(`❌ Failed to load roadmap: ${error.message}`);
      process.exit(1);
    }

    switch (format) {
      case 'markdown':
        return this.generateMarkdownReport();
      case 'json':
        return this.generateJsonReport();
      case 'console':
      default:
        return this.generateConsoleReport();
    }
  }

  calculateProgress() {
    const progress = {
      overall: {
        total: 0,
        completed: 0,
        inProgress: 0,
        notStarted: 0,
        blocked: 0,
        totalHours: 0,
        completedHours: 0,
      },
      byTrack: [],
      byPriority: {
        critical: { total: 0, completed: 0 },
        high: { total: 0, completed: 0 },
        medium: { total: 0, completed: 0 },
        low: { total: 0, completed: 0 },
      },
      recentlyCompleted: [],
      currentlyInProgress: [],
      upNext: [],
    };

    this.roadmap.tracks.forEach(track => {
      const trackProgress = {
        id: track.id,
        name: track.name,
        priority: track.priority,
        total: track.tasks.length,
        completed: 0,
        inProgress: 0,
        notStarted: 0,
        blocked: 0,
        totalHours: 0,
        completedHours: 0,
        percentage: 0,
      };

      track.tasks.forEach(task => {
        progress.overall.total++;
        progress.overall.totalHours += task.estimated_hours || 0;
        trackProgress.totalHours += task.estimated_hours || 0;

        // Count by status
        switch (task.status) {
          case 'completed':
            progress.overall.completed++;
            progress.overall.completedHours += task.estimated_hours || 0;
            trackProgress.completed++;
            trackProgress.completedHours += task.estimated_hours || 0;
            progress.recentlyCompleted.push({
              track: track.name,
              task: task.name,
              hours: task.estimated_hours,
            });
            break;
          case 'in-progress':
            progress.overall.inProgress++;
            trackProgress.inProgress++;
            progress.currentlyInProgress.push({
              track: track.name,
              task: task.name,
              hours: task.estimated_hours,
            });
            break;
          case 'not-started':
            progress.overall.notStarted++;
            trackProgress.notStarted++;
            if (progress.upNext.length < 5) {
              progress.upNext.push({
                track: track.name,
                task: task.name,
                hours: task.estimated_hours,
              });
            }
            break;
          case 'blocked':
            progress.overall.blocked++;
            trackProgress.blocked++;
            break;
        }

        // Count by priority
        if (track.priority && progress.byPriority[track.priority]) {
          progress.byPriority[track.priority].total++;
          if (task.status === 'completed') {
            progress.byPriority[track.priority].completed++;
          }
        }
      });

      trackProgress.percentage = trackProgress.total > 0
        ? ((trackProgress.completed / trackProgress.total) * 100).toFixed(1)
        : 0;

      progress.byTrack.push(trackProgress);
    });

    progress.overall.percentage = progress.overall.total > 0
      ? ((progress.overall.completed / progress.overall.total) * 100).toFixed(1)
      : 0;

    progress.overall.hoursPercentage = progress.overall.totalHours > 0
      ? ((progress.overall.completedHours / progress.overall.totalHours) * 100).toFixed(1)
      : 0;

    return progress;
  }

  generateConsoleReport() {
    const progress = this.calculateProgress();

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║         HALO PROJECT ROADMAP - PROGRESS REPORT         ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // Overall Progress
    console.log('📊 OVERALL PROGRESS\n');
    console.log(`  Tasks:         ${progress.overall.completed}/${progress.overall.total} (${progress.overall.percentage}%)`);
    console.log(`  Hours:         ${progress.overall.completedHours}h/${progress.overall.totalHours}h (${progress.overall.hoursPercentage}%)`);
    console.log(`  In Progress:   ${progress.overall.inProgress}`);
    console.log(`  Not Started:   ${progress.overall.notStarted}`);
    if (progress.overall.blocked > 0) {
      console.log(`  Blocked:       ${progress.overall.blocked}`);
    }
    console.log('');

    // Progress Bar
    const barLength = 50;
    const completedBars = Math.round((progress.overall.percentage / 100) * barLength);
    const progressBar = '█'.repeat(completedBars) + '░'.repeat(barLength - completedBars);
    console.log(`  [${progressBar}] ${progress.overall.percentage}%\n`);

    // Priority Breakdown
    console.log('🎯 BY PRIORITY\n');
    ['critical', 'high', 'medium', 'low'].forEach(priority => {
      const p = progress.byPriority[priority];
      if (p.total > 0) {
        const pct = ((p.completed / p.total) * 100).toFixed(0);
        const icon = priority === 'critical' ? '🔴' : priority === 'high' ? '🟡' : '🟢';
        console.log(`  ${icon} ${priority.toUpperCase().padEnd(10)} ${p.completed}/${p.total} (${pct}%)`);
      }
    });
    console.log('');

    // Track Progress
    console.log('📋 BY TRACK\n');
    progress.byTrack
      .sort((a, b) => b.percentage - a.percentage)
      .forEach(track => {
        const status = track.percentage === 100 ? '✅' : track.percentage > 0 ? '🔄' : '⏸️';
        const priorityIcon = track.priority === 'critical' ? '🔴' : track.priority === 'high' ? '🟡' : '🟢';
        console.log(`  ${status} ${priorityIcon} ${track.name.padEnd(35)} ${track.completed}/${track.total} (${track.percentage}%)`);
      });
    console.log('');

    // Currently In Progress
    if (progress.currentlyInProgress.length > 0) {
      console.log('🔄 IN PROGRESS\n');
      progress.currentlyInProgress.slice(0, 5).forEach(item => {
        console.log(`  • ${item.task} (${item.track}) - ${item.hours}h`);
      });
      console.log('');
    }

    // Recently Completed (limit to last 5)
    if (progress.recentlyCompleted.length > 0) {
      console.log('✅ RECENTLY COMPLETED\n');
      progress.recentlyCompleted.slice(0, 5).forEach(item => {
        console.log(`  • ${item.task} (${item.track}) - ${item.hours}h`);
      });
      console.log('');
    }

    // Up Next
    if (progress.upNext.length > 0) {
      console.log('⏭️  UP NEXT\n');
      progress.upNext.forEach(item => {
        console.log(`  • ${item.task} (${item.track}) - ${item.hours}h`);
      });
      console.log('');
    }

    console.log('─────────────────────────────────────────────────────────────\n');
    console.log(`Last Updated: ${new Date(this.roadmap.metadata.updated_at).toLocaleString()}\n`);
  }

  generateMarkdownReport() {
    const progress = this.calculateProgress();
    let md = '# HALO Project Progress Report\n\n';
    md += `**Generated:** ${new Date().toLocaleString()}\n\n`;
    md += '## Overall Progress\n\n';
    md += `- **Tasks:** ${progress.overall.completed}/${progress.overall.total} (${progress.overall.percentage}%)\n`;
    md += `- **Hours:** ${progress.overall.completedHours}h/${progress.overall.totalHours}h (${progress.overall.hoursPercentage}%)\n`;
    md += `- **In Progress:** ${progress.overall.inProgress}\n`;
    md += `- **Not Started:** ${progress.overall.notStarted}\n\n`;

    md += '## Progress by Track\n\n';
    md += '| Track | Priority | Completed | Total | % |\n';
    md += '|-------|----------|-----------|-------|---|\n';
    progress.byTrack.forEach(track => {
      md += `| ${track.name} | ${track.priority} | ${track.completed} | ${track.total} | ${track.percentage}% |\n`;
    });

    console.log(md);
  }

  generateJsonReport() {
    const progress = this.calculateProgress();
    console.log(JSON.stringify(progress, null, 2));
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const format = args[0] || 'console';

if (!['console', 'markdown', 'json'].includes(format)) {
  console.error('Usage: node roadmap-progress.js [console|markdown|json]');
  process.exit(1);
}

// Generate report
const tracker = new ProgressTracker(ROADMAP_PATH);
tracker.generateReport(format);
