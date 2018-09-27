import * as dispatcher from 'd3-dispatch';
import './datastore.js';
import {Detail} from './detail.js';
import {Widget} from './widget.js';
import {Aggregation} from './aggregation.js'
import Datastore from "./datastore";

let scWidgetWidth = 180;
let detailWidth = 700;
let infogWidth = 400;
let height = 650;

const dispatch = dispatcher.dispatch('dataLoad');

//Register events and design workflow in a series of callbacks here
dispatch.on('dataLoad', function(graph) {
    new Widget("#widgets", graph, scWidgetWidth, height,
        {top: 10, right: 20, bottom: 100, left: 10});
    new Detail("#detail", graph, detailWidth, height,
        {top: 10, right: 20, bottom: 100, left: 100});
});

export {dispatch};

const ds = new Datastore('activsg');
ds.getEles();