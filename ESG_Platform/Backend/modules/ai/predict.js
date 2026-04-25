const tf = require('@tensorflow/tfjs');

async function trainModel(dataset) {
  // Prepare data for neural network
  const inputs = dataset.map(d => [d.value, d.scope === 'Scope 3' ? 1 : 0]); // Add scope as feature
  const outputs = dataset.map(d => d.emission);

  const inputTensor = tf.tensor2d(inputs);
  const outputTensor = tf.tensor2d(outputs, [outputs.length, 1]);

  // Create a simple neural network
  const model = tf.sequential();
  model.add(tf.layers.dense({ inputShape: [2], units: 10, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 1 }));

  model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });

  // Train the model
  await model.fit(inputTensor, outputTensor, { epochs: 100, verbose: 0 });

  return model;
}

async function predictEmission(model, value, scope = 'Scope 3') {
  const scopeFeature = scope === 'Scope 3' ? 1 : 0;
  const input = tf.tensor2d([[value, scopeFeature]]);
  const prediction = model.predict(input);
  const result = await prediction.data();
  return result[0];
}

module.exports = {
  trainModel,
  predictEmission
};