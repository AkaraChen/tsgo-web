import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const runner = fileURLToPath(new URL('./run.mjs', import.meta.url));
const dir = await mkdtemp(join(tmpdir(), 'tsgo-tinygo-'));
function run(args) {
  const result = spawnSync(process.execPath, [runner, ...args], {
    cwd: dir, encoding: 'utf8', timeout: 120_000,
  });
  if (result.error) throw result.error;
  assert.equal(result.signal, null, result.stderr);
  return result;
}
try {
  const version = run(['--version']);
  assert.equal(version.status, 0, version.stderr);
  assert.match(version.stdout, /Version/);
  await writeFile(join(dir, 'tsconfig.json'), JSON.stringify({
    compilerOptions: { strict: true, target: 'es2020', outDir: 'out', skipLibCheck: true, singleThreaded: true },
    files: ['main.ts'],
  }));
  await writeFile(join(dir, 'main.ts'), 'const value: number = 42; console.log(value);\n');
  const good = run(['-p', 'tsconfig.json', '--pretty', 'false']);
  assert.equal(good.status, 0, good.stdout + good.stderr);
  const emitted = await readFile(join(dir, 'out/main.js'), 'utf8');
  assert.match(emitted, /console\.log/);
  const js = spawnSync(process.execPath, [join(dir, 'out/main.js')], { encoding: 'utf8' });
  assert.equal(js.status, 0, js.stderr);
  assert.equal(js.stdout.trim(), '42');
  await writeFile(join(dir, 'main.ts'), 'const value: number = "wrong";\n');
  const bad = run(['-p', 'tsconfig.json', '--noEmit', '--pretty', 'false']);
  assert.notEqual(bad.status, 0);
  assert.match(bad.stdout + bad.stderr, /TS2322/);
  console.log('PASS: version, tsconfig, standard libraries, JS emit/execution, TS2322 and exit status');
} finally {
  await rm(dir, { recursive: true, force: true });
}
