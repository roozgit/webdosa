import d3 from 'd3-selection';
import {scaleQuantile, scaleQuantize} from "d3-scale";
import {histogram, range as d3range} from 'd3-array';

let svg = Symbol();

class Widget {
    constructor(el, graph, width, height, margin) {
        this[svg] = d3.select(el)
            .append('svg')
            .attr('id', 'svgWidget')
            .attr('width', width + margin.right + margin.left)
            .attr('height', height + margin.top + margin.bottom)
            .style('border', "1px solid lightgrey")
            .append('g')
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");
        let scaleMap = new Map();
        for(let k of Object.keys(graph.nodes[0].features)) {
            let hs = histogram().domain()
            //console.log(k, qs.quantiles().map(x => qs(x)));
        }
    }

}


export {Widget};