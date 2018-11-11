import d3 from 'd3-selection';

let svg = Symbol();
let originalCoords = Symbol();
let boxSize = Symbol();

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

    addBox(graph) {
        this[svg].selectAll('rect')
            .data(graph.layers.slice(1)).enter()
            .append('rect')
            .attr('x',)
    }
}

export {Aggregation};