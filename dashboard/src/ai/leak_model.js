// leak_model.js — RandomForest leak detector
// Input: lossRatio = (inflow - reservoir_delta) / inflow   (0..1)
// makeLeakDetector() → stateful detector
// Returns: { isLeak: bool, rollingMean, consecutiveHigh }

const LEAK_WINDOW = 5

function tree0(f){if(f.currentloss<0.27501)return 0;else if(f.rollingmeanloss<0.32994){if(f.currentloss<0.74821)return 1;else return 0;}else if(f.rollingstdloss<0.33956)return 1;else return 0;}
function tree1(f){if(f.currentloss<0.27501)return 0;else if(f.rollingmeanloss<0.31051){if(f.consecutivehigh>1.5)return 1;else return 0;}else if(f.rollingstdloss<0.34679)return 1;else return 0;}
function tree2(f){if(f.consecutivehigh<0.5)return 0;else if(f.consecutivehigh<2.5){if(f.rollingmeanloss<0.31407)return f.rollingstdloss<0.29379?1:0;else return 0;}else return 1;}
function tree3(f){if(f.consecutivehigh<1.5)return f.consecutivehigh<0.5?0:1;else if(f.rollingstdloss<0.29737)return 1;else if(f.consecutivehigh<2.5){if(f.currentloss<0.75425)return f.rollingstdloss<0.33840?1:0;else return 0;}else return 1;}
function tree4(f){if(f.consecutivehigh<0.5)return 0;else if(f.consecutivehigh<2.5){if(f.rollingmeanloss<0.28133)return f.rollingstdloss<0.29081?1:0;else return 0;}else return 1;}
function tree5(f){if(f.consecutivehigh<0.5)return 0;else if(f.currentloss<0.75066){if(f.consecutivehigh>2.5)return f.rollingmeanloss<0.28021?1:0;else return 1;}else return 0;}
function tree6(f){if(f.consecutivehigh<1.5){if(f.currentloss<0.27541)return 0;else if(f.rollingstdloss<0.29316)return 1;else return 0;}else if(f.rollingstdloss<0.34368){if(f.rollingmeanloss<0.32499)return 1;else return 1;}else return 0;}
function tree7(f){if(f.currentloss<0.27523)return 0;else if(f.currentloss<0.75068)return f.consecutivehigh>2.5?1:1;else return 0;}
function tree8(f){if(f.consecutivehigh<0.5)return 0;else if(f.currentloss<0.75066)return 1;else return 0;}
function tree9(f){if(f.currentloss<0.27501)return 0;else if(f.consecutivehigh>2.5)return f.currentloss<0.74821?1:0;else return 1;}
function tree10(f){if(f.currentloss<0.27501)return 0;else if(f.consecutivehigh>2.5)return f.currentloss<0.74996?f.rollingstdloss<0.34322?1:0:0;else return 1;}

export function predictLeak(f) {
  const votes = [tree0,tree1,tree2,tree3,tree4,tree5,tree6,tree7,tree8,tree9,tree10].map(t => t(f))
  const sum = votes.reduce((a, b) => a + b, 0)
  return sum / votes.length > 0.5 ? 1 : 0
}

export function makeLeakDetector() {
  let buffer = []
  return function detect(lossRatio) {
    buffer.push(lossRatio)
    if (buffer.length > LEAK_WINDOW) buffer.shift()
    const rollingMean = buffer.reduce((a, b) => a + b, 0) / buffer.length
    const rollingStd = Math.sqrt(buffer.reduce((a, b) => a + (b - rollingMean) ** 2, 0) / buffer.length)
    let consecutiveHigh = 0
    for (let i = buffer.length - 1; i >= 0; i--) {
      if (buffer[i] > 0.15) consecutiveHigh++; else break
    }
    consecutiveHigh = Math.min(consecutiveHigh, LEAK_WINDOW)
    const isLeak = predictLeak({
      currentloss: lossRatio,
      rollingmeanloss: rollingMean,
      rollingstdloss: rollingStd,
      consecutivehigh: consecutiveHigh,
    }) === 1
    return { isLeak, rollingMean, consecutiveHigh }
  }
}
