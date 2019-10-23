import React, { Component } from 'react';
import { Grid } from '@sencha/ext-modern';


export default class BaseGrid extends Component {

  constructor(props) {
    super(props);
  }


  //TODO: improve dirty fix
  fixHeightBug() {
    this.grid.cmp.setItemPosition = function(item, y) {
      if (item.$hidden) {
        this.setItemHidden(item, false);
      }
      
      if (item.$position !== y) {
        item.$position = y;
        item.translate(null, y);
      }
      item.$height = 40;
      return item.$height;
    }
  }
  
  update(tensor, fields, meta) {
    this.data = this.fromTensorToData(tensor, fields, meta);
    this.fixHeightBug();
    if (!this.store) {
      this.columns = this.getColumns(fields, meta);
      this.store = Ext.create('Ext.data.Store', {
          fields: fields,
          data: this.data
      });
    } else {
      Ext.Array.each(this.grid.cmp.getColumns(), function (column) {
        if (column.config.xtype !== 'rownumberer') {
          column.setWidth(this.columnWidth);
        }
      }, this);
      this.store.removeAll();
      this.store.add(this.data);
    }
  }


  fromTensorToData(tensor, fields, meta) {
    var data = [];
    (tensor[0]).forEach(function (row, index) {
      var values = row.concat(tensor[1][index]),
          dataRow = {},
          valueIndex = 0;
          
      fields.forEach(function (field, i) {
        
        var metaItem = meta.filter((item) => {
          return (item.feature == field);
        });
        if (metaItem.length > 0) {
          dataRow[field] = values[valueIndex];
          valueIndex++;
        } else {
          dataRow[field] = undefined;
        }
      });
      data.push(dataRow);
    });
    return data;
  }
}