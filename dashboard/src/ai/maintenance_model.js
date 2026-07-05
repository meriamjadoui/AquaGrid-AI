// maintenance_model.js — RandomForest predictive maintenance
// Input per completed pump session: { currentavg, flowavg, tempavg, efficiency, rollingslopecurrent, rollingslopeefficiency }
// Returns: 0=healthy, 1=warning, 2=critical
// makeMaintenanceDetector() → stateful session detector

function slope(vals) {
  if (vals.length < 2) return 0
  const n = vals.length
  const xs = [...Array(n).keys()]
  const xMean = xs.reduce((a, b) => a + b, 0) / n
  const yMean = vals.reduce((a, b) => a + b, 0) / n
  let num = 0, den = 0
  for (let i = 0; i < n; i++) {
    num += (xs[i] - xMean) * (vals[i] - yMean)
    den += (xs[i] - xMean) ** 2
  }
  return den === 0 ? 0 : num / den
}

// 15 decision trees (mtree0..mtree14)
function mtree0(f){if(f.currentavg<2.21087){if(f.currentavg<2.06710){if(f.rollingslopeefficiency<-0.03705)return 1;else if(f.rollingslopeefficiency<-0.02116){if(f.tempavg<44.56876)return 0;else return 1;}else if(f.tempavg<44.73301)return 0;else return 0;}else if(f.tempavg<44.19658){if(f.efficiency<0.44190)return 0;else return 1;}else if(f.flowavg<7.03657){if(f.rollingslopecurrent<0.00348)return 1;else return 0;}else if(f.rollingslopecurrent<0.00410)return 0;else return 0;}else if(f.tempavg<50.12525){if(f.currentavg<2.57624){if(f.efficiency<0.35340)return 1;else return 1;}else if(f.currentavg<2.73260){if(f.rollingslopecurrent<0.04952)return 2;else return 1;}else return 2;}else if(f.currentavg<2.57624)return 2;else return 2;}
function mtree1(f){if(f.currentavg<2.23118){if(f.tempavg<45.62606){if(f.efficiency<0.30608)return 0;else if(f.rollingslopecurrent<0.00132)return 1;else if(f.currentavg<2.08018)return 0;else return 0;}else if(f.currentavg<2.02770)return 1;else return 1;}else if(f.tempavg<50.24890){if(f.tempavg<48.51091){if(f.rollingslopecurrent<0.04836)return 1;else return 2;}else if(f.currentavg<2.57377)return 1;else return 2;}else if(f.flowavg<5.80098)return 2;else if(f.currentavg<2.60570)return 1;else return 2;}
function mtree2(f){if(f.efficiency<0.37249){if(f.currentavg<2.14447){if(f.rollingslopeefficiency<-0.01843)return 0;else if(f.flowavg<6.31426)return 0;else return 0;}else if(f.currentavg<2.28757)return 1;else if(f.flowavg<7.56211)return 1;else return 1;}else if(f.efficiency<0.48731){if(f.currentavg<2.55016){if(f.rollingslopeefficiency<-0.03875)return 2;else return 1;}else if(f.tempavg<50.33182)return 2;else return 2;}else if(f.tempavg<49.98672)return 2;else return 2;}
function mtree3(f){if(f.currentavg<2.21304){if(f.efficiency<0.31162)return 0;else if(f.tempavg<44.19061)return 0;else if(f.efficiency<0.41829)return 0;else return 1;}else if(f.efficiency<0.48936){if(f.tempavg<51.14383)return 1;else if(f.currentavg<2.45279)return 1;else return 2;}else if(f.flowavg<4.01405)return 2;else if(f.tempavg<50.35851)return 2;else return 2;}
function mtree4(f){if(f.tempavg<46.14004){if(f.efficiency<0.32038)return 0;else if(f.rollingslopeefficiency<-0.02112)return 1;else return 0;}else if(f.flowavg<5.04039){if(f.currentavg<2.47222)return 1;else return 2;}else if(f.efficiency<0.46645)return 2;else return 2;}
function mtree5(f){if(f.efficiency<0.37446){if(f.efficiency<0.30576)return 0;else if(f.rollingslopeefficiency<-0.01336)return 1;else return 0;}else if(f.rollingslopeefficiency<-0.02454){if(f.efficiency<0.43759)return 2;else return 2;}else if(f.rollingslopeefficiency<0.03329)return 2;else return 2;}
function mtree6(f){if(f.efficiency<0.37686){if(f.currentavg<2.17405)return 0;else if(f.rollingslopeefficiency<0.00224)return 1;else return 0;}else if(f.efficiency<0.48775)return 1;else return 2;}
function mtree7(f){if(f.tempavg<46.20036){if(f.efficiency<0.33685)return 0;else if(f.currentavg<2.26084)return 0;else return 1;}else if(f.tempavg<50.47901){if(f.currentavg<2.58162)return 1;else return 2;}else return 2;}
function mtree8(f){if(f.tempavg<46.14694){if(f.currentavg<2.14471)return 0;else if(f.currentavg<2.21887)return 0;else return 1;}else if(f.efficiency<0.49428)return 2;else return 2;}
function mtree9(f){if(f.rollingslopeefficiency<-0.01685){if(f.currentavg<2.46312)return 0;else if(f.efficiency<0.51141)return 1;else return 2;}else if(f.efficiency<0.48291)return 1;else return 2;}
function mtree10(f){if(f.rollingslopeefficiency<-0.01425){if(f.currentavg<2.46312)return 0;else return 2;}else if(f.tempavg<46.27946){if(f.efficiency<0.34117)return 0;else return 1;}else return 2;}
function mtree11(f){if(f.efficiency<0.37731){if(f.efficiency<0.31242)return 0;else return 1;}else if(f.efficiency<0.48931)return 1;else return 2;}
function mtree12(f){if(f.rollingslopeefficiency<-0.01491){if(f.flowavg<5.90898)return 2;else return 2;}else if(f.currentavg<2.21316)return 0;else return 2;}
function mtree13(f){if(f.efficiency<0.37966){if(f.currentavg<2.15217)return 0;else return 1;}else if(f.efficiency<0.50139)return 1;else return 2;}
function mtree14(f){if(f.efficiency<0.37686){if(f.efficiency<0.31242)return 0;else return 1;}else if(f.flowavg<4.98009)return 1;else return 2;}

export function predictMaintenance(f) {
  const votes = [mtree0,mtree1,mtree2,mtree3,mtree4,mtree5,mtree6,mtree7,mtree8,mtree9,mtree10,mtree11,mtree12,mtree13,mtree14].map(t => t(f))
  const counts = [0, 0, 0]
  votes.forEach(v => counts[v]++)
  return counts.indexOf(Math.max(...counts)) // 0=healthy,1=warning,2=critical
}

const MAINT_WINDOW = 5
export function makeMaintenanceDetector() {
  let currents = []
  let effs = []
  return function detect(current, flow, temp) {
    const efficiency = current / Math.max(flow, 0.5)
    currents.push(current)
    effs.push(efficiency)
    if (currents.length > MAINT_WINDOW) currents.shift()
    if (effs.length > MAINT_WINDOW) effs.shift()
    const state = predictMaintenance({
      currentavg: current,
      flowavg: flow,
      tempavg: temp,
      efficiency,
      rollingslopecurrent: slope(currents),
      rollingslopeefficiency: slope(effs),
    })
    return { state, label: ['healthy', 'warning', 'critical'][state] }
  }
}
