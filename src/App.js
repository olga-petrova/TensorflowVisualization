import React, { Component } from 'react';
import { Panel, TabPanel, Container } from '@sencha/ext-modern';

import Processor from './Processor';
import TensorFlow from './TensorFlow';

import Visualization from './views/Visualization.js';
import DataGrid from './views/DataGrid.js';
import TestGrid from './views/TestGrid.js';
import ControlToolbar from './views/Toolbar.js';

import Data from './data_preprocessing/Data.js';
import preprocessor from './data_preprocessing/DataPreprocessor.js';

Ext.require('Ext.layout.Fit');


export default class App extends Component {

  constructor(props) {
    super(props);
    
    //var processor = new preprocessor(),
    //test = processor.collectData(Data, Data);
    //debugger


    this.updateState = this.updateState.bind(this);
    this.state = {
      epoch: 0,
      layers: [],
      config: {
        learningRate: .01,
        numberOfEpochs: 200,
        optimizer: "adam",
        loss: "sigmoidCrossEntropy",
        metrics: "accuracy",
        layersCount: 1,
        layers: [
          {
            type: 'dense',
            units: 1,
            activation: 'sigmoid'
          }
        ]
      },
      meta: undefined,
      tensors: [],
      fields: []
    };
    this.processor = new Processor();
    this.tensorFlow = new TensorFlow();
    
    this.processor.loadUrl().then((response) => {
      response.json().then((data) => {
        this.dataIsLoaded = true;
        this.processor.setData(data);
        this.processor.setConfig({
          targetField: 'matchResult',
          splitter: (item) => {
            return (([2018]).indexOf(item.year) > -1);
          }
        });
        this.tensorFlow.setConfig(this.state.config);
        this.updateDataConfig();
        this.restart();
      });
    });

    this.onFieldsChange = this.onFieldsChange.bind(this);
    this.onPredict = this.onPredict.bind(this);
    this.onConfigChange = this.onConfigChange.bind(this);
    this.onValidate = this.onValidate.bind(this);
    this.onModelTrained = this.onModelTrained.bind(this);

    
  }

  updateDataConfig() {
    var dataConfig = (!this.state.meta) ? this.calculateMeta() : {
      meta: this.state.meta,
      field: this.state.fields
    };
    this.processor.setMeta(dataConfig.meta);
    dataConfig.tensors = this.processor.process();
    this.setState(dataConfig);
  }


  calculateMeta() {
    var initNormalization = {
      //"wins_team1":"scaling",
      //"wins_team2":"scaling",
      //"wins_team1_last_12years":"scaling",
      //"wins_team2_last_12years":"scaling",
      "wins_team1_minus_wins_team2":"scaling",
      "wins_team1_against_team2":"scaling",
      "wins_team1_minus_wins_team2_last_12years":"scaling",
      "wins_team1_against_team2_last_12years":"scaling",
      "wins_team1_against_team2_in_stage":"scaling",
      "isHomeCountry":"scaling",
      "stage":"scaling",
      //"attendance":"scaling",
      "matchResult":"none"
    },
    fields = this.processor.getHeaders()
      .filter((header) => {
        return (header != 'year');
      }),
    meta = fields.map((header) => {
      if (initNormalization[header]) {
        return {
          feature: header,
          normalization: initNormalization[header]
        };
      }
    }).filter((item) => {
      return (item);
    });
    
    return {
      meta, fields
    };
  }

  onModelTrained() {
    this.modelIsReady = true;
    Ext.Msg.alert('Model is trained', 'Model is successfully trained');
  }

  onPredict(item) {
    return this.tensorFlow.predict(item);
  }

  updateState(epoch, layers) {
    this.vis.tick({
      epoch: epoch,
      layers: layers
    });
  }

  onFieldsChange(meta) {
    this.state.meta = meta;
    this.updateDataConfig();
    this.restart();
  }

  onConfigChange(config) {
    this.tensorFlow.setConfig(config);
    this.restart();
  }

  onValidate() {
    var tabPanel = this.tabPanel.cmp;
    tabPanel.getTabBar().setActiveTab(1);
    this.testGrid.onPredictAll();
  }

  refresh() {
    this.vis.clear();
    this.tensorFlow.start(this.state.tensors, this.updateState, this.onModelTrained);
    this.modelIsReady = false;
  }

  restart() {
    if (this.modelIsReady) {
      this.refresh();
    } else {
      this.tensorFlow.stop(() => {
        this.refresh();
      });
    }
  }
 
  render() {
      return (
        <Panel layout="vbox">
          <ControlToolbar config={this.state.config} onChange={this.onConfigChange} onValidate={this.onValidate}></ControlToolbar>
          <Visualization 
            layers={this.state.layers} 
            epoch={this.state.epoch} 
            width={window.innerWidth} 
            height={Math.round(window.innerHeight*0.3)}
            ref={vis => this.vis = vis} 
            columnWidth={Math.round(window.innerWidth / (this.state.meta ? this.state.meta.length + 1 : 1))}>
          </Visualization>
          <TabPanel tabBar={{docked: 'bottom'}} flex="1" ref={tabPanel => this.tabPanel = tabPanel}>
            <Container title="Train Data" layout="fit">
              <DataGrid 
                fields={this.state.fields} 
                meta={this.state.meta} 
                tensors={this.state.tensors} 
                onFieldsChange={this.onFieldsChange}
                columnWidth={Math.round(window.innerWidth / (this.state.meta ? this.state.meta.length + 1 : 1))}>
              </DataGrid>
            </Container>
            <Container title="Test Data" layout="fit">
              <TestGrid 
                fields={this.state.fields} 
                meta={this.state.meta} 
                tensors={this.state.tensors} 
                onPredict={this.onPredict} 
                ref={testGrid => this.testGrid = testGrid}
                columnWidth={Math.round(window.innerWidth / (this.state.meta ? this.state.meta.length + 1 : 1))}>
              </TestGrid>
            </Container>
          </TabPanel>
        </Panel>
      )
  }
}

