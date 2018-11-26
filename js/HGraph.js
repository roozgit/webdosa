import {schemeCategory10} from "d3-scale-chromatic";
import {scaleOrdinal} from "d3-scale";
import {max as d3max, range} from "d3-array";

class HGraph {
    constructor(nodes, edges) {
        this.nodes = nodes;
        this.edges = edges;
        this.nodeMap = new Map();
        this.edgeMap = new Map();
        this.adjList = new Map();
        this.revAdjList = new Map();
        this.layers = [];
        this.colorScale = scaleOrdinal(schemeCategory10).domain(range(0,10));

        nodes.forEach(n => {
            n.layers = [0];
            this.nodeMap.set(n.data.id, n);
        });
        this.edges.forEach(e => {
            let from = this.nodeMap.get(e.data.source);
            let to = this.nodeMap.get(e.data.target);
            e.from = from; e.to = to;

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
            this.edgeMap.set(e.data.id, e);

        });
        this.layers.push({id:0, members: new Set([...this.nodeMap.keys()]),
            label:"background", color: "lightgrey", selected: false,
            nodesVisible: true, edgesVisible : false,
            within: new Set(Array.from(this.edgeMap.keys())),
            between : new Set(),
            withinVisible: false,
            betweenVisible: false
        });
    }

    removeEdges(nodeId, layer) {
        let tos = this.adjList.get(nodeId);
        let froms = this.revAdjList.get(nodeId);
        if(tos) {
            tos.forEach(tov => tov.via.map(tv => tv.data.id)
                .forEach(item => {
                    layer.within.delete(item);
                    layer.between.delete(item);
                }));
        }
        if(froms) {
            froms.forEach(tov => tov.via.map(tv => tv.data.id)
                .forEach(item => {
                    layer.within.delete(item);
                    layer.between.delete(item);
                }));
        }

    }

    addEdges(nodeId, layer) {
        let tos = this.adjList.get(nodeId);
        let froms = this.revAdjList.get(nodeId);
        if(tos) {
            for (let toNode of tos) {
                let targetId = toNode.to.data.id;
                let targetLayers = this.nodeMap.get(targetId).layers;
                let sourceLayers = this.nodeMap.get(nodeId).layers;
                if (sourceLayers[sourceLayers.length-1] === targetLayers[targetLayers.length-1])
                    toNode.via.map(tv => tv.data.id)
                        .forEach(tnv => {
                            layer.within.add(tnv);
                            layer.between.delete(tnv);
                        });
                else
                    toNode.via.map(tv => tv.data.id)
                        .forEach(tnv => {
                            layer.between.add(tnv);
                            layer.within.delete(tnv);
                        });
            }
        }
        if(froms) {
            for(let fromNode of froms) {
                let sourceId = fromNode.from.data.id;
                let sourceLayers = this.nodeMap.get(sourceId).layers;
                let targetLayers = this.nodeMap.get(nodeId).layers;
                if(sourceLayers[sourceLayers.length-1] === targetLayers[targetLayers.length-1])
                    fromNode.via.map(tv => tv.data.id)
                        .forEach(fnv => {
                            layer.within.add(fnv);
                            layer.between.delete(fnv);
                        });
                else
                    fromNode.via.map(tv => tv.data.id)
                        .forEach(fnv => {
                            layer.between.add(fnv);
                            layer.within.delete(fnv);
                        });
            }
        }
        // console.log(layer.id, [...layer.within].map(ed => [this.edgeMap.get(ed).from.layers.slice(-1)[0], this.edgeMap.get(ed).to.layers.slice(-1)[0]]),
        //     [...layer.between].map(ed => [this.edgeMap.get(ed).from.layers.slice(-1)[0], this.edgeMap.get(ed).to.layers.slice(-1)[0]]));
    }

    addLayer(nodeIds) {
        let topLayerId = d3max(this.layers.map(la => la.id));
        let newLayerId = topLayerId + 1;

        this.layers.forEach(lay => lay.selected = false);
        this.layers.push({id: newLayerId, members: new Set(), label: "layer-"+newLayerId,
            color: this.colorScale(newLayerId-1), selected: true,
            within : new Set(), between: new Set(),
            withinVisible: true,
            betweenVisible: true});

        let newLayer = this.layers[this.layers.length-1];
        //let newLayerMembers = new Set();
        for(let nodeId of nodeIds) {
            let allNodeLayers = this.nodeMap.get(nodeId).layers;
            let currentLayer = this.layers.find(lay => lay.id === allNodeLayers[allNodeLayers.length-1]);
            allNodeLayers.push(newLayerId);
            currentLayer.members.delete(nodeId);
            this.removeEdges(nodeId, currentLayer);
            newLayer.members.add(nodeId);
            this.addEdges(nodeId, newLayer);
        }
    }

    updateLayer(layer, nodeIds) {
        let curnIdx = this.layers.findIndex(lay => lay.id ===layer);
        let curNodes = this.layers[curnIdx].members;
        let curLayer = this.layers[curnIdx];
        for(let cnodeId of curNodes) {
            if(!nodeIds.has(cnodeId)) {
                let tlayers = this.nodeMap.get(cnodeId).layers;
                let spIdx = tlayers.indexOf(layer);
                tlayers.splice(spIdx, 1);
                curNodes.delete(cnodeId);
                this.removeEdges(cnodeId, curLayer);
                let newLayer = this.layers.find(lay => lay.id ===tlayers[tlayers.length-1]);
                newLayer.members.add(cnodeId);
                this.addEdges(cnodeId, newLayer);
            }
        }

        for(let nodeId of nodeIds) {
            let allNodeLayers = this.nodeMap.get(nodeId).layers;
            let currentLayer = allNodeLayers[allNodeLayers.length - 1];
            let currentLayerIdx = this.layers.findIndex(lay => lay.id===currentLayer);
            if(currentLayerIdx < curnIdx) {
                allNodeLayers.push(layer);
                curNodes.add(nodeId);
                this.addEdges(nodeId, curLayer);
                this.layers[currentLayerIdx].members.delete(nodeId);
                this.removeEdges(nodeId, this.layers[currentLayer]);
            }
        }
    }

    deleteLayer(layerId) {
        if(layerId===0) {
            console.log("Can't delete base layer");
            return {};
        }
        let idx = this.layers.findIndex(la => la.id=== layerId);
        let layer = this.layers[idx];
        let withins = layer.within;
        let betweens = layer.between;
        let mems = layer.members;
        for(let nodeId of mems) {
            let node = this.nodeMap.get(nodeId);
            let nodeLayers = node.layers;
            let thisLayerIdx = nodeLayers.findIndex(la => la.id===layerId);
            nodeLayers.splice(thisLayerIdx, 1);
            let newNodeLayerId = nodeLayers[nodeLayers.length-1];
            let newNodeLayer = this.layers.find(la => la.id === newNodeLayerId);
            newNodeLayer.members.add(nodeId);
            this.addEdges(nodeId, newNodeLayer);
        }
        this.layers.splice(idx, 1);
        return {members: [...mems].map(dx => this.nodeMap.get(dx)),
            within: withins,
            between: betweens};
    }

    selectLayer(layerId) {
        this.layers.forEach(la => la.selected = false);
        let selectedLayer = this.layers.find(la => la.id===layerId);
        selectedLayer.selected = true;
    }

}

export {HGraph};