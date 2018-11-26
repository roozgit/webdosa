import * as dispatcher from 'd3-dispatch';
import {Detail} from './detail.js';
import {Widget} from './widget.js';
import {Aggregation} from './aggregation.js'
import Datastore from './datastore';
import {LayerMgr, updateLayerView} from './layers';
import {Plotter} from './plotter';
import {getJsonFromUrl} from "./util";


let scWidgetWidth = 200;
let detailWidth = 680;
let infogWidth = 550;
let height = 750;
let widget, layerMgr, detail, aggregation, svgplots, hgraph;

svgplots = new Map();

const dispatch = dispatcher.dispatch('dataLoad', 'layerAdded', 'layerMoved', 'layerDeleted',
    'overviewUpdate', 'createBoxPlot', 'updateBoxPlot', 'dragBoxPlot', 'toggleLayer');

//Register events and design workflow in a series of callbacks here
dispatch.on('dataLoad', function(graph) {
    hgraph = graph;
    console.log(hgraph);
    widget = new Widget(graph, scWidgetWidth, 2 * height /3,
        {top: 5, right: 5, bottom: 5, left: 5});
    layerMgr = new LayerMgr("#layerMgr", scWidgetWidth, height / 3 - 50,
        {top: 10, right: 20, bottom: 100, left: 10});
    layerMgr.addLayer(hgraph, 0);

    detail = new Detail("#detail", graph, detailWidth, height,
        {top: 10, right: 20, bottom: 25, left: 50});
    aggregation = new Aggregation("#infographic", graph, Object.keys(hgraph.nodes[0].features),
        Object.keys(hgraph.edges[0].features),
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
    let result = hgraph.deleteLayer(layerId);
    detail.removeBrush(layerId, result, hgraph);
    aggregation.removeLayerBox(layerId);
});

dispatch.on('overviewUpdate', function() {
    aggregation.updateOverview(hgraph);
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
        svgplots.get(this.id).plot(mdata, layerData.label, this.featureX, this.featureY, this.plotType);
});

dispatch.on('dragBoxPlot', function(newx, newy, marge) {
    svgplots.get(this).moveTo(newx + marge.left, newy + marge.top);
});

dispatch.on('toggleLayer', function(layerId) {
    let layer = hgraph.layers.find(lay => lay.id===layerId);
    layer.withinVisible = !layer.withinVisible;
    layer.betweenVisible = !layer.betweenVisible;
    if(!layer.withinVisible)
        detail.hideNodes(layerId);
    else
        detail.showNodes(layerId);
});

export {dispatch};
let dataset = getJsonFromUrl()['dataset'];
dataset = dataset ? dataset : "activsg";
const ds = new Datastore(`data/${dataset}.json`);
ds.getEles();