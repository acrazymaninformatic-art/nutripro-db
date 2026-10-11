const fs = require('fs');

async function check() {
  const content = fs.readFileSync('src/lib/nutrition/food-images.ts', 'utf8');
  const urls = [...content.matchAll(/https:\/\/images\.unsplash\.com\/[^\'\"]+/g)].map(m => m[0]);
  const uniqueUrls = [...new Set(urls)];
  console.log('Testing', uniqueUrls.length, 'unique URLs...');

  const bad = [];
  for (const url of uniqueUrls) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (res.status !== 200) {
        bad.push({ url, status: res.status });
      }
    } catch (e) {
      bad.push({ url, error: e.message });
    }
  }

  console.log('Bad URLs count:', bad.length);
  if (bad.length > 0) {
    console.log(bad);
  }
}

check();
