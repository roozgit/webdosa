import d3 from 'd3-selection';

let svg = Symbol();
let links = Symbol();
let boxNodes = Symbol();

class Aggregation {
    constructor(el, width, height, margin) {

        this[svg] = d3.select(el)
            .append('svg')
            .attr('id', 'svgAggregation')
            .attr('width', width + margin.right + margin.left)
            .attr('height', height + margin.top + margin.bottom)
            .style('border', "1px solid lightgray")
            .append('g')
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");
    }

    addBox(graph, edgeFeature) {

        function calculateBoxEdges() {
            for(let layer of graph.layers.slice(1)) {
                let members = layer.members;
                let withinEdge = 0;
                let betweenEdge = 0;
                for(let memberId of members) {
                    let targets = graph.adjList.get(memberId);
                    for(let target of targets) {
                        let targetLayer = Array.from(target.to.layers).pop();
                        if(targetLayer === +layer.id) { //within edge
                            withinEdge += target.via.map(ev => ev.features[edgeFeature])
                        }
                    }
                }
            }
        }

    }


}

export {Aggregation};