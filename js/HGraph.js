import {Util} from "./util";

class HGraph {
    constructor(nodes, edges) {
        this.nodes = nodes;
        this.edges = edges;
        this.nodeMap = new Map();
        this.adjList = new Map();
        this.revAdjList = new Map();
        nodes.forEach(n => {
            this.nodeMap.set(n.data.id, n);
        });
        this.edges.forEach(e => {
            let from = this.nodes.find(n => e.data.source === n.data.id);
            let to = this.nodes.find(n => e.data.target === n.data.id);
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
        //console.log(this.adjList);
        //console.log(this.revAdjList);
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

}

export {HGraph};