import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

/** Generated assets are build output; create them once if a fresh checkout runs the tests. */
export default function setup(): void {
  if (!existsSync(new URL('../src/generated/codes.ts', import.meta.url))) {
    execFileSync(process.execPath, ['scripts/generate.ts'], { stdio: 'inherit' });
  }
}
