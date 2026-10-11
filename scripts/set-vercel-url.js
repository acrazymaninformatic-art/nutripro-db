const { execSync } = require('child_process');

const prodUrl = 'https://nutripro-lyart.vercel.app';
const vars = {
  'APP_PUBLIC_URL': prodUrl,
  'NEXTAUTH_URL': prodUrl
};

for (const [key, val] of Object.entries(vars)) {
  console.log(`Setting ${key} to ${val}...`);
  try {
    const out = execSync(`npx --yes vercel env add ${key} production,preview,development --value "${val}" --yes --force`, {
      encoding: 'utf-8',
      timeout: 20000,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    console.log(`✓ ${key} set successfully: ${out.trim().split('\n')[0]}`);
  } catch (err) {
    console.log(`Error setting ${key}:`, err.stdout || err.message);
  }
}

console.log('Finished setting production URLs.');
