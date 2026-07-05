// ph_model.js — RandomForest water quality pH contamination detector
// Input per pH reading: phReading (float)
// makeWaterQualityDetector() → stateful detector
// Returns: { contaminated: bool, deviation, rollingMean }

const SAFE_LOW = 6.5
const SAFE_HIGH = 8.5
const PH_WINDOW = 5

function phtree0(f){if(f.consecutiveoutofrange<0.5){if(f.currentdeviation<0.00014)return f.rollingmeandeviation<0.36013?0:1;else if(f.currentdeviation<0.02880)return 1;else return 1;}else if(f.currentdeviation<0.64048)return 1;else if(f.currentdeviation<1.20061)return 1;else return 1;}
function phtree1(f){if(f.consecutiveoutofrange<0.5){if(f.rollingmeandeviation<0.36146)return f.currentdeviation<0.00014?(f.rollingmeandeviation<0.19682?0:0):1;else return 1;}else if(f.rollingmeandeviation<0.21875)return 1;else return 1;}
function phtree2(f){if(f.currentdeviation<0.00069)return f.rollingmeandeviation<0.36065?0:1;else if(f.consecutiveoutofrange>2.5)return 1;else return 1;}
function phtree3(f){if(f.rollingmeandeviation<0.24571){if(f.rollingmeandeviation<0.04922)return 0;else if(f.currentdeviation<0.00116)return 0;else return 1;}else if(f.currentdeviation<0.00014)return f.rollingmeandeviation<0.53336?1:1;else return 1;}
function phtree4(f){if(f.currentdeviation<0.00091)return f.rollingmeandeviation<0.36250?0:1;else if(f.consecutiveoutofrange>2.5)return 1;else return 1;}
function phtree5(f){if(f.rollingmeandeviation<0.23895){if(f.consecutiveoutofrange<0.5)return 0;else if(f.rollingmeandeviation<0.13446)return 0;else return 1;}else if(f.rollingmeandeviation<0.36013)return f.currentdeviation<0.00014?0:1;else return 1;}
function phtree6(f){if(f.consecutiveoutofrange<0.5){if(f.rollingmeandeviation<0.30105)return f.currentdeviation<0.00069?0:1;else return 1;}else if(f.rollingmeandeviation<0.20983)return 1;else return 1;}
function phtree7(f){if(f.rollingmeandeviation<0.24697){if(f.consecutiveoutofrange<0.5)return 0;else return 1;}else if(f.currentdeviation<0.00168)return 0;else return 1;}
function phtree8(f){if(f.consecutiveoutofrange<0.5){if(f.currentdeviation<0.00014)return f.rollingmeandeviation<0.41758?0:1;else return 1;}else if(f.currentdeviation<0.64042)return 1;else return 1;}
function phtree9(f){if(f.consecutiveoutofrange<0.5){if(f.currentdeviation<0.00069)return f.rollingmeandeviation<0.30430?0:1;else return 1;}else if(f.currentdeviation<0.64761)return 1;else return 1;}
function phtree10(f){if(f.currentdeviation<0.00014)return f.rollingmeandeviation<0.36065?0:1;else if(f.consecutiveoutofrange>2.5)return 1;else return 1;}

export function predictContamination(f) {
  const votes = [phtree0,phtree1,phtree2,phtree3,phtree4,phtree5,phtree6,phtree7,phtree8,phtree9,phtree10].map(t => t(f))
  return votes.reduce((a, b) => a + b, 0) / votes.length > 0.5 ? 1 : 0
}

export function makeWaterQualityDetector() {
  let buffer = []
  return function detect(phReading) {
    const deviation = Math.max(0, SAFE_LOW - phReading, phReading - SAFE_HIGH)
    buffer.push(deviation)
    if (buffer.length > PH_WINDOW) buffer.shift()
    const rollingMean = buffer.reduce((a, b) => a + b, 0) / buffer.length
    let consecutiveOut = 0
    for (let i = buffer.length - 1; i >= 0; i--) {
      if (buffer[i] > 0.1) consecutiveOut++; else break
    }
    consecutiveOut = Math.min(consecutiveOut, PH_WINDOW)
    const contaminated = predictContamination({
      currentdeviation: deviation,
      rollingmeandeviation: rollingMean,
      consecutiveoutofrange: consecutiveOut,
    }) === 1
    return { contaminated, deviation, rollingMean }
  }
}
