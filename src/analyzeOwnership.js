const fs = require('fs');
const path = require('path');

function parseCSV(csvString) {
  if (!csvString) return [];

  const lines = csvString.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });
    data.push(obj);
  }

  return data;
}

function analyzeOwnership() {
  const dataDir = path.join(__dirname, '..', 'data');

  console.log('[Analyzer] Starting ownership analysis...');

  const planetDetailPath = path.join(dataDir, 'csv_planetdetail.csv');
  const systemStarsPath = path.join(dataDir, 'systemstars_allstars.json');

  if (!fs.existsSync(planetDetailPath)) {
    console.warn('[Analyzer] csv_planetdetail.csv not found, skipping ownership analysis');
    return;
  }

  if (!fs.existsSync(systemStarsPath)) {
    console.warn('[Analyzer] systemstars_allstars.json not found, skipping ownership analysis');
    return;
  }

  try {
    const planetDetailCSV = fs.readFileSync(planetDetailPath, 'utf8');
    const planetDetails = parseCSV(planetDetailCSV);

    const systemStarsData = JSON.parse(fs.readFileSync(systemStarsPath, 'utf8'));

    const systemFactions = {};
    const planetFactions = {
      totalPlanets: planetDetails.length,
      totalPlanetsWithFaction: 0,
      factions: {}
    };

    const systemIdToNaturalId = {};
    systemStarsData.forEach(system => {
      if (system.SystemId && system.SystemNaturalId) {
        systemIdToNaturalId[system.SystemId] = system.SystemNaturalId;
      }
    });

    const factionCounts = {};

    planetDetails.forEach(planet => {
      const factionCode = planet.FactionCode;
      const factionName = planet.FactionName;
      const systemId = planet.SystemId;

      if (factionCode && factionCode.trim() !== '') {
        planetFactions.totalPlanetsWithFaction++;

        if (!factionCounts[factionCode]) {
          factionCounts[factionCode] = {
            code: factionCode,
            name: factionName || factionCode,
            count: 0
          };
        }
        factionCounts[factionCode].count++;

        if (systemId) {
          systemFactions[systemId] = factionCode;
        }
      } else {
        if (systemId) {
          systemFactions[systemId] = null;
        }
      }
    });

    planetFactions.factions = Object.values(factionCounts).sort((a, b) => b.count - a.count);

    const output = {
      planetFactions,
      systemFactions
    };

    const outputPath = path.join(dataDir, 'system_factions.json');
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

    console.log('[Analyzer] Ownership analysis complete!');
    console.log(`  Total planets: ${planetFactions.totalPlanets}`);
    console.log(`  Planets with faction: ${planetFactions.totalPlanetsWithFaction}`);
    console.log(`  Unique factions: ${Object.keys(factionCounts).length}`);
    console.log(`  Output: ${outputPath}`);
  } catch (error) {
    console.error('[Analyzer] Error during ownership analysis:', error.message);
  }
}

if (require.main === module) {
  analyzeOwnership();
}

module.exports = { analyzeOwnership };
