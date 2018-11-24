import * as dispatcher from 'd3-dispatch';
import {Detail} from './detail.js';
import {Widget} from './widget.js';
import {Aggregation} from './aggregation.js'
import Datastore from "./datastore";
import {LayerMgr} from "./layers";
import {getJsonFromUrl} from "./util";
//import {HGraph as graph} from "./HGraph";

let scWidgetWidth = 300;
let detailWidth = 700;
let infogWidth = 400;
let height = 750;
let widget, layerMgr, detail, aggregation, hgraph;

const dispatch = dispatcher.dispatch('dataLoad', 'layerAdded', 'layerMoved');

//Register events and design workflow in a series of callbacks here
dispatch.on('dataLoad', function(graph) {
    hgraph = graph;
    console.log(hgraph);
    widget = new Widget("#widgets", graph, scWidgetWidth, 2 *height /3,
        {top: 10, right: 20, bottom: 100, left: 10});
    layerMgr = new LayerMgr("#layerMgr", graph, 300, height / 3,
        {top: 10, right: 20, bottom: 100, left: 10});
    layerMgr.addLayer(graph.layers);

    detail = new Detail("#detail", graph, detailWidth, height,
        {top: 10, right: 20, bottom: 100, left: 100});
    aggregation = new Aggregation("#infographic", infogWidth, height,
        {top: 10, right: 20, bottom: 100, left: 100});
});

dispatch.on('layerAdded', function(selectedIds) {
    //aggregation.updateData(selectedNodes);
    hgraph.addLayer(selectedIds);
    layerMgr.addLayer(hgraph.layers);
});

dispatch.on('layerMoved', function(selectedIds) {
    hgraph.updateLayer(selectedIds.layer, selectedIds.nodeIds);
    layerMgr.updateLayer(hgraph.layers, selectedIds.layer)
});

export {dispatch};
let dataset = getJsonFromUrl()['dataset'];
dataset = dataset ? dataset : "activsg";
const ds = new Datastore(`data/${dataset}.json`);
ds.getEles();