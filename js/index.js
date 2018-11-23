import * as dispatcher from 'd3-dispatch';
import {Detail} from './detail.js';
import {Widget} from './widget.js';
import {Aggregation} from './aggregation.js'
import Datastore from './datastore';
import {LayerMgr, updateLayerView} from './layers';
import {Plotter} from './plotter';
import {getJsonFromUrl} from "./util";


let scWidgetWidth = 180;
let detailWidth = 700;
let infogWidth = 500;
let height = 750;
let widget, layerMgr, detail, aggregation, svgplots, hgraph;

svgplots = new Map();

const dispatch = dispatcher.dispatch('dataLoad', 'layerAdded', 'layerMoved', 'layerDeleted',
    'overviewUpdate', 'createBoxPlot', 'updateBoxPlot', 'dragBoxPlot');

//Register events and design workflow in a series of callbacks here
dispatch.on('dataLoad', function(graph) {
    hgraph = graph;
    console.log(hgraph);
    widget = new Widget("#widgets", graph, scWidgetWidth, 2 *height /3,
        {top: 10, right: 20, bottom: 100, left: 10});
    layerMgr = new LayerMgr("#layerMgr", scWidgetWidth, height / 3,
        {top: 10, right: 20, bottom: 100, left: 10});
    layerMgr.addLayer(hgraph, 0);

    detail = new Detail("#detail", graph, detailWidth, height,
        {top: 10, right: 20, bottom: 100, left: 100});
    aggregation = new Aggregation("#infographic", Object.keys(hgraph.nodes[0].features),
        infogWidth, height, {top: 10, right: 10, bottom: 10, left: 10});
});

dispatch.on('layerAdded', function(selectedIds) {
    hgraph.addLayer(selectedIds);
    layerMgr.addLayer(hgraph, +this['layerId']);
});

dispatch.on('layerMoved', function(selectedIds) {
    hgraph.updateLayer(selectedIds.layer, selectedIds.nodeIds);
    updateLayerView(hgraph.layers, selectedIds.layer)
});

dispatch.on('layerDeleted', function(layerId) {
    hgraph.deleteLayer(layerId);
    detail.removeBrush(layerId);
});

dispatch.on('overviewUpdate', function(overviewObj) {
    aggregation.updateOverview(overviewObj, hgraph);
});

dispatch.on('createBoxPlot', function(layerData, rectangle) {
    rectangle.x += this.left;
    rectangle.y += this.top;
    let newplot = new Plotter('#infographic', rectangle, layerData.id, layerData.label, layerData.color);
    svgplots.set(layerData.id, newplot);
});

dispatch.on('updateBoxPlot', function(layerData) {
    let mdata = [...layerData.members].map(x => hgraph.nodeMap.get(x));
    if(mdata && mdata.length > 0)
        svgplots.get(this).plot(mdata, layerData.label);
});

dispatch.on('dragBoxPlot', function(newx, newy, marge) {
    svgplots.get(this).moveTo(newx + marge.left, newy + marge.top);
});

export {dispatch};
let dataset = getJsonFromUrl()['dataset'];
dataset = dataset ? dataset : "activsg";
const ds = new Datastore(`data/${dataset}.json`);
ds.getEles();