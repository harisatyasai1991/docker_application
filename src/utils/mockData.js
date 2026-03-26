// Mock data generator for electrical assets

const manufacturers = {
  transformer: ['Siemens', 'ABB', 'Schneider Electric', 'GE', 'Eaton'],
  switchgear: ['ABB', 'Siemens', 'Schneider Electric', 'Mitsubishi', 'Eaton'],
  motors: ['Siemens', 'ABB', 'WEG', 'Nidec', 'Regal Beloit'],
  generators: ['Caterpillar', 'Cummins', 'Generac', 'Kohler', 'MTU'],
  cables: ['Prysmian', 'Nexans', 'Southwire', 'General Cable', 'Sumitomo'],
  ups: ['APC', 'Eaton', 'Schneider Electric', 'Vertiv', 'Riello']
};

const voltagelevels = {
  transformer: ['11kV', '22kV', '33kV', '66kV', '132kV', '220kV'],
  switchgear: ['415V', '11kV', '22kV', '33kV'],
  motors: ['415V', '3.3kV', '6.6kV', '11kV'],
  generators: ['415V', '11kV', '22kV'],
  cables: ['415V', '11kV', '22kV', '33kV'],
  ups: ['230V', '415V']
};

const assetCounts = {
  transformer: 45,
  switchgear: 32,
  motors: 78,
  generators: 28,
  cables: 156,
  ups: 24
};

// Seeded random number generator for consistent data
const seededRandom = (seed) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const getSeededElement = (array, seed) => {
  const index = Math.floor(seededRandom(seed) * array.length);
  return array[index];
};

const getSeededDate = (seed, startYear = 2023) => {
  const dayOfYear = Math.floor(seededRandom(seed) * 365);
  const date = new Date(startYear, 0, 1);
  date.setDate(date.getDate() + dayOfYear);
  return date.toISOString().split('T')[0];
};

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString().split('T')[0];
};

const generateSeededHealthScore = (seed) => {
  const rand = seededRandom(seed);
  if (rand < 0.7) {
    // 70% healthy (80-100)
    return Math.floor(seededRandom(seed + 1) * 21) + 80;
  } else if (rand < 0.9) {
    // 20% warning (60-79)
    return Math.floor(seededRandom(seed + 1) * 20) + 60;
  } else {
    // 10% critical (30-59)
    return Math.floor(seededRandom(seed + 1) * 30) + 30;
  }
};

export const generateMockAssets = (assetType) => {
  const count = assetCounts[assetType] || 50;
  const assets = [];

  for (let i = 1; i <= count; i++) {
    // Use asset index as seed for consistent data generation
    const seed = (assetType + i).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    const lastTestDate = getSeededDate(seed, 2023);
    const nextTestDays = Math.floor(seededRandom(seed + 2) * 180) + 90; // 90-270 days
    const nextTestDate = addDays(lastTestDate, nextTestDays);

    const asset = {
      assetId: `${assetType.toUpperCase()}-${String(i).padStart(4, '0')}`,
      assetName: `${assetType.charAt(0).toUpperCase() + assetType.slice(1)} Unit ${i}`,
      manufacturer: getSeededElement(manufacturers[assetType] || manufacturers.transformer, seed + 3),
      voltageLevel: getSeededElement(voltagelevels[assetType] || voltagelevels.transformer, seed + 4),
      lastTestDate,
      nextTestDate,
      healthScore: generateSeededHealthScore(seed + 5)
    };

    assets.push(asset);
  }

  return assets;
};
