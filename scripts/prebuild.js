import fs from 'fs';
import path from 'path';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const versionData = {
  version: Date.now().toString(),
  builtAt: new Date().toISOString()
};

fs.writeFileSync(path.join(publicDir, 'version_info.json'), JSON.stringify(versionData, null, 2));
console.log('Successfully generated version_info.json for cache busting:', versionData);
