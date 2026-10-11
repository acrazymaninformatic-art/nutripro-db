const { execSync } = require('child_process');

const vars = {
  'NEXTAUTH_SECRET': 'nutripro-super-secret-key-2026',
  'SMTP_PORT': '587',
  'SMTP_USER': 'evavidalinfo@gmail.com',
  'SMTP_PASS': 'bocpzmoggkajgeqk',
  'SMTP_FROM': 'evavidalinfo@gmail.com',
  'SMTP_FROM_NAME': 'Eva Vidal - Consulta Nutricional'
};

for (const [key, val] of Object.entries(vars)) {
  console.log(`Setting ${key}...`);
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

console.log('Finished setting environment variables.');
