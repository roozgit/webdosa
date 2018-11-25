import d3, {select} from 'd3-selection';
import {histogram, extent as d3extent, max as d3max} from 'd3-array';
import {scaleLinear} from "d3-scale";

let widgetDiv = Symbol();
let wwidth = Symbol();

class Widget {
    constructor(el, graph, width, height, margin) {
        this[widgetDiv] = el;
        this[wwidth] = width;
        this.createWidget(graph, 'nodes');
        this.createWidget(graph, 'edges');
    }

    createWidget(graph, group) {
        for(let k of Object.keys(graph[group][0].features)) {
            let values = graph[group].map(n => n.features[k]);
            let xs = scaleLinear().domain(d3extent(values)).range([0,this[wwidth]]);
            let bins = histogram().domain(xs.domain()).thresholds(xs.ticks(20))(values);
            let y = scaleLinear()
                .domain([0, d3max(bins, d => d.length)]).nice()
                .range([45, 5]);
            let chart = select(this[widgetDiv]).append("svg")
                .attr('height',50)
                .attr("fill", "lightgray");
            chart
                .selectAll("rect")
                .data(bins)
                .enter().append("rect")
                .attr("x", d => xs(d.x0) + 1)
                .attr("width", d => Math.max(0, xs(d.x1) - xs(d.x0) - 1))
                .attr("y", d => y(d.length))
                .attr("height", d => y(0) - y(d.length));
            chart.append('text')
                .attr('x', this[wwidth]/2)
                .attr('y', 0)
                .attr('dy',"1em")
                .text(k)
                .style('fill', "red");
            //ydisp+=50
        }
    }
}


export {Widget};