import React, { Component } from 'react';
import { Grid } from '@sencha/ext-modern';
import BaseGrid from './BaseGrid.js';

export default class DataGrid extends BaseGrid {

  constructor(props) {
    super(props);

    this.refreshHeaders = this.refreshHeaders.bind(this);
  }

  componentWillReceiveProps(props) {
    this.update(props.tensors[0], props.fields, props.meta);
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
        text: field,
        dataIndex: field,
        hidden: (Ext.isEmpty(metaItem)),
        hideable: (index == (fields.length - 1)) ? false: true,
        width: 280,
        menu:[{
              xtype: 'menuradioitem',
              group: 'normalization',
              name: 'normalization',
              text: 'No normalization',
              value: 'none',
              checkHandler: this.refreshHeaders
          },{
              xtype: 'menuradioitem',
              group: 'normalization',
              name: 'normalization',
              text: 'Min/max normalization',
              value: 'min_max_normalization',
              checkHandler: this.refreshHeaders
          },{
              xtype: 'menuradioitem',
              group: 'normalization',
              name: 'normalization',
              text: 'Mean normalization',
              value: 'mean_normalization',
              checkHandler: this.refreshHeaders
          },{
              xtype: 'menuradioitem',
              group: 'normalization',
              name: 'normalization',
              text: 'Standartization',
              value: 'standartization',
              checkHandler: this.refreshHeaders
          },
          {
              xtype: 'menuradioitem',
              group: 'normalization',
              name: 'normalization',
              text: 'Scaling',
              value: 'scaling',
              checkHandler: this.refreshHeaders
          }]
      });
    }
    
    return columns;
  }

  getHeaders() {
    var headers = [];
    for(let column of this.grid.cmp.getColumns()) {
        if ((column.xtype != 'rownumberer') && column.isVisible()) {
            var normalization = (column.getMenu().getGroups())['normalization'];
            headers.push({
              feature: column.getText(),
              normalization: normalization || 'none'
            });
        }
    } 
    return headers;
  } 

  refreshHeaders() {
    if (this.props.onFieldsChange && (typeof(this.props.onFieldsChange) == "function")) {
        this.props.onFieldsChange(this.getHeaders());
      }
  }
 
  render() {
      return (
        <Grid 
            store={this.store} 
            columns={this.columns} 
            border="1" 
            flex="1" 
            infinite={true}
            maxHeight={500}
            rowHeight={40}
            onColumnHide={this.refreshHeaders} 
            onColumnShow={this.refreshHeaders}
            ref={grid => this.grid = grid}
            >
        </Grid>
      )
  }
}