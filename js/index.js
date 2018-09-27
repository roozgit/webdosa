import './datastore.js';
import {Detail} from './detail.js';
import {Widget} from './widget.js';
import {Aggregation} from './aggregation.js'
import Datastore from "./datastore";

let scWidgetWidth = 180;
let detailWidth = 700;
let infogWidth = 400;
let height = 650;

export class Mediator {
    static channels = new Map();

    static subscribe(channel, fn) {
        if(!Mediator.channels.has(channel))
            Mediator.channels.set(channel, []);
        Mediator.channels.get(channel).push({context: this, callback: fn});
    }

    static publish(channel, data) {
        if(!Mediator.channels.has(channel))
            return false;

        Mediator.channels.get(channel)
            .forEach(ch => ch.callback.call(ch.context, data));
    }
}

Mediator.subscribe('dataFromStore', function(graph) {
    new Widget("#widgets", graph, scWidgetWidth, height,
        {top: 10, right: 20, bottom: 100, left: 10});
    new Detail("#detail", graph, detailWidth, height,
        {top: 10, right: 20, bottom: 100, left: 100});
});

const ds = new Datastore('activsg');
ds.getEles();