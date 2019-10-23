import * as tf from '@tensorflow/tfjs';

export default class TensorFlow {

    constructor(config) {
        this.setConfig(config);
    }

    setConfig(config) {
        config = config || {};
        this.config = {
            learningRate: config.learningRate || .01,
            numberOfEpochs: config.numberOfEpochs || 200,
            optimizer: config.optimizer || "adam",
            loss: config.loss || "sigmoidCrossEntropy",
            metrics: config.metrics || 'accuracy'
        };
        config.layers = config.layers || [{}];
        this.config.layers = [];
        for (let layer of config.layers) {
            this.config.layers.push(
                {
                    type: layer.type || 'dense',
                    units: layer.units || 1
                  }
            );
        }
        this.config.layers[this.config.layers.length - 1].units = 1;
    }

    stop(stopHandler) {
        this.stopHandler = stopHandler;
        if (this.model && this.model.isTraining) {
            this.model.needToStop = true;
        } else {
            this.onStop();
        }
    }

    onStop() {
        if (Ext.isFunction(this.stopHandler)) {
            this.stopHandler();
        }
        this.stopHandler = undefined;
    }

    buildModel(inputSize) {
        //chain layers
        const optimizer = tf.train[this.config.optimizer](this.config.learningRate);
        const input = tf.input({shape: [inputSize,]});

        var currentLayer = input;

        for (let layerConfig of this.config.layers) {
            const layer = tf.layers[layerConfig.type](layerConfig);
            currentLayer = layer.apply(currentLayer);
        }

        const output = currentLayer;

        this.model = tf.model({inputs: input, outputs: output});

        this.model.compile({
            loss: tf.losses[this.config.loss], 
            optimizer: optimizer, 
            metrics: [this.config.metrics]
        });
    }

    start(data, updateFn, completeFn) {
        
        let [train_data, ] = data;
        let [feature_train_data, target_train_data] = train_data;
        
        this.buildModel(feature_train_data[0].length);
         
        const feature_train = tf.tensor2d(feature_train_data, [feature_train_data.length, feature_train_data[0].length]);
        const target_train = tf.tensor2d(target_train_data, [target_train_data.length, 1]);
        
        updateFn.call(undefined, 0, this.model.layers);
        
        this.model.fit(feature_train, target_train, {epochs: this.config.numberOfEpochs,
            batchSize: 30,
            callbacks: {
                onEpochEnd: async (epoch, logs) => {
                    //stop training process if needed
                    if (this.model.needToStop) {
                        this.model.stopTraining = true;
                        this.model.isTraining = false;
                        this.model.needToStop = false;
                        this.onStop();
                    } else {
                        //update visualization
                        updateFn.call(null, epoch, this.model.layers);
                        await tf.nextFrame();
                    }
                }
            }}).then((training) => {
                //training process is finished
                if (training.epoch.length >= this.config.numberOfEpochs) {
                    completeFn.call();
                }
        });
    }

    predict(item) {
        const item_tensor = tf.tensor2d(item, [1, item.length]);
            
        return this.model.predict(item_tensor).data();
    }
    
}

