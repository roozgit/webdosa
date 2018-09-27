import DS from './datastore.js';
import {Detail} from './detail.js';
import {Widget} from './widget.js';
import {Aggregation} from './aggregation.js'

let scWidgetWidth = 180;
let detailWidth = 700;
let infogWidth = 400;
let height = 650;

const ds = new DS("activsg");
ds.getEles();

export function dataReady(graph) {
    const scWidgets = new Widget("#widgets", scWidgetWidth, height,
        {top: 10, right: 20, bottom: 100, left: 10});
    const detailGraph = new Detail("#detail", graph, detailWidth, height,
        {top: 10, right: 20, bottom: 100, left: 100});
    const aggregation = new Aggregation("#infographic", infogWidth, height,
        {top: 10, right: 20, bottom: 100, left: 10});
}



