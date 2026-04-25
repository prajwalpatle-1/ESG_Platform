const tf = require('@tensorflow/tfjs');

async function trainAnomalyModel(dataset) {
  // Simple autoencoder for anomaly detection
  const inputs = dataset.map(d => [d.emission, d.value]);

  const inputTensor = tf.tensor2d(inputs);

  // Create autoencoder
  const model = tf.sequential();
  model.add(tf.layers.dense({ inputShape: [2], units: 1, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 2 })); // Reconstruct input

  model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });

  await model.fit(inputTensor, inputTensor, { epochs: 50, verbose: 0 });

  return model;
}

async function detectAnomaly(data, model) {
  const anomalies = [];
  const threshold = 0.1; // Reconstruction error threshold

  for (let i = 0; i < data.length; i++) {
    const input = tf.tensor2d([[data[i].emission, data[i].value]]);
    const reconstruction = model.predict(input);
    const error = tf.losses.meanSquaredError(input, reconstruction).dataSync()[0];

    if (error > threshold) {
      anomalies.push({ ...data[i], anomalyScore: error });
    }
  }

  return anomalies;
}

module.exports = {
  trainAnomalyModel,
  detectAnomaly
};