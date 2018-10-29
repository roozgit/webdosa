import * as dispatcher from 'd3-dispatch';
import {Detail} from './detail.js';
import {Widget} from './widget.js';
import {Aggregation} from './aggregation.js'
import Datastore from "./datastore";

let scWidgetWidth = 180;
let detailWidth = 700;
let infogWidth = 400;
let height = 650;
let widget, detail, aggregation;

const dispatch = dispatcher.dispatch('dataLoad', 'selectionChanged');

//Register events and design workflow in a series of callbacks here
dispatch.on('dataLoad', function(graph) {
    widget = new Widget("#widgets", graph, scWidgetWidth, height,
        {top: 10, right: 20, bottom: 100, left: 10});
    detail = new Detail("#detail", graph, detailWidth, height,
        {top: 10, right: 20, bottom: 100, left: 100});
    aggregation = new Aggregation("#infographic", infogWidth, height,
        {top: 10, right: 20, bottom: 100, left: 100});
});

dispatch.on('selectionChanged', function(selectedNodes) {
    aggregation.updateData(selectedNodes);
});

export {dispatch};

const ds = new Datastore('activsg');
ds.getEles();