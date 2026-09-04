// scripts/seed_demo_data.js
//
// Usage:
//   node scripts/seed_demo_data.js
//   node scripts/seed_demo_data.js --count 100
//   node scripts/seed_demo_data.js --count 100 --seed 7

const { execFileSync } = require('child_process');
const path = require('path');

function main() {
  const args = process.argv.slice(2);
  const countIdx = args.indexOf('--count');
  const seedIdx = args.indexOf('--seed');

  const count = countIdx !== -1 ? args[countIdx + 1] : '50';
  const generatorPath = path.join(__dirname, '..', 'data', 'generator', 'generate_events.py');

  const cliArgs = [generatorPath, '--count', count];
  if (seedIdx !== -1) {
    cliArgs.push('--seed', args[seedIdx + 1]);
  }

  console.log(`[seed_demo_data] Running: python3 ${cliArgs.join(' ')}`);

  try {
    const output = execFileSync('python3', cliArgs, { encoding: 'utf-8' });
    console.log(output.trim());
  } catch (err) {
    console.error('[seed_demo_data] Failed to run generator. Is python3 installed?');
    console.error(err.message);
    process.exit(1);
  }
}

main();