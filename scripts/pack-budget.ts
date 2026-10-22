/** Fails when the packed package's unpacked size exceeds the install budget. */
import { execFileSync } from 'node:child_process';
import { checkPackBudget, parsePackJson } from './lib/pack.ts';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const json = execFileSync(npm, ['pack', '--dry-run', '--json', '--ignore-scripts'], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'ignore'],
  shell: process.platform === 'win32',
});
const { ok, message } = checkPackBudget(parsePackJson(json));
if (ok) console.info(message);
else {
  console.error(message);
  process.exitCode = 1;
}
