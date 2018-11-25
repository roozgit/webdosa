import d3 from 'd3-selection';
import {histogram, extent as d3extent, range as d3range} from 'd3-array';

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

        for(let k of Object.keys(graph.nodes[0].features)) {
            // let values = graph.nodes.map(n => n.features[k]);
            // //let xs = scaleLinear().domain()
            // let hs = histogram(graph.nodes).domain(d3extent())
            //     .thresholds(20);
            // let bins = hs(d3range(0,21));
            // console.log(k, bins)
            //console.log(k, qs.quantiles().map(x => qs(x)));
        }
    }

}


export {Widget};