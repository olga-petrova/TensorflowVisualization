import React, { Component } from 'react';
import { Panel } from '@sencha/ext-modern';

import * as d3 from "d3";

import './../../styles.css';

export default class Visualization extends Component {

  constructor(props) {
    super(props);
    this.state = {};
    this.isRendered = false;
    this.width = props.width;
    this.height = props.height;
    this.nodeSize = 50;
    this.biasSize = 10;

    this.container = React.createRef();

    this.showTooltip = this.showTooltip.bind(this);
  }

  setWidth (width) {
    this.width = width;
  }


  getSVGContainer () {
    return this.container.cmp.bodyElement.dom;
  }

  getChartData (layers) {
    var nodes = [], links = [], 
      layersCount= layers.length,
      [layer0, ...layers] = layers,
      nodeIndex = 0,
      inputSize = layer0.batchInputShape[1],
      nodesCounts = [inputSize];

    for(var i = 0; i < inputSize; i++) {
      nodes.push({
        id: nodeIndex,
        name: 'x' + i,
        layer: 0,
        index: nodeIndex
      });
      nodeIndex++;
    }
    layers.forEach(function (layer, index) {
      var biasData = layer.bias.val.as1D().dataSync();
      if (layer.kernel) {
        var weightData = layer.kernel.val.dataSync();
        for(var j = 0; j < layer.units; j++) {
          for(var i = 0; i < inputSize; i++) {
            links.push({
              source: nodeIndex - inputSize + i,
              target: nodeIndex + j,
              value: weightData[j * inputSize + i]
            });
          }
        }
      }
      for(var i = 0; i < layer.units; i++) {
        nodes.push({
          id: nodeIndex,
          name: 'l' + (index + 1) + 'n' + (i + 1),
          bias: biasData[i],
          layer: index + 1,
          index: i
        });
        nodeIndex++;
      };
      
      inputSize = layer.units;
      nodesCounts.push(inputSize); 
    });
    return {
      nodes, 
      links,
      layersCount,
      nodesCounts
    };
  }


  componentDidMount() {
    this.setState({
      step: 0
    });
    this.refresh(this.props.layers); 
  }

  tick(state) {
    this.setState({
      step: state.epoch + 1
    });
    this.refresh(state.layers);
  }

  refresh(layers) {
    if (layers.length > 0) {
        let graph = this.getChartData(layers);
        if (graph) {
            this.refreshChart(graph);
        }
    }
  }

  createSVG() {
    this.svg = d3.select(this.getSVGContainer()).append("svg")
        .attr("width", this.width)
        .attr("height", this.height);
  }

  clear() {
      if (this.isRendered) {
        this.svg.remove();
        this.isRendered = false;
        this.step = 0;
      }
  }

  generateNodesData(graph) {
    let ydist = this.height / graph.layersCount;
    graph.nodes.map(function(d) {
        if (d.layer == 0) {
            d["x"] = d.index * (this.props.columnWidth) + (this.props.columnWidth)/2;
        } else {
            d["x"] = d.index * (this.width / graph.nodesCounts[d.layer]) + (this.width / graph.nodesCounts[d.layer])/2;
        }
        d["y"] = this.height - d.layer * ydist - 50;
    }.bind(this));
  }

  removeNodes(graph) {
    let nodes = graph.nodes;

    this.svg.selectAll(".node")
        .data(nodes)
        .exit().remove();
  }

  createNodes(graph) {
    let nodes = graph.nodes, 
        size = this.nodeSize,
        biasSize = this.biasSize,
        showTooltip = this.showTooltip;

    var node = this.svg.selectAll(".node")
        .data(nodes)
        .enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")"; }
        );

    node.append("rect")
        .attr("class", "node_item")
        .attr("width", function (d) { return (d.layer == 0) ? 0 : size;})
        .attr("height", function (d) { return (d.layer == 0) ? 0 : size;})
        .attr("rx", "15")
        .attr("ry", "15");


    node.append("text")
        .attr("class", "node_text")
        .attr("dx", size / 2 - 10)
        .attr("dy", size /2)
        .text(function(d) { return (d.layer == 0) ? "" : d.name; });

    node.append("rect")
        .attr("class", "bias")
        .attr("x", size - 5)
        .attr("y", size*2/3)
        .attr("width", function (d) { return (d.layer == 0) ? 0 : biasSize;})
        .attr("height", function (d) { return (d.layer == 0) ? 0 : biasSize;})
        .on("mouseenter", function(d) {
            showTooltip(this, 'bias', d.bias);
        }).on("mouseleave", function() {
            showTooltip(undefined);
        });

  }

  showTooltip(element, type, value) {
    if (!this.tooltip) {
        this.tooltip = new Ext.tip.ToolTip({
            trackMouse: true,
            listeners: {
                beforeshow: function(tip) {
                    tip.setHtml((this.tooltip.type == 'link' ? 
                        'Weight is ' : 'Bias is ') + Math.round(this.tooltip.value * 100) / 100);
                },
                scope: this
            }, 
        });
    }
    if (type) {
        this.tooltip.value = value;
        this.tooltip.type = type;
        this.tooltip.setTarget(element);
        this.tooltip.show();
    } else {
        this.tooltip.hide();
    }

  }

  removeLinks(graph) {
    let links = graph.links;

    this.svg.selectAll(".link")
        .data(links)
        .exit().remove();
  }

  createDiagonal(d) {
    return "M" + d.source.x + "," + d.source.y
        + "C" + d.source.x + "," + (d.source.y + d.target.y) / 2
        + " " + d.target.x + "," + (d.source.y + d.target.y) / 2 
        + " " + d.target.x + "," + d.target.y;
  }

  createLinks(graph) {
    let nodes = graph.nodes,
        links = graph.links,
        colorScale = this.getLinkColor(),
        widthScale = this.getLinkWidth(),
        showTooltip = this.showTooltip,
        offset = this.nodeSize / 2,
        diagonal = this.createDiagonal;

    this.svg.selectAll(".link")
        .data(links)
        .attr("d", function(d) { return diagonal({
            source: {
                y: nodes[d.source].y + offset,
                x: nodes[d.source].x + offset
              },
            target: {
                y: nodes[d.target].y + offset,
                x: nodes[d.target].x + offset
                }
        }, 0); })
    .enter().append("path")
        .attr("class", "link")
        .attr("d", function(d) { return diagonal({
            source: {
                y: nodes[d.source].y + offset,
                x: nodes[d.source].x + offset
              },
            target: {
                y: nodes[d.target].y + offset,
                x: nodes[d.target].x + offset
                }
        }, 0); })
        .style("stroke-width", function(d) { return widthScale(Math.abs(d.value));})
        .style("stroke", function(d) { return colorScale(d.value);})
        .on("mouseenter", function(d) {
            showTooltip(this, 'link', d.value);
        }).on("mouseleave", function() {
            showTooltip(undefined);
          });
  }

  getLinkColor() {
    return d3.scaleLinear()
        .domain([-1, 0, 1])
        .range(["#f59322", "#e8eaeb", "#0877bd"])
        .clamp(true);
  }

  getLinkWidth() {
    return d3.scaleLinear()
        .domain([0, 5])
        .range([0, 10])
        .clamp(true);
  }

  updateLinks(graph) {
    let colorScale = this.getLinkColor(),
        widthScale = this.getLinkWidth(),
        links = graph.links; 
    this.svg.selectAll(".link")
        .data(links)
        .style("stroke-dashoffset", -this.step * 3)
        .style("stroke-width", function(d) { return widthScale(Math.abs(d.value));})
        .style("stroke", function(d) { return colorScale(d.value);});
  }

  updateNodes(graph) {
    let nodes = graph.nodes, 
        colorScale = this.getLinkColor(),
        size = this.nodeSize,
        biasSize = this.biasSize;

    this.svg.selectAll(".node")
        .data(nodes)
        .attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")"; }
        )
        .attr("width", function (d) { return (d.layer == 0) ? 0 : size;})
        .attr("height", function (d) { return (d.layer == 0) ? 0 : size;});

    this.svg.selectAll(".node_item")
        .data(nodes)
        .attr("width", function (d) { return (d.layer == 0) ? 0 : size;})
        .attr("height", function (d) { return (d.layer == 0) ? 0 : size;});


    this.svg.selectAll(".node_text")
        .data(nodes)
        .text(function(d) { return (d.layer == 0) ? "" : d.name; });

    this.svg.selectAll(".bias")
        .data(nodes)
        .style("fill", function(d) { return colorScale(d.bias || 0);})
        .attr("width", function (d) { return (d.layer == 0) ? 0 : biasSize;})
        .attr("height", function (d) { return (d.layer == 0) ? 0 : biasSize;});

  }

  refreshChart(graph) {
    if (!this.isRendered) {
        this.createSVG();
        this.isRendered = true;
    } 
    this.generateNodesData(graph);
    this.removeLinks(graph);
    this.createLinks(graph);
    this.updateLinks(graph);
    this.removeNodes(graph);
    this.createNodes(graph);
    this.updateNodes(graph);
  }
 
  render() {
      return (
          <Panel title={"Epoch: " + this.state.step} height={this.height} ref={container => this.container = container}></Panel>
      )
  }
}