import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const srcDir = './src';

function walk(dir: string, callback: (path: string) => void) {
  const files = readdirSync(dir);
  for (const file of files) {
    const fullPath = join(dir, file);
    if (statSync(fullPath).isDirectory()) {
      walk(fullPath, callback);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      callback(fullPath);
    }
  }
}

walk(srcDir, (filePath) => {
  let content = readFileSync(filePath, 'utf-8');
  content = content.replace(/import type {/g, 'import {');
  writeFileSync(filePath, content);
});

console.log('Fixed imports.');
