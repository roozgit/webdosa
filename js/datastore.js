import * as d3fetcher from 'd3-fetch';
import {dispatch} from "./index";
import {HGraph} from "./HGraph";

class Datastore {
    constructor(address) {
        this.addr = address;
    }

    getEles() {
        if(!this.nodes || !this.edges) {
            d3fetcher.json(this.addr)
                .then(function(graph) {
                    let hgraph = new HGraph(graph.nodes, graph.edges);
                    dispatch.call('dataLoad', this, hgraph)
                });
        }
    }

    remoteGet() {
    //    Write a function that connects to the server (use d3fetcher.json
    //
    }
}

export default Datastore;