
import React, { Component } from 'react';
import { Panel, Button, SpinnerField, NumberField, SelectField, Container } from '@sencha/ext-modern';

export default class ControlToolbar extends Component {

  constructor(props) {
    super(props);
    this.state = props.config;
    
    this.onChange = this.onChange.bind(this);
    this.onValidate = this.onValidate.bind(this);
    this.onLayersChange = this.onLayersChange.bind(this);
    this.onLayersCountChange = this.onLayersCountChange.bind(this);
    this.onRun = this.onRun.bind(this);
  }

  onLayersCountChange(event) {
    var value = event.getValue(),
      newLayersCount = value,
      oldLayersCount = this.state.layersCount,
      newLayers = this.state.layers.slice(0),
      newState = {
        ...this.state
      };
    while (newLayersCount > oldLayersCount) {
      newLayers.push({
          type: 'dense',
          units: 1
      });
      oldLayersCount++;
    }
    while (newLayersCount < oldLayersCount) {
      newLayers.pop();
      oldLayersCount--;
    }
    newLayers[newLayers.length - 1].units = 1;
    newState.layersCount = newLayersCount;
    newState.layers = newLayers;
    this.setState(newState);
  }

  onLayersChange(event) {
    var inputName = event.getName(),
        value = event.getValue(),
        index = inputName.match(/\d+/g)[0],
        name = inputName.replace(/\d+/g, ''),
        newState = {
          ...this.state
        };
    if (newState.layers[index]) {
      newState.layers[index][name] = value;
    }
    this.setState(newState);
  }

  onChange(event) {
    var name = event.getName(),
      value = event.getValue(),
      newState = {
        ...this.state
      };

    newState[name] = value;
    this.setState(newState);
  }

  onRun() {
    if (Ext.isFunction(this.props.onChange)) {
      this.props.onChange(this.state);
    }
  }

  onValidate() {
    if (Ext.isFunction(this.props.onValidate)) {
      this.props.onValidate();
    }
  }
 
  render() {
      return (
        <Panel title="Tensorflow Example" layout={{type: 'vbox', align: 'stretch'}} collapsible="top">
          <Container layout="hbox" margin="10">
            <NumberField 
              name="learningRate"
              label="Learning Rate" 
              value={this.state.learningRate} 
              clearable={false} 
              margin="0 10 0 10"
              onChange={this.onChange}>
            </NumberField>
            <SpinnerField 
              name="numberOfEpochs"
              label="Number of Epochs" 
              value={this.state.numberOfEpochs} 
              clearable={false} 
              margin="0 10 0 10"
              stepValue={10}
              onChange={this.onChange}>
            </SpinnerField>
            <SelectField 
              name="optimizer"
              label="Optimizer" 
              options={[
                { text: 'sgd', value: 'sgd' },
                { text: 'momentum', value: 'momentum' },
                { text: 'adagrad', value: 'adagrad' },
                { text: 'adadelta', value: 'adadelta' },
                { text: 'adam', value: 'adam' },
                { text: 'adamax', value: 'adamax' },
                { text: 'rmsprop', value: 'rmsprop' }
              ]}
              value={this.state.optimizer} 
              margin="0 10 0 10"
              onChange={this.onChange}>
            </SelectField>
            <SelectField 
              name="loss"
              label="Loss" 
              options={[
                { text: 'absoluteDifference', value: 'absoluteDifference' },
                { text: 'computeWeightedLoss', value: 'computeWeightedLoss' },
                { text: 'cosineDistance', value: 'cosineDistance' },
                { text: 'hingeLoss', value: 'hingeLoss' },
                { text: 'huberLoss', value: 'huberLoss' },
                { text: 'logLoss', value: 'logLoss' },
                { text: 'meanSquaredError', value: 'meanSquaredError' },
                { text: 'sigmoidCrossEntropy', value: 'sigmoidCrossEntropy' },
                { text: 'softmaxCrossEntropy', value: 'softmaxCrossEntropy' }
              ]}
              value={this.state.loss} 
              margin="0 10 0 10"
              onChange={this.onChange}>
            </SelectField>
            <SelectField 
              name="metrics"
              label="Metrics" 
              options={[
                { text: 'accuracy', value: 'accuracy' },
                { text: 'binaryAccuracy', value: 'binaryAccuracy' },
                { text: 'binaryCrossentropy', value: 'binaryCrossentropy' },
                { text: 'categoricalAccuracy', value: 'categoricalAccuracy' },
                { text: 'categoricalCrossentropy', value: 'categoricalCrossentropy' },
                { text: 'cosineProximity', value: 'cosineProximity' },
                { text: 'meanAbsoluteError', value: 'meanAbsoluteError' },
                { text: 'meanAbsolutePercentageError', value: 'meanAbsolutePercentageError' },
                { text: 'meanSquaredError', value: 'meanSquaredError' },
                { text: 'precision', value: 'precision' },
                { text: 'recall', value: 'recall' },
                { text: 'sparseCategoricalAccuracy', value: 'sparseCategoricalAccuracy' }
              ]}
              value={this.state.metrics}
              margin="0 10 0 10"
              onChange={this.onChange}>
            </SelectField>
            <Button 
              text="Run" 
              handler={this.onRun}
              margin="0 10 0 10">
            </Button>
            <Button 
              text="Validate" 
              handler={this.onValidate}
              margin="0 10 0 10">
            </Button>
          </Container>
          <Container layout={{type: 'hbox', align: 'start'}} margin="10">
            <SpinnerField 
              name="layersCount"
              label="Count of Layers" 
              value={this.state.layersCount} 
              clearable={false}
              margin="0 10 0 10"
              onChange={this.onLayersCountChange}>
            </SpinnerField>
            <Container layout="vbox" margin="10">
              {this.state.layers.map((value, index) => {
                return <Container key={index} layout="hbox" margin="10">
                          <SelectField 
                            disabled={true}
                            name={"type" + index}
                            label="Type" width="250"
                            options={[
                              { text: 'dense', value: 'dense' }
                            ]}
                            value={value.type}
                            margin="0 10 0 10"
                            onChange={this.onLayersChange}>
                          </SelectField>
                          <SpinnerField 
                            name={"units" + index}
                            label="Count of Units" 
                            value={value.units} 
                            clearable={false} 
                            width="100"
                            margin="0 10 0 10"
                            onChange={this.onLayersChange}>
                          </SpinnerField>
                          <SelectField 
                            name={"activation" + index}
                            label="Activation" width="250"
                            options={[
                              { text: 'elu', value: 'elu' },
                              { text: 'leakyReLU', value: 'leakyReLU' },
                              { text: 'prelu', value: 'prelu' },
                              { text: 'reLU', value: 'reLU' },
                              { text: 'softmax', value: 'softmax' },
                              { text: 'thresholdedReLU', value: 'thresholdedReLU' },
                              { text: 'sigmoid', value: 'sigmoid' },
                              { text: 'none', value: 'none' }
                            ]}
                            value={value.activation || 'none'}
                            margin="0 10 0 10"
                            onChange={this.onLayersChange}>
                          </SelectField>
                      </Container>;
              })}
            </Container>
          </Container>
        </Panel>
      )
  }
}