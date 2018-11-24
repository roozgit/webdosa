import d3 from 'd3-selection';
import {scaleLinear, scaleOrdinal, scalePoint} from "d3-scale";
import {max, min} from "d3-array";
import {area} from "d3-shape";

let svg = Symbol();

class Widget {
    constructor(el, graph, width, height, margin) {
        //console.log(graph);
        this[svg] = d3.select(el)
            .append('svg')
            .attr('id', 'svgWidget')
            .attr('width', width + margin.right + margin.left)
            .attr('height', height + margin.top + margin.bottom)
            .style('border', "1px solid lightgrey")
            .append('g')
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        //extract multivariate components
        //let nodeMultivars = Object.keys(graph.nodes[0].data);
        let edgeMultivars = Object.keys(graph.edges[0].data);

        //nodeMultivars.splice(0, 4);
        //console.log(nodeMultivars);
        let nodeMultivars = ['pg', 'pd', 'lat', 'lng'];
        let ids = graph.nodes
            .filter(n => n.classes === "bus")
            .map(n => n.data.id);
        let idScale =
            scalePoint()
                .domain(ids)
                .range([0, width]);

        for (let i in nodeMultivars) {
            let item = nodeMultivars[i];
            let varData = graph.nodes.filter(n => n.classes==="bus")
                .map(n => n.data[item]);

            let data = ids.map((id,i) => [id, varData[i]]);
            let multiple = this[svg].append('svg')
                .attr('id', "multiple-" + i)
                .attr('x', 10)
                .attr('y', i * 100)
                .attr('width', width)
                .attr('height', 100)
                .style('border', "1px solid black");
            if (typeof graph.nodes[0].data[item] === "number") {
                let yscale = scaleLinear()
                    .domain([min(varData), max(varData)])
                    .range([height / 10, 0]);

                let areaChart = area()
                    .x(d => idScale(d[0]))
                    .y(d => yscale(d[1]));

                multiple.append('path')
                    .attr('d', areaChart(data))
                    .attr('stroke', "blue")
                    .attr('fill', "blue");
            }
        }
    }

}


export {Widget};