import * as d3fetcher from 'd3-fetch';
import {dispatch} from "./index";
import {HGraph} from "./HGraph";

class Datastore {
    constructor(model) {
        this.model = model;
    }

    getEles() {
        if(!this.nodes || !this.edges) {
            d3fetcher.json("/WebDOSA/data/activsg6.json")
                .then(function(graph) {
                    let hgraph = new HGraph(graph.nodes, graph.edges);
                    dispatch.call('dataLoad', this, hgraph)
                });
        }
    }
}

export default Datastore;