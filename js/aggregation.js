import {scaleLinear} from 'd3-scale';
import d3 from 'd3-selection';


let svg = Symbol();
let scaler = Symbol();

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
        this[scaler] = scaleLinear()
            .domain([0, 6500])
            .range([0, width]);
    }

    updateData(nodes) {
        console.log("trying to update");
        // let rect = this[svg]
        //     .append('rect')
        //     .attr('x', 100)
        //     .attr('y', 100)
        //     .attr('height', this[scaler](nodes[0].size))
        //     .attr('width', this[scaler](nodes[0].size))
    }
}

export {Aggregation};