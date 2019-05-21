let moment = require('moment');
let DateDiff = require('date-diff');
let dateFormat = 'DD MMM YYYY - HH:mm';
import { min, max, mean, standardDeviation } from 'simple-statistics';


export default class Preprocessor {

    constructor() {
        this.lineralizer = {
            'none': (value) => {
                return value;
            },
            'min_max_normalization': (value, statistics) => {
                return (value - statistics.min)/(statistics.max - statistics.min);
            },
            'mean_normalization': (value, statistics) => {
                return (value - statistics.mean)/(statistics.max - statistics.min); 
            },
            'standartization': (value, statistics) => {
                return (value - statistics.min)/(statistics.standardDeviation);
            },
            'scaling': (value, statistics) => {
                return value / statistics.max;
            }
        };
    }

    calculateStatistics(features) {
        var features = this.extractFeatures();
        this.statistics = {};
        for (let featureIndex in features) {
            let feature = features[featureIndex];
            this.statistics[featureIndex] = {
                min: min(feature),
                max: max(feature),
                mean: Math.round(mean(feature)),
                standardDeviation: Math.round(standardDeviation(feature) * 100) / 100
            };
        }
        return this.statistics;
    }

    extractFeatures() {
        var features = [];
        for (let index in this.data) {
            let item = this.data[index];
            for (let featureIndex in item) {
                let featureValue = item[featureIndex];
                features[featureIndex] = features[featureIndex] ? features[featureIndex] : [];
                features[featureIndex].push(featureValue);
            }
        }
        return features;
    }
    

    split(data, splitter) {
        var trainData = [],
            testData = [];
        if(splitter && (typeof splitter == 'function')) {
            for (let index in data) {
                let item = data[index];
                if (splitter(item)) {
                    testData.push(item);
                } else {
                    trainData.push(item);
                } 
            }
        }
        
        return [trainData, testData];
    }

    extract(data, meta, targetField) {
        var features = [],
            targets = [],
            lineralizer = this.lineralizer;
        for (let item of data) {
            var feature = [],
                target = [];
            for (var i = 0; i < meta.length; i++) {
                let name = meta[i].feature,
                    value = lineralizer[meta[i].normalization](item[name], this.statistics[name]);
                if (name == targetField) {
                    target.push(value);
                } else {
                    feature.push(value);
                }
            }
            features.push(feature);
            targets.push(target);
        }
        return [features, targets];
    }
    
    loadUrl(url) {
        url = url || 'resources/data/data.json';
        return fetch(url); 
    }

    setConfig(config) {
        if (config.data) {
            this.setData(config.data);
        }
        if (config.meta) {
            this.setMeta(config.meta);
        }
        if (config.targetField) {
            this.setTargetField(config.targetField);
        }
        if (config.splitter) {
            this.setSplitter(config.splitter);
        }
    }

    setData(data) {
        this.data = data;
        this.calculateStatistics();
    }

    getHeaders() {
        if (!this.data || !this.data[0]) return;
        const item = this.data[0];
        return Object.keys(item);
    }

    setMeta(meta) {
        this.meta = meta;
    } 

    setSplitter(splitter) {
        this.splitter = splitter;
    }

    setTargetField(targetField) {
        this.targetField = targetField;
    }
    
    
    process() {
        var [trainData, testData] = this.split(this.data, this.splitter);
        
        return [
            this.extract(
                trainData,
                this.meta,
                this.targetField
            ), 
            this.extract(
                testData,
                this.meta,
                this.targetField
            )
        ];
    }
}


