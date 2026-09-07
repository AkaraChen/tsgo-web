import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { compile } from '../web/compiler.js';

const module = await WebAssembly.compile(await readFile(new URL('../web/tsgo.wasm', import.meta.url)));
const good = await compile(module, `
interface User { name: string; language: string; }
const greet = (user: User): string => { return \`Hello, \${user.name}!\`; };
console.log(greet({name: "TinyGo", language: "TypeScript"}));
`);
assert.equal(good.exitCode, 0, good.diagnostics);
assert.match(good.javascript, /const greet/);
assert.doesNotMatch(good.javascript, /interface User/);
const bad = await compile(module, 'const count: number = "hello";');
assert.notEqual(bad.exitCode, 0);
assert.match(bad.diagnostics, /TS2322/);
const generic = await compile(module, 'function first<T>(items: T[]): T | undefined { return items[0]; } console.log(first([1,2,3]));');
assert.equal(generic.exitCode, 0, generic.diagnostics);
assert.match(generic.javascript, /function first\(items\)/);
const fresh = await compile(module, 'export const fresh: number = 42;');
assert.equal(fresh.exitCode, 0, fresh.diagnostics);
assert.doesNotMatch(fresh.javascript, /greet|first|count/);
console.log('PASS: browser WASI, interface/call regression, JS emission, TS2322, generics, isolated compilations');
