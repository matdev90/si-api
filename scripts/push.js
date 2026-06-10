const fs = require('fs');
const path = require('path');

const TOKEN = process.argv[2];
if (!TOKEN) { console.error('Usage: node scripts/push.js <GITHUB_TOKEN>'); process.exit(1); }

const OWNER = 'matdev90';
const REPO = 'si-api';
const DIR = path.resolve(__dirname, '..');
const GIT_URL = `https://api.github.com/repos/${OWNER}/${REPO}/git`;

async function gh(apiPath, method = 'GET', body = null) {
  const opts = {
    method,
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'si-api-push',
      'Content-Type': 'application/json',
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const url = `${GIT_URL}${apiPath}`;
  const res = await fetch(url, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(`GitHub API ${method} ${apiPath}: ${res.status} - ${data.message}`);
  return data;
}

function walk(dir, prefix) {
  const entries = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of items) {
    const full = path.join(dir, e.name);
    const rel = prefix ? path.posix.join(prefix, e.name) : e.name;
    if (e.name === '.git' || e.name === 'node_modules' || e.name === 'data' || e.name === 'logs' || rel.endsWith('.db') || e.name === '.env') continue;
    if (e.isDirectory()) {
      entries.push(...walk(full, rel));
    } else {
      entries.push({ path: rel, full });
    }
  }
  return entries;
}

async function pushViaApi() {
  const files = walk(DIR, '');
  console.log(`Found ${files.length} files`);

  // Step 1: Create blobs for all files
  console.log('Creating blobs...');
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const content = fs.readFileSync(f.full);
    const isText = !f.path.endsWith('.png');
    let body;
    if (isText) {
      body = { content: content.toString('utf8'), encoding: 'utf-8' };
    } else {
      body = { content: content.toString('base64'), encoding: 'base64' };
    }
    const blob = await gh('/blobs', 'POST', body);
    files[i].sha = blob.sha;
    if ((i + 1) % 20 === 0) console.log(`  blobs: ${i + 1}/${files.length}`);
  }
  console.log(`  blobs: ${files.length}/${files.length} done`);

  // Step 2: Create tree with SHA references
  console.log('Creating tree...');
  const treeEntries = files.map(f => ({
    path: f.path,
    mode: '100644',
    type: 'blob',
    sha: f.sha,
  }));
  const tree = await gh('/trees', 'POST', { tree: treeEntries });
  const treeSha = tree.sha;
  console.log(`Tree: ${treeSha.substring(0, 8)}`);

  // Step 3: Create commit
  console.log('Creating commit...');
  const commit = await gh('/commits', 'POST', {
    message: 'Initial commit: SI-API v1.0.0\n\nSistem Informasi Analisa Pelaporan Insiden\nRSUD dr. R. Soedjono Selong',
    tree: treeSha,
    parents: [],
    author: { name: 'matdev90', email: 'matdev90@users.noreply.github.com', date: new Date().toISOString() },
    committer: { name: 'matdev90', email: 'matdev90@users.noreply.github.com', date: new Date().toISOString() },
  });
  console.log(`Commit: ${commit.sha.substring(0, 8)}`);

  // Step 4: Create branch
  console.log('Creating main branch...');
  await gh('/refs', 'POST', {
    ref: 'refs/heads/main',
    sha: commit.sha,
  });

  console.log('Push completed successfully!');
  console.log(`https://github.com/${OWNER}/${REPO}`);
}

pushViaApi()
  .then(() => console.log('Done!'))
  .catch(err => { console.error('Push failed:', err.message); process.exit(1); });
