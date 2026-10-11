const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'src/app/dashboard/plans/[id]/plan-viewer.tsx',
  'src/app/dashboard/plans/page.tsx',
  'src/app/dashboard/plans/new/plan-builder-form.tsx',
  'src/app/dashboard/page.tsx',
  'src/app/dashboard/settings/page.tsx',
  'src/app/dashboard/patients/page.tsx',
  'src/app/dashboard/patients/[id]/page.tsx',
  'src/app/dashboard/patients/[id]/blood-analysis-card.tsx',
  'src/app/dashboard/foods/page.tsx',
  'src/app/dashboard/recipes/page.tsx',
  'src/app/dashboard/recipes/[id]/page.tsx',
  'src/app/dashboard/recipes/new/recipe-form.tsx',
  'src/components/nutrition/exchange-guide.tsx',
];

for (const relPath of filesToUpdate) {
  const fullPath = path.resolve(__dirname, '..', relPath);
  if (!fs.existsSync(fullPath)) {
    console.log(`Skipping (not found): ${relPath}`);
    continue;
  }

  let content = fs.readFileSync(fullPath, 'utf8');

  // Replace emerald with blue
  content = content.replace(/emerald-/g, 'blue-');

  // Replace teal with sky in gradients
  content = content.replace(/teal-/g, 'sky-');

  // In specific files, replace green branding with blue
  if (relPath.includes('plan-viewer') || relPath.includes('dashboard/page') || relPath.includes('patients')) {
    content = content.replace(/text-green-600/g, 'text-blue-600');
    content = content.replace(/text-green-700/g, 'text-blue-700');
    content = content.replace(/text-green-800/g, 'text-blue-800');
    content = content.replace(/bg-green-600/g, 'bg-blue-600');
    content = content.replace(/bg-green-100/g, 'bg-blue-100');
    content = content.replace(/bg-green-50/g, 'bg-blue-50');
    content = content.replace(/border-green-600/g, 'border-blue-600');
  }

  // Doctor defaults to Eva Vidal
  content = content.replace(/Dr\. Consulta Nutricional/g, 'Eva Vidal - Consulta Nutricional');
  content = content.replace(/Dr\. Nutricionista/g, 'Eva Vidal');
  content = content.replace(/nutricionista@nutripro\.com/g, 'evavidalinfo@gmail.com');
  content = content.replace(/Centro Nutricional NutriPro/g, 'Consulta Nutricional Eva Vidal');

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✓ Updated theme to clinical blue in: ${relPath}`);
}

console.log('Blue clinical theme application complete.');
