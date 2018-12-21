import {schemeCategory10} from "d3-scale-chromatic";
import {scaleOrdinal} from "d3-scale";
import {max as d3max, sum as d3sum, range} from "d3-array";

class HGraph {
    constructor(nodes, edges) {
        this.nodes = nodes;
        this.edges = edges;
        this.nodeMap = new Map();
        this.edgeMap = new Map();
        this.adjList = new Map();
        this.revAdjList = new Map();
        this.layers = [];
        this.colorScale = scaleOrdinal(schemeCategory10).domain(range(0, 10));

        nodes.forEach(n => {
            n.layers = [0];
            this.nodeMap.set(n.data.id, n);
        });
        this.edges.forEach(e => {
            let from = this.nodeMap.get(e.data.source);
            let to = this.nodeMap.get(e.data.target);
            e.from = from;
            e.to = to;

            if (from && to) {
                let clist = this.adjList.has(from.data.id) ? this.adjList.get(from.data.id) : [];
                let revclist = this.revAdjList.has(to.data.id) ? this.revAdjList.get(to.data.id) : [];

                let repeated = clist.find(n => n.to.data.id === to.data.id);
                let revrepeated = revclist.find(n => n.from.data.id === from.data.id);

                if (repeated) {
                    let ri = clist.indexOf(repeated);
                    clist[ri] = {to: repeated.to, via: repeated.via.concat([e])};
                    this.adjList.set(from.data.id, clist);
                } else
                    this.adjList.set(from.data.id, clist.concat([{to: to, via: [e]}]));

                if (revrepeated) {
                    let ri = revclist.indexOf(revrepeated);
                    revclist[ri] = {from: revrepeated.from, via: revrepeated.via.concat([e])};
                    this.revAdjList.set(to.data.id, revclist);
                } else
                    this.revAdjList.set(to.data.id, revclist.concat([{from: from, via: [e]}]));
            } else console.log("huh?");
            this.edgeMap.set(e.data.id, e);

        });
        this.layers.push(new Layer(0, //id
            new Set([...this.nodeMap.keys()]),  //members
            "background",  //label
            "lightgrey",   //color
            false, //selected
            new Set(Array.from(this.edgeMap.keys())), //within edges
            new Set(), //between edges
            false,     //totalVisibility
            new Map([['base', () => false]]), //withinFilters
            new Map([['base', () => false]]), //betweenFilters
            new Map([['base', () => false]]), //nodeFilters,
            "lng",
            "lat"
        ));
        this.maxDegTunk = this.maxDegree();
    }

    removeEdges(nodeId, layer) {
        let tos = this.adjList.get(nodeId);
        let froms = this.revAdjList.get(nodeId);
        if (tos) {
            tos.forEach(tov => tov.via.map(tv => tv.data.id)
                .forEach(item => {
                    layer.within.delete(item);
                    layer.between.delete(item);
                }));
        }
        if (froms) {
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
        if (tos) {
            for (let toNode of tos) {
                let targetId = toNode.to.data.id;
                let targetLayers = this.nodeMap.get(targetId).layers;
                let sourceLayers = this.nodeMap.get(nodeId).layers;
                if (sourceLayers[sourceLayers.length - 1] === targetLayers[targetLayers.length - 1])
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
        if (froms) {
            for (let fromNode of froms) {
                let sourceId = fromNode.from.data.id;
                let sourceLayers = this.nodeMap.get(sourceId).layers;
                let targetLayers = this.nodeMap.get(nodeId).layers;
                if (sourceLayers[sourceLayers.length - 1] === targetLayers[targetLayers.length - 1])
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

    addLayer(nodeIds, prx, pry) {
        let topLayerId = d3max(this.layers.map(la => la.id));
        let newLayerId = topLayerId + 1;

        this.layers.forEach(lay => lay.selected = false);
        this.layers.push(new Layer(newLayerId, //id
            new Set(),  //members
            "layer-" + newLayerId,  //label
            this.colorScale(newLayerId - 1),   //color
            true, //selected
            new Set(), //within edges
            new Set(), //between edges
            true,     //totalVisibility
            new Map([['base', () => true]]), //withinFilters
            new Map([['base', () => true]]), //betweenFilters
            new Map([['base', () => true]]), //nodeFilters
            prx,  //projected feature X
            pry   //projected feature Y
        ));
        let newLayer = this.layers[this.layers.length - 1];
        for (let nodeId of nodeIds) {
            let allNodeLayers = this.nodeMap.get(nodeId).layers;
            let currentLayer = this.layers.find(lay => lay.id === allNodeLayers[allNodeLayers.length - 1]);
            allNodeLayers.push(newLayerId);
            currentLayer.members.delete(nodeId);
            this.removeEdges(nodeId, currentLayer);
            newLayer.members.add(nodeId);
            this.addEdges(nodeId, newLayer);
        }
    }

    updateLayer(layer, nodeIds) {
        let curnIdx = this.layers.findIndex(lay => lay.id === layer);
        let curNodes = this.layers[curnIdx].members;
        let curLayer = this.layers[curnIdx];
        for (let cnodeId of curNodes) {
            if (!nodeIds.has(cnodeId)) {
                let tlayers = this.nodeMap.get(cnodeId).layers;
                let spIdx = tlayers.indexOf(layer);
                tlayers.splice(spIdx, 1);
                curNodes.delete(cnodeId);
                this.removeEdges(cnodeId, curLayer);
                let newLayerIdx = this.layers.findIndex(lay => lay.id === tlayers[tlayers.length - 1]);
                let newLayer = this.layers[newLayerIdx];
                while (!newLayer.canTakeNode(this.nodeMap.get(cnodeId)) && newLayerIdx > 0) {
                    newLayerIdx--;
                    newLayer = this.layers[newLayerIdx];
                }
                newLayer.members.add(cnodeId);
                this.addEdges(cnodeId, newLayer);
            }
        }

        for (let nodeId of nodeIds) {
            let allNodeLayers = this.nodeMap.get(nodeId).layers;
            let currentLayer = allNodeLayers[allNodeLayers.length - 1];
            let currentLayerIdx = this.layers.findIndex(lay => lay.id === currentLayer);
            if (currentLayerIdx < curnIdx && curLayer.canTakeNode(this.nodeMap.get(nodeId))) {
                allNodeLayers.push(layer);
                curNodes.add(nodeId);
                this.addEdges(nodeId, curLayer);
                this.layers[currentLayerIdx].members.delete(nodeId);
                this.removeEdges(nodeId, this.layers[currentLayerIdx]);
            }
        }
    }

    deleteLayer(layerId) {
        if (layerId === 0) {
            console.log("Can't delete base layer");
            return {};
        }
        let idx = this.layers.findIndex(la => la.id === layerId);
        let layer = this.layers[idx];
        let withins = layer.within;
        let betweens = layer.between;
        let mems = layer.members;
        for (let nodeId of mems) {
            let node = this.nodeMap.get(nodeId);
            let nodeLayers = node.layers;
            let thisLayerIdx = nodeLayers.findIndex(la => la.id === layerId);
            nodeLayers.splice(thisLayerIdx, 1);
            let newNodeLayerId = nodeLayers[nodeLayers.length - 1];
            let newNodeLayer = this.layers.find(la => la.id === newNodeLayerId);
            newNodeLayer.members.add(nodeId);
            this.addEdges(nodeId, newNodeLayer);
        }
        this.layers.splice(idx, 1);
        for (let lidx = 0; lidx < this.layers.length; lidx++) {
            let higherLayer = this.layers[lidx];
            if (higherLayer.id < layerId) continue;
            for (let nodeId of higherLayer.members) {
                let nodeLayers = this.nodeMap.get(nodeId).layers;
                let deletedLayerIdx = nodeLayers.indexOf(layerId);
                if (deletedLayerIdx > -1) nodeLayers.splice(deletedLayerIdx, 1);
                let vias = [];
                let nAdjList = this.adjList.get(nodeId);
                let nrAdjList = this.revAdjList.get(nodeId);
                if (nAdjList) for (let adjItem of nAdjList) vias.push(...adjItem.via);
                if (nrAdjList) for (let adjItem of nrAdjList) vias.push(...adjItem.via);
                let badVias = vias.filter(d => d.from.layers[d.from.layers.length - 1] === 0 ||
                    d.to.layers[d.to.layers.length - 1] === 0);
                for (let d of badVias.map(d => d.data.id)) betweens.add(d);
            }
        }
        this.selectLayer(this.layers[this.layers.length - 1].id);

        return {
            members: [...mems].map(dx => this.nodeMap.get(dx)),
            within: withins,
            between: betweens
        };
    }

    selectLayer(layerId) {
        if (layerId === 0) return false;
        this.layers.forEach(la => la.selected = false);
        let selectedLayer = this.layers.find(la => la.id === layerId);
        selectedLayer.selected = true;
    }

    raiseLayer(layerId) {
        let layerIdx = this.layers.findIndex(lay => lay.id === layerId);
        if (layerIdx === this.layers.length - 1) {
            console.log('cannot raise this layer');
            return false;
        }
        if (layerIdx === 0) {
            console.log("cannot raise layer zero");
            return false;
        }
        let temp = this.layers[layerIdx + 1];
        this.layers[layerIdx + 1] = this.layers[layerIdx];
        this.layers[layerIdx] = temp;
        return true;
    }

    lowerLayer(layerId) {
        let layerIdx = this.layers.findIndex(lay => lay.id === layerId);
        if (layerIdx === 1) {
            console.log('cannot lower this layer');
            return false;
        }
        if (layerIdx === 0) {
            console.log("cannot lower layer zero");
            return false;
        }
        let temp = this.layers[layerIdx];
        this.layers[layerIdx - 1] = this.layers[layerIdx];
        this.layers[layerIdx] = temp;
        return true;
    }

    maxDegree() {
        let indegs = [];
        let outdegs = [];
        let degs = [];
        for (let node of this.adjList) {
            let rev = this.revAdjList.get(node[0]);
            let outs = d3sum(node[1].map(tonode => tonode.via.length));
            let ins = 0;
            if(rev) ins = d3sum(rev.map(fromnode => fromnode.via.length));
            indegs.push(ins);
            outdegs.push(outs);
            degs.push(ins + outs);
        }
        return d3max(degs);
    }
}

function Layer(id, members, label, color, selected, within, between,
               totalVisibility, withinVisible, betweenVisible, nodeVisible,
               projectedX, projectedY) {
    this.id = id;
    this.members = members;
    this.label = label;
    this.color = color;
    this.selected = selected;
    this.within = within;
    this.between = between;
    this.totalVisibility = totalVisibility;
    this.withinVisible = withinVisible;
    this.betweenVisible = betweenVisible;
    this.nodeVisible = nodeVisible;
    this.projectedX = projectedX;
    this.projectedY = projectedY;
    this.activatedFilters = new Set();

    this.applyWithinFilter = x => [...this.withinVisible].map(f => f[1]).every(filterFunc => filterFunc(x));
    this.applyBetweenFilter = x => [...this.betweenVisible].map(f =>f[1]).every(filterFunc => filterFunc(x));
    this.canTakeNode = x => [...this.nodeVisible].map(f =>f[1]).every(filterFunc => filterFunc(x));
}

export {HGraph};