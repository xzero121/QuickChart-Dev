function calculateIdealWeight(method, height, unit, gender) {
  // Make these available everywhere in the function
  let height_cm;
  let height_in;

  if (unit === "in") {
    height_in = height;
    height_cm = height * 2.54;
  } else if (unit === "cm") {
    height_cm = height;
    height_in = height / 2.54;
  } else {
    throw new Error("Invalid unit.");
  }

  let IBW_kg;
  if(height_in < 60 && (method === "Devine" || method === "Hamwi" || method === "Robinson" || method === "Miller" || method === "Broca")) {
    throw new Error("Height must be at least 60 inches for the selected method.");  
  }
  else if ((height_cm < 50 || height_cm >= 160) && method === "McLaren") {
    throw new Error("Height must be between 50 cm and 160 cm for McLaren method.");
  }

  if (method === "Devine") {
    if (gender === "male") {
      IBW_kg = 50 + 2.3 * (height_in - 60);
    } else if (gender === "female") {
      IBW_kg = 45.5 + 2.3 * (height_in - 60);
    } else {
      throw new Error("Invalid gender.");
    }
  }
  else if (method === "Hamwi") {
    if (gender === "male") {
      IBW_kg = 48 + 2.7 * (height_in - 60);
    } else if (gender === "female") {
      IBW_kg = 45.5 + 2.2 * (height_in - 60);
    } else {
      throw new Error("Invalid gender.");
    }
  }
  else if (method === "Robinson") {
    if (gender === "male") {
      IBW_kg = 52 + 1.9 * (height_in - 60);
    } else if (gender === "female") {
      IBW_kg = 49 + 1.7 * (height_in - 60);
    } else {
      throw new Error("Invalid gender.");
    }
  }
  else if (method === "Broca") {
    if (gender === "male") {
      IBW_kg = (height_cm - 100);
    } else if (gender === "female") {
      IBW_kg = (height_cm - 100) - 0.15 * (height_cm - 100);
    } else {
      throw new Error("Invalid gender.");
    }
  }
  else if (method === "Lemmens") {
    // TODO
    throw new Error("Lemmens not implemented yet.");
  }
  else if (method === "Miller") {
    if (gender === "male") {
      IBW_kg = 56.2 + 1.41 * (height_in - 60);
    } else if (gender === "female") {
      IBW_kg = 53.1 + 1.36 * (height_in - 60);
    } else {
      throw new Error("Invalid gender.");
    }
  }
  else if (method === "McLaren") {
    // IMPORTANT: calculateIdealWeight is synchronous.
    // So you must call: await loadMcLarenTables() somewhere before using McLaren.
    if (!mcLarenMaleTable || !mcLarenFemaleTable) {
      throw new Error("McLaren tables not loaded. Call `await loadMcLarenTables()` first.");
    }

    if (gender === "male") {
      IBW_kg = interpolateWeightByHeight(height_cm, mcLarenMaleTable);
    } else if (gender === "female") {
      IBW_kg = interpolateWeightByHeight(height_cm, mcLarenFemaleTable);
    } else {
      throw new Error("Invalid gender.");
    }
  }
  else {
    throw new Error("Invalid method.");
  }

  const IBW_lb = IBW_kg * 2.20462;
  return { kg: IBW_kg, lb: IBW_lb };
}

function calculateETTdepth(height, unit) {

  let height_cm;
  let height_in;

  if (unit === "in") {
    height_in = height;
    height_cm = height * 2.54;
  } 
  else if (unit === "cm") {
    height_cm = height;
    height_in = height / 2.54;
  } 
  else {
    throw new Error("Invalid unit.");
  }

  return .1 * height_cm + 4;
}

function calculateTidalVolume(IBW_kg) {
  return {
    low: IBW_kg * 6,
    high: IBW_kg * 8
  };
}

function calculateDripRates(volume_ml, drop_set, duration_min) {
  const rate_ml_per_min = volume_ml / duration_min;
  const rate_drops_per_min = rate_ml_per_min * drop_set;
  return rate_drops_per_min;
}

function calculateOxygenDuration(tankSize, CurrentPSI, FlowRateLPM) {
  const tankConstant = {"D": 0.16, "E": 0.28, "M": 1.56, "H": 3.14};

  const duration = (CurrentPSI * tankConstant[tankSize]) / FlowRateLPM;
  return duration;
}




let mcLarenMaleTable = null;
let mcLarenFemaleTable = null;

async function loadMcLarenTables() {
  if (mcLarenMaleTable && mcLarenFemaleTable) return;

  const [maleText, femaleText] = await Promise.all([
    fetch("./male.csv").then(r => r.text()),
    fetch("./female.csv").then(r => r.text()),
  ]);

  mcLarenMaleTable = parseMcLarenCSV(maleText);
  mcLarenFemaleTable = parseMcLarenCSV(femaleText);
}

function parseMcLarenCSV(csvText) {
  // Expects header: Weight,Height
  const lines = csvText.trim().split(/\r?\n/);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const [weightStr, heightStr] = line.split(",").map(s => s.trim());
    const w = Number(weightStr);
    const h = Number(heightStr);

    if (Number.isFinite(w) && Number.isFinite(h)) {
      rows.push({ h, w }); // h in cm, w in kg
    }
  }

  rows.sort((a, b) => a.h - b.h);
  return rows;
}

function interpolateWeightByHeight(heightCm, table) {
  if (!Array.isArray(table) || table.length < 2) {
    throw new Error("McLaren table not loaded or too small.");
  }

  // Clamp to range (prevents goofy extrapolation)
  const minH = table[0].h;
  const maxH = table[table.length - 1].h;

  if (heightCm <= minH) return table[0].w;
  if (heightCm >= maxH) return table[table.length - 1].w;

  // Binary search for neighbors
  let lo = 0, hi = table.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (table[mid].h === heightCm) return table[mid].w;
    if (table[mid].h < heightCm) lo = mid;
    else hi = mid;
  }

  const h1 = table[lo].h, w1 = table[lo].w;
  const h2 = table[hi].h, w2 = table[hi].w;

  // Linear interpolation
  const t = (heightCm - h1) / (h2 - h1);
  return w1 + t * (w2 - w1);
}
