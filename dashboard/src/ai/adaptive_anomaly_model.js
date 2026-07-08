import * as tf from '@tensorflow/tfjs';

export class AnomalyAutoencoder {
  constructor() {
    this.model = null;
    this.isTraining = false;
    this.isReady = false;
    this.means = [];
    this.stds = [];
  }

  async buildModel(inputDim = 5) {
    this.model = tf.sequential();
    
    // Encoder: Compress 5 features down to 2
    this.model.add(tf.layers.dense({ units: 8, activation: 'relu', inputShape: [inputDim] }));
    this.model.add(tf.layers.dense({ units: 4, activation: 'relu' }));
    this.model.add(tf.layers.dense({ units: 2, activation: 'relu' }));
    
    // Decoder: Reconstruct 5 features from 2
    this.model.add(tf.layers.dense({ units: 4, activation: 'relu' }));
    this.model.add(tf.layers.dense({ units: 8, activation: 'relu' }));
    this.model.add(tf.layers.dense({ units: inputDim, activation: 'linear' }));
    
    this.model.compile({
      optimizer: tf.train.adam(0.01),
      loss: 'meanSquaredError'
    });
  }

  normalize(tensor) {
    return tf.tidy(() => {
      const meanTensor = tf.tensor1d(this.means);
      const stdTensor = tf.tensor1d(this.stds);
      return tensor.sub(meanTensor).div(stdTensor.add(1e-7));
    });
  }

  async train(historicalData) {
    if (historicalData.length < 10) return; // Need some data to train
    if (!this.model) await this.buildModel(5);
    
    this.isTraining = true;

    // Extract features: [reservoirLevel, flowRate, pumpMotorCurrent, pumpTemp, solarProduction]
    const data = historicalData.map(d => [
      d.reservoirLevel,
      d.flowRate,
      d.pumpMotorCurrent,
      d.pumpTemp,
      d.solarProduction
    ]);
    
    const tensorData = tf.tensor2d(data);
    
    // Calculate normalisation statistics (Mean and StdDev)
    const moments = tf.moments(tensorData, 0);
    this.means = await moments.mean.array();
    
    const stdTensor = tf.sqrt(moments.variance);
    this.stds = await stdTensor.array();
    
    const normalizedData = this.normalize(tensorData);
    
    // Train the Autoencoder to reconstruct the normal data
    await this.model.fit(normalizedData, normalizedData, {
      epochs: 15,
      batchSize: 32,
      shuffle: true,
      verbose: 0
    });
    
    // Cleanup tensors to prevent memory leaks
    tf.dispose([tensorData, moments.mean, moments.variance, stdTensor, normalizedData]);
    
    this.isTraining = false;
    this.isReady = true;
  }

  async predictAnomaly(currentSensorData) {
    // If not ready or still training, return a safe 0 score
    if (!this.isReady || this.isTraining) return 0;
    
    const data = [[
      currentSensorData.reservoirLevel,
      currentSensorData.flowRate,
      currentSensorData.pumpMotorCurrent,
      currentSensorData.pumpTemp,
      currentSensorData.solarProduction
    ]];
    
    return tf.tidy(() => {
      const tensorData = tf.tensor2d(data);
      const normalizedData = this.normalize(tensorData);
      
      const prediction = this.model.predict(normalizedData);
      const mse = tf.losses.meanSquaredError(normalizedData, prediction);
      
      const lossValue = mse.dataSync()[0];
      
      // Map loss to an anomaly score 0-100.
      // Usually, normal loss is < 0.1. A loss of 0.5 is very high.
      const score = Math.min(100, Math.max(0, lossValue * 200));
      return score;
    });
  }
}

export const autoencoder = new AnomalyAutoencoder();
