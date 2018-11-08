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
                    graph.nodes.forEach(n => {
                        n.classes = "bus";
                        n.features={};
                        n.features.pd = n.data.pd;
                        n.features.pg = n.data.pg;
                        n.features.qd = n.data['Total Q demand(MVAr)'];
                        n.features.qg = n.data['Total Q gen(MVAr)'];
                        n.features.va = n.data['Voltage Angle(deg)'];
                        n.features.vm = n.data['Voltage Level(KV)'];
                        n.features.lng = n.position.x;
                        n.features.lat = n.position.y;
                        delete n.data.Telemetry;
                        delete n.data['Total Q demand(MVAr)'];
                        delete n.data['Total Q gen(MVAr)'];
                        delete n.data['Voltage Angle(deg)'];
                        delete n.data['Voltage Level(KV)'];
                        delete n.data['pgdiff'];
                        delete n.data.pd;
                        delete n.data.pg;
                    });
                    graph.edges.forEach(e => {
                        e.features={};
                        e.features.bmag = e.data.Bmag;
                        e.features.gmag = e.data.Gmag;
                        e.features.ltrating = e.data['LT_Rating'];
                        e.features.phaseShift = e.data['Phase Shift'];
                        e.features.r = e.data['R'];
                        e.features.x = e.data['X'];
                        e.features.flowMVA = e.data['flow_MVA'];
                        e.features.fromP = e.data['fromP'];
                        e.features.fromQ = e.data['fromQ'];
                        e.features.toP = e.data['toP'];
                        e.features.toQ = e.data['toQ'];
                        e.features.fromSideBchg = e.data['From Side Bchg'];
                        e.features.toSideBchg = e.data['To Side Bchg'];
                        e.features.dtype = e.classes.split()[0];

                        delete e.data.Bmag;
                        delete e.data.Gmag;
                        delete e.data['LT_Rating'];
                        delete e.data['Phase Shift'];
                        delete e.data['R'];
                        delete e.data['X'];
                        delete e.data['flow_MVA'];
                        delete e.data['fromP'];
                        delete e.data['fromQ'];
                        delete e.data['From Tap'];
                        delete e.data['To Tap'];
                        delete e.data['toP'];
                        delete e.data['toQ'];
                        delete e.data['From Side Bchg'];
                        delete e.data['To Side Bchg'];
                        delete e.data.Telemetry;
                        delete e.position;
                        delete e.from;
                        delete e.to;
                    });
                    console.log(graph);
                    let hgraph = new HGraph(graph.nodes, graph.edges);
                    dispatch.call('dataLoad', this, hgraph)
                });
        }
    }
}

export default Datastore;