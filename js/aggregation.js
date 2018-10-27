import * as d3selector from '../node_modules/d3-selection/src/index.js';

class Aggregation {
    constructor(el, width, height, margin) {
        this.svg = d3selector.select(el)
            .append('svg')
            .attr('id', 'svgAggregation')
            .attr('width', width + margin.right + margin.left)
            .attr('height', height + margin.top + margin.bottom)
            .style('border', "1px solid black")
            .append('g')
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");
    }
}

export {Aggregation};