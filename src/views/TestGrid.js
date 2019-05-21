Ext.require('Ext.grid.cell.Widget');

import React, { Component } from 'react';
import { Grid } from '@sencha/ext-modern';
import BaseGrid from './BaseGrid.js';

export default class TestGrid extends BaseGrid {

  constructor(props) {
    super(props);

    this.onPredictAll = this.onPredictAll.bind(this);
    this.getResults = this.getResults.bind(this);
  }

  componentWillReceiveProps(props) {
    this.update(props.tensors[1], props.fields, props.meta);
  }

  predict(record) {
    var values = [],
        result,
        meta = this.props.meta;
    meta.forEach(function (metaItem) {
        values.push(record.get(metaItem.feature));
    });
    result = values.pop();
    if (Ext.isFunction(this.props.onPredict)) {
      this.props.onPredict(values).then((value) => {
        var prediction = ((value[0] < 0.2) && (value[0] > -0.2)) ? 0 : (value[0] > 0) ? 1 : -1;
        
        if (values[8] > 0) {
            prediction = (value[0] > 0) ? 1 : -1
        }
        result = (result == prediction) ? 'Success' : 'Failure';
        record.set('predict', result);
    })};
  }

  getResults() {
    var grid = this.grid.cmp,
      success = 0, failure = 0;
    grid.getStore().each((record) => {
      if (record.get('predict') == "Success") {
          success++;
        } else {
          failure++;
        }
    }, this);
    Ext.Msg.alert('Validation Results', 'Success: ' + success + ', Failure: ' + failure);
  }

  onPredict(button) {
    var cell = button.up(),
        record = cell.getRecord();
    this.predict(record);
  }

  onPredictAll() {
    var grid = this.grid.cmp;
    grid.getStore().each((record) => {
      this.predict(record);
    }, this);
    setTimeout(this.getResults, 1000);
  }

  getColumns(fields, meta) {
    var columns = [{
      xtype: 'rownumberer'
    }];
    for(var index in fields) {
      var field = fields[index],
        metaItem = (meta) ? meta.filter((item) => {
          return (item.feature == field);
        })[0] : {};

      columns.push({
        text: fields[index],
        dataIndex: fields[index],
        hidden: (Ext.isEmpty(metaItem)),
        hideable: (index == (fields.length - 1)) ? false: true,
        width: 280
      });
    }
    columns.push({
      dataIndex: 'predict',
      width: 200,
      cell: {
        xtype: 'widgetcell',
        widget: {
            xtype: 'button',
            text: 'Click to Predict',
            bind: {
              text: '{predict}',
              disabled: '{!ready}'
            },
            
            listeners: {
              tap: this.onPredict,
              scope: this
            }
        }
    },
    });
    return columns;
  }
 
  render() {
      return (
        <Grid 
            store={this.store} 
            columns={this.columns} 
            itemConfig= {{
              viewModel: {}
            }}
            flex="1"
            border="1" 
            ref={grid => this.grid = grid}
            >
        </Grid>
      )
  }
}

