class HGraph {
    constructor(nodes, edges) {
        this.nodes = nodes;
        this.edges = edges;
        this.nodeMap = new Map();
        this.adjList = new Map();
        nodes.forEach(n => {
            this.nodeMap.set(n.data.id, n);
        });
        console.log(this.nodeMap)
        this.edges.forEach(e => {
            let from = this.nodes.find(n => e.data.source === n.data.id);
            let to = this.nodes.find(n => e.data.target === n.data.id);
            if(from && to) {
                let clist = this.adjList.has(from.data.id) ? this.adjList.get(from.data.id) : [];
                this.adjList.set(from.data.id, clist.concat([to]))
            } else console.log("huh?");
        })
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