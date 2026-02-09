# HALO Roadmap Quick Reference

Quick guide for using the HALO project roadmap tracking system.

## Files

- **`PROJECT_ROADMAP.json`** - Structured roadmap data (machine-readable)
- **`ROADMAP.md`** - Human-readable roadmap overview
- **`validate-roadmap.js`** - Validation script
- **`roadmap-progress.js`** - Progress tracking script
- **`test-roadmap.js`** - Test suite

## NPM Scripts

```bash
# Validate roadmap data integrity
npm run roadmap:validate

# View progress report (console)
npm run roadmap:progress

# Generate markdown progress report
npm run roadmap:progress:md

# Generate JSON progress report
npm run roadmap:progress:json

# Run roadmap tests
npm run test:roadmap
```

## Quick Stats

- **Model:** Parallel-no-deps (all tracks are independent)
- **Total Tracks:** 12
- **Total Tasks:** 50
- **Total Hours:** 1,464h
- **Current Progress:** 16% (8/50 tasks complete)

## Track Priority Levels

- 🔴 **Critical** - Essential for launch (7 tracks)
- 🟡 **High** - Important for success (4 tracks)
- 🟢 **Medium** - Nice to have (1 track)

## Task Status Values

- `not-started` - Not yet begun
- `in-progress` - Currently being worked on
- `completed` - Finished and verified
- `blocked` - Waiting on dependencies

## Updating the Roadmap

### 1. Edit `PROJECT_ROADMAP.json`

Update task status, assignees, or add new tasks as needed.

### 2. Validate Changes

```bash
npm run roadmap:validate
```

This ensures:
- JSON is valid
- Required fields are present
- Metadata totals are correct
- No duplicate task IDs within tracks
- Valid status and priority values

### 3. Update Metadata

If you add/remove tasks or change hours, update the metadata:

```json
"metadata": {
  "total_tracks": 12,
  "total_tasks": 50,
  "estimated_total_hours": 1464,
  "updated_at": "2026-02-09T21:49:27.897Z"
}
```

### 4. Run Tests

```bash
npm run test:roadmap
```

## Roadmap Structure

### Track Object

```json
{
  "id": "unique_track_id",
  "name": "Track Name",
  "description": "Track description",
  "priority": "critical|high|medium|low",
  "status": "not-started|in-progress|completed",
  "tasks": [...]
}
```

### Task Object

```json
{
  "id": "unique_task_id",
  "name": "Task Name",
  "description": "Task description",
  "status": "not-started|in-progress|completed|blocked",
  "assignee": "username or null",
  "estimated_hours": 24,
  "implementation_file": "path/to/file.ts" // optional, for completed tasks
}
```

## Best Practices

1. **Keep task IDs unique** within each track (validated automatically)
2. **Add implementation_file** to completed tasks for reference
3. **Update metadata** when adding/removing tasks
4. **Run validation** before committing changes
5. **Update timestamps** in metadata when making changes
6. **Keep descriptions clear** for team understanding

## Common Tasks

### Mark a Task as Complete

1. Change `status` to `"completed"`
2. Add `implementation_file` with the path to the main implementation
3. Validate: `npm run roadmap:validate`

### Add a New Task

1. Add task object to appropriate track's `tasks` array
2. Update `metadata.total_tasks` count
3. Update `metadata.estimated_total_hours` total
4. Validate: `npm run roadmap:validate`

### Add a New Track

1. Add track object to `tracks` array
2. Update `metadata.total_tracks` count
3. Update task and hours totals
4. Validate: `npm run roadmap:validate`

### Generate a Status Report

```bash
# Console output
npm run roadmap:progress

# Markdown file (can pipe to file)
npm run roadmap:progress:md > status-report.md

# JSON for programmatic use
npm run roadmap:progress:json > status.json
```

## Integration

### With Git

Roadmap validation can be added to pre-commit hooks:

```bash
#!/bin/bash
npm run roadmap:validate || exit 1
```

### With CI/CD

Add validation to your CI pipeline:

```yaml
- name: Validate Roadmap
  run: npm run roadmap:validate
```

### With Project Management Tools

Use the JSON output for integration:

```bash
npm run roadmap:progress:json | jq '.overall.percentage'
```

## Troubleshooting

### Validation Fails

- Check for duplicate task IDs
- Verify all required fields are present
- Ensure metadata totals match actual counts
- Validate JSON syntax

### Progress Script Errors

- Ensure PROJECT_ROADMAP.json exists
- Verify JSON is valid
- Check file permissions

## Support

For issues or questions, see:
- [ROADMAP.md](./ROADMAP.md) - Full roadmap documentation
- [PROJECT_ROADMAP.json](./PROJECT_ROADMAP.json) - Raw data structure
