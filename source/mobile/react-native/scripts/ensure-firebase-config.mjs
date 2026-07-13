import {copyFile, access} from 'node:fs/promises';
import {constants} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, resolve} from 'node:path';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const target = resolve(projectRoot, 'firebaseConfig.local.ts');
const example = resolve(projectRoot, 'firebaseConfig.local.example.ts');

try {
  await access(target, constants.F_OK);
} catch {
  await copyFile(example, target);
  console.warn('Created firebaseConfig.local.ts from the placeholder template.');
}
