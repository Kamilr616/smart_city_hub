import {cp, mkdir} from 'node:fs/promises';

const source = new URL('../lib/public/', import.meta.url);
const destination = new URL('../dist/public/', import.meta.url);

await mkdir(destination, {recursive: true});
await cp(source, destination, {recursive: true});
