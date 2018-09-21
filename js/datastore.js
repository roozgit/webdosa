import * as d3fetcher from '../node_modules/d3-fetch/src/index.js';

class Datastore {
    constructor(model) {
        this.model = model;
        this.nodes =[];
        this.edges =[];
    }

    getData() {
        if(this.model === "activsg") {
            d3fetcher.json("/WebDOSA/data/activsg.json").then(rows => {
                rows.forEach(d => {
                    if (d.group === "nodes") this.nodes.push(d);
                    else this.edges.push(d);
                });
            });
        }
        return {
            nodes: this.nodes,
            edges: this.edges
        };
    }

}

export default Datastore