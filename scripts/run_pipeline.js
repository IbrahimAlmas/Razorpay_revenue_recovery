// scripts/run_pipeline.js
//
// Usage:
//   node scripts/run_pipeline.js
//   node scripts/run_pipeline.js data/raw/events_batch_02.json
//   node scripts/run_pipeline.js --dry-run

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { runPipeline } = require('../src/pipeline');

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const fileArg = args.find((a) => !a.startsWith('--'));

  const eventsPath = fileArg
    ? path.resolve(fileArg)
    : path.join(__dirname, '..', 'data', 'raw', 'events_batch_01.json');

  if (!fs.existsSync(eventsPath)) {
    console.error(`Events file not found: ${eventsPath}`);
    console.error('Run "node scripts/seed_demo_data.js" first, or pass a path.');
    process.exit(1);
  }

  const rawEvents = JSON.parse(fs.readFileSync(eventsPath, 'utf-8'));
  console.log(`[run_pipeline] Loaded ${rawEvents.length} events from ${eventsPath}${dryRun ? ' (dry run)' : ''}`);

  const results = await runPipeline(rawEvents, { dryRun });

  const summary = results.reduce((acc, r) => {
    const key = r.actionResult.action;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  console.log('\n[run_pipeline] Action breakdown:');
  console.table(summary);
  console.log(`\n[run_pipeline] Processed ${results.length} sessions.`);
}

main().catch((err) => {
  console.error('[run_pipeline] Fatal error:', err);
  process.exit(1);
});