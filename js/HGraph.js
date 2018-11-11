import {schemeCategory10} from "d3-scale-chromatic";
import {scaleOrdinal} from "d3-scale";
import {max as d3max, range} from "d3-array";

class HGraph {
    constructor(nodes, edges) {
        this.nodes = nodes;
        this.edges = edges;
        this.nodeMap = new Map();
        this.adjList = new Map();
        this.revAdjList = new Map();
        this.layers = [];
        this.colorScale = scaleOrdinal(schemeCategory10).domain(range(0,10));


        nodes.forEach(n => {
            n.layers = [0];
            this.nodeMap.set(n.data.id, n);
        });
        this.edges.forEach(e => {
            let from = this.nodes.find(n => e.data.source === n.data.id);
            let to = this.nodes.find(n => e.data.target === n.data.id);
            e.from = from.data.id; e.to = to.data.id;
            if(from && to) {
                let clist = this.adjList.has(from.data.id) ? this.adjList.get(from.data.id) : [];
                let revclist = this.revAdjList.has(to.data.id) ? this.revAdjList.get(to.data.id) : [];

                let repeated = clist.find(n => n.to.data.id === to.data.id);
                let revrepeated = revclist.find(n => n.from.data.id === from.data.id);

                if(repeated) {
                    let ri = clist.indexOf(repeated);
                    clist[ri] = {to : repeated.to, via: repeated.via.concat([e])};
                    this.adjList.set(from.data.id, clist);
                } else
                    this.adjList.set(from.data.id, clist.concat([{to: to, via: [e]}]));

                if(revrepeated) {
                    let ri = revclist.indexOf(revrepeated);
                    revclist[ri] = {from : revrepeated.from, via: revrepeated.via.concat([e])};
                    this.revAdjList.set(to.data.id, revclist);
                } else
                    this.revAdjList.set(to.data.id, revclist.concat([{from: from, via: [e]}]));
            } else console.log("huh?");

        });
        this.layers.push(
            {id:0, members: new Set([...this.nodeMap.keys()]), label:"background", color: "lightgrey"});

    }

    getAdj(node) {
        return this.adjList.get(node);
    }

    nodes() {
        return this.nodes;
    }

    edges() {
        return this.edges;
    }

    addLayer(nodeIds) {
        let topLayerId = d3max(this.layers.map(la => la.id));
        let newLayerId = topLayerId + 1;
        let newLayerMembers = new Set();
        for(let nodeId of nodeIds) {
            let allNodeLayers = this.nodeMap.get(nodeId).layers;
            let currentLayer = this.layers.find(lay => lay.id === [...allNodeLayers].pop());
            allNodeLayers.push(newLayerId);
            currentLayer.members.delete(nodeId);
            newLayerMembers.add(nodeId);
        }
        this.layers.push({id: newLayerId, members: newLayerMembers, label: "layer-"+newLayerId,
            color: this.colorScale(newLayerId-1)});
    }

    updateLayer(layer, nodeIds) {
        let curnIdx = this.layers.findIndex(lay => lay.id ===layer);
        let curNodes = this.layers[curnIdx].members;
        //let lowerLayer = this.layers[curnIdx-1].members;
        for(let cnodeId of curNodes) {
            if(!nodeIds.has(cnodeId)) {
                let tlayers = this.nodeMap.get(cnodeId).layers;
                let spIdx = tlayers.indexOf(layer);
                tlayers.splice(spIdx, 1);
                curNodes.delete(cnodeId);
                this.layers.find(lay => lay.id ===tlayers[tlayers.length-1]).members.add(cnodeId);
            }
        }

        for(let nodeId of nodeIds) {
            let allNodeLayers = this.nodeMap.get(nodeId).layers;
            let currentLayer = allNodeLayers[allNodeLayers.length - 1];
            if(currentLayer < layer) {
                allNodeLayers.push(layer);
                curNodes.add(nodeId);
                this.layers[currentLayer].members.delete(nodeId);
            }
        }

    }
}

export {HGraph};