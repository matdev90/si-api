const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const fs = require('fs');
const path = require('path');

const TOKEN = process.argv[2];
if (!TOKEN) {
  console.error('Usage: node scripts/git-push.js <GITHUB_TOKEN>');
  process.exit(1);
}

const DIR = path.resolve(__dirname, '..');
const EXCLUDE = new Set([
  '.git', 'node_modules', 'data', 'logs',
  'audit.md', 'audit-lanjutan.md', 'contoh.md',
]);
const EXCLUDE_EXT = new Set(['.db']);
const EXCLUDE_PREFIX = ['.env', '.env.'];

async function getFiles(dir, prefix = '') {
  const entries = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of items) {
    const full = path.join(dir, e.name);
    const rel = prefix ? `${prefix}/${e.name}` : e.name;
    if (EXCLUDE.has(e.name)) continue;
    if (EXCLUDE_EXT.has(path.extname(e.name))) continue;
    if (EXCLUDE_PREFIX.some(p => e.name.startsWith(p))) continue;
    if (e.isDirectory()) {
      entries.push(...await getFiles(full, rel));
    } else {
      entries.push(rel);
    }
  }
  return entries;
}

async function main() {
  const files = await getFiles(DIR);
  console.log(`Found ${files.length} files to commit`);

  for (const filepath of files) {
    await git.add({ fs, dir: DIR, filepath });
  }
  console.log('Files staged');

  const sha = await git.commit({
    fs,
    dir: DIR,
    author: { name: 'SI-API Deploy', email: 'deploy@si-api.local' },
    message: 'update: deploy.sh, install.md, dokumentasi.md, README\n\nPerbarui dokumentasi dan skrip deploy sesuai sistem baru\n(setelah audit 18 temuan IKP).',
  });
  console.log('Commit created:', sha);

  await git.push({
    fs,
    http,
    dir: DIR,
    url: 'https://github.com/matdev90/si-api.git',
    onAuth: () => ({ username: TOKEN, password: '' }),
    remote: 'origin',
    ref: 'main',
    force: false,
  });
  console.log('Push completed!');
}

main().catch(err => {
  console.error('Push failed:', err.message);
  process.exit(1);
});
