function cleanNumber(val) {
  if (val === undefined || val === null) return null;
  let str = String(val).trim();
  if (!str || str === '-' || str === 'N/A' || str === 'null') return null;
  const isLbs = /lbs?$/i.test(str);
  str = str.replace(/[^\d,.-]/g, '').trim();
  if (!str) return null;
  str = str.replace(',', '.');
  const num = parseFloat(str);
  if (isNaN(num)) return null;
  return isLbs ? Math.round(num * 0.453592 * 10) / 10 : Math.round(num * 100) / 100;
}

function parseScaleDate(dateStr) {
  if (!dateStr) return new Date();
  const str = String(dateStr).trim();
  const direct = new Date(str);
  if (!isNaN(direct.getTime()) && str.includes('-') && str.indexOf('-') === 4) return direct;
  const match = str.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    let year = parseInt(match[3], 10);
    if (year < 100) year += 2000;
    const hours = match[4] ? parseInt(match[4], 10) : 0;
    const minutes = match[5] ? parseInt(match[5], 10) : 0;
    return new Date(year, month, day, hours, minutes);
  }
  return isNaN(direct.getTime()) ? new Date() : direct;
}

function parseScaleContent(content) {
  const trimmed = content.trim();
  if (!trimmed) throw new Error('El archivo está vacío.');

  // 1. JSON
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const data = JSON.parse(trimmed);
      const items = Array.isArray(data) ? data : (data.measurements || data.data || [data]);
      return items.map(it => ({
        date: parseScaleDate(it.date || it.fecha || it.time),
        weightKg: cleanNumber(it.weightKg || it.weight || it.peso) || 0,
        bodyFatPct: cleanNumber(it.bodyFatPct || it.bodyFat || it.fat || it.grasa),
        muscleMassKg: cleanNumber(it.muscleMassKg || it.muscleMass || it.muscle || it.smm || it.musculo),
        visceralFat: cleanNumber(it.visceralFat || it.visceral || it.vfl),
        waistCm: cleanNumber(it.waistCm || it.waist || it.cintura),
        hipCm: cleanNumber(it.hipCm || it.hip || it.cadera),
      })).filter(m => m.weightKg > 0);
    } catch(e) { /* fallback to text parse */ }
  }

  const rawLines = trimmed.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (rawLines.length === 0) throw new Error('No hay líneas en el archivo.');

  // Check if Key-Value format
  const kvMatches = rawLines.filter(l => /^(peso|weight|grasa|fat|pbf|smm|m[uú]sculo|visceral|cintura|waist|cadera|hip|fecha|date)\s*[:=,]/i.test(l));
  if (kvMatches.length >= 2) {
    const single = { date: new Date(), weightKg: 0, bodyFatPct: null, muscleMassKg: null, visceralFat: null, waistCm: null, hipCm: null };
    for (const line of rawLines) {
      const parts = line.split(/[:=]|\t/).map(p => p.trim());
      if (parts.length < 2) continue;
      const key = parts[0].toLowerCase();
      const val = parts.slice(1).join(':').trim();
      if (/fecha|date/i.test(key)) single.date = parseScaleDate(val);
      else if (/peso|weight|wt/i.test(key)) single.weightKg = cleanNumber(val) || 0;
      else if (/grasa|fat|pbf/i.test(key)) single.bodyFatPct = cleanNumber(val);
      else if (/m[uú]sculo|muscle|smm/i.test(key)) single.muscleMassKg = cleanNumber(val);
      else if (/visceral|vfl/i.test(key)) single.visceralFat = cleanNumber(val);
      else if (/cintura|waist/i.test(key)) single.waistCm = cleanNumber(val);
      else if (/cadera|hip/i.test(key)) single.hipCm = cleanNumber(val);
    }
    if (single.weightKg > 0) return [single];
  }

  // Tabular format
  let headerIndex = -1;
  let delimiter = ',';
  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i].toLowerCase();
    const hasWeight = line.includes('peso') || line.includes('weight') || line.includes('wt') || line.includes('kg');
    const hasOther = line.includes('grasa') || line.includes('fat') || line.includes('fecha') || line.includes('date') || line.includes('smm') || line.includes('pbf') || line.includes('bmi') || line.includes('imc');
    if (hasWeight && hasOther) {
      headerIndex = i;
      if (line.includes(';')) delimiter = ';';
      else if (line.includes('\t')) delimiter = '\t';
      else delimiter = ',';
      break;
    }
  }

  if (headerIndex === -1) headerIndex = 0;

  const headerCols = rawLines[headerIndex].split(delimiter).map(c => c.trim().toLowerCase().replace(/[\"\'\(\)\%]/g, ''));
  const results = [];

  for (let i = headerIndex + 1; i < rawLines.length; i++) {
    const cols = rawLines[i].split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));
    if (cols.length < 2) continue;
    const row = {};
    headerCols.forEach((h, idx) => { row[h] = cols[idx] || ''; });

    let weightKg = 0;
    let date = new Date();
    let bodyFatPct = null;
    let muscleMassKg = null;
    let visceralFat = null;
    let waistCm = null;
    let hipCm = null;

    for (const [k, v] of Object.entries(row)) {
      if (/fecha|date/i.test(k)) date = parseScaleDate(v);
      else if (/peso|weight|wt/i.test(k) && !weightKg) weightKg = cleanNumber(v) || 0;
      else if (/grasa|fat|pbf/i.test(k) && bodyFatPct === null) bodyFatPct = cleanNumber(v);
      else if (/(m[uú]scul|muscle|smm|ffm)/i.test(k) && muscleMassKg === null) muscleMassKg = cleanNumber(v);
      else if (/visceral|vfl/i.test(k) && visceralFat === null) visceralFat = cleanNumber(v);
      else if (/cintura|waist/i.test(k) && waistCm === null) waistCm = cleanNumber(v);
      else if (/cadera|hip/i.test(k) && hipCm === null) hipCm = cleanNumber(v);
    }

    if (weightKg > 0) {
      results.push({ date, weightKg, bodyFatPct, muscleMassKg, visceralFat, waistCm, hipCm });
    }
  }

  return results;
}

// Test Tanita with preamble
const tanita = `TANITA Body Composition Analyzer MC-780
Model: MC-780
Fecha;Peso (kg);% Grasa;Masa Muscular (kg);Grasa Visceral;IMC
15/03/2026;76,4;19,2;58,3;5;24.1
20/03/2026;75,8;18,8;58,5;5;23.9`;
console.log('Tanita result:', parseScaleContent(tanita));

// Test InBody KV
const inbodyKV = `InBody 770 Test Sheet
Fecha: 10/03/2026 09:15
Peso: 81,5 kg
PBF (% Grasa): 21,4 %
SMM (Masa Muscular): 37,2 kg
VFL (Nivel Visceral): 7
Cintura: 89 cm`;
console.log('InBody KV result:', parseScaleContent(inbodyKV));

// Test SECA CSV with dot date and comma decimals
const seca = `SECA mBCA 515 Export
Date;Time;Weight (kg);Fat Mass (%);Skeletal Muscle Mass (kg);Visceral Adipose Tissue (l);Waist Circumference (cm)
15.03.2026;11:00;78,2;20,1;35,8;2,1;84,5`;
console.log('SECA result:', parseScaleContent(seca));
