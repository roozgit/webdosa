import * as d3selector from '../node_modules/d3-selection/src/index.js';
import * as d3scale from '../node_modules/d3-scale/src/index.js';
import * as d3array from '../node_modules/d3-array/src/index.js';
import * as d3axis from '../node_modules/d3-axis/src/index.js';

class Detail {
    constructor(el, graph, width, height, margin) {
        let xPos = graph.nodes.map(n => n.position.x);
        let yPos = graph.nodes.map(n => n.position.y);
        this.width = width;
        this.height = height;
        this.svg = d3selector.select(el)
            .append('svg')
            .attr('id', 'svgDetail')
            .attr('width', width + margin.right + margin.left)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        let xs = d3scale.scaleLinear()
            .domain(d3array.extent(xPos))
            .range([0, width]);
        let ys = d3scale.scaleLinear()
            .domain(d3array.extent(yPos))
            .range([height, 0]);

        this.svg.append('g')
            .call(d3axis.axisLeft(ys));
        this.svg.append('g')
            .attr("transform", "translate(0," + height + ")")
            .call(d3axis.axisBottom(xs));

        this.svg.append('text')
            .attr('transform', "rotate(-90)")
            .attr('y', 0 - margin.left)
            .attr('x', 0 - (height / 2))
            .attr('dy', "1em")
            .style('text-anchor', "middle")
            .text("Y");


        let points = this.svg.append('g')
            //.attr("transform", "translate(0," + height + ")")
            .selectAll('circle')
            .data(graph.nodes).enter()
            .append('circle')
            .attr('cx', d => xs(d.position.x))
            .attr('cy', d => ys(d.position.y))
            .attr('r', 2);
    }
}

export {Detail};