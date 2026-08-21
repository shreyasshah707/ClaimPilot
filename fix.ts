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

  // Fix import type
  content = content.replace(/import\s+{([^}]*(?:Claim|DamageAnalysis|FraudAnalysis|DamageArea|User|Role|ClaimStatus)[^}]*)}\s+from/g, 'import type { $1 } from');
  
  // Fix path issues in pages
  if (filePath.includes('pages\\') || filePath.includes('pages/')) {
    content = content.replace(/from '\.\.\/ui\//g, "from '../../components/ui/");
  }

  // Fix specific issues
  if (filePath.endsWith('CustomerDashboard.tsx')) {
    content = content.replace(/onMouseOver={\(e\)/g, 'onMouseOver={(e: any)');
    content = content.replace(/onMouseOut={\(e\)/g, 'onMouseOut={(e: any)');
  }

  if (filePath.endsWith('authStore.ts')) {
    content = content.replace(/return \(\) => this\.listeners\.delete\(listener\);/g, 'this.listeners.delete(listener); return undefined;');
  }
  
  if (filePath.endsWith('claims.ts')) {
    // Make status 'Pending Review' valid by fixing the type in claim.ts instead
  }

  writeFileSync(filePath, content);
});

console.log('Fixes applied.');
