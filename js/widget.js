import d3, {select} from 'd3-selection';
import {histogram, extent as d3extent, max as d3max, range as d3range} from 'd3-array';
import {scaleLinear} from "d3-scale";
import {brushX} from "d3-brush";

let widgetTab1 = Symbol();
let widgetTab2 = Symbol();
let wwidth = Symbol();
const svgh = 60;
const svgBotMargin = 25;

class Widget {
    constructor(graph, width, height, margin) {
        select('div#widgets')
            .style('height', height+"px")
            .style('width', width+"px")
            .style('margin-left', margin.left+"px")
            .style('margin-top', margin.top+"px")
            .style('margin-right', margin.right+"px")
            .style('margin-bottom', margin.bottom+"px");

        this[widgetTab1] = select('#tab-1-content');
        this[widgetTab2] = select('#tab-2-content');
        this[wwidth] = width - 30;

        this.createWidget(graph, 'nodes', this[widgetTab1]);
        this.createWidget(graph, 'edges', this[widgetTab2]);
    }

    createWidget(graph, group, tab) {
        let brushed = function() {
            let brushExt = d3.event.selection;
            let extents = brushExt.map(d => this.scaler(d));

        };

        for(let k of Object.keys(graph[group][0].features)) {
            let values = graph[group].map(n => n.features[k]);

            if(typeof values[0] !== "number") {
                let vset = [...(new Set(values))];
                let mapping = d3range(1, vset.length+1);
                values = values.map(x => mapping[vset.indexOf(x)]);
            }
            let ext = d3extent(values);
            let xs = scaleLinear().domain(ext).nice()
                .range([0,this[wwidth]]);
            let bins = histogram().domain(xs.domain()).thresholds(xs.ticks(40))(values);

            let y = scaleLinear()
                .domain([0, d3max(bins, d => d.length)]).nice()
                .range([svgh-svgBotMargin, 0]);

            let chart = tab.append('svg')
                .attr('id', "scent-" + k)
                .attr('class', "scentedSvg")
                .attr('height', svgh)
                .attr('width', this[wwidth])
                .attr("fill", "grey");

            chart.selectAll("rect")
                .data(bins)
                .enter().append("rect")
                .attr("x", d => xs(d.x0) + 1)
                .attr("width", d => Math.max(0, xs(d.x1) - xs(d.x0) - 1))
                .attr("y", d => y(d.length))
                .attr("height", d => y(0) - y(d.length));

            let estr = ext[1].toFixed(1);

            chart.append('text')
                .attr('class', "axis-tick")
                .attr('x', 0)
                .attr('y', svgh)
                .text(ext[0].toFixed(1));
            chart.append('text')
                .attr('class', "axis-tick")
                .attr('x', this[wwidth])
                .attr('dx', `-${estr.length/2}em`)
                .attr('y', svgh)
                .text(ext[1].toFixed(1));

            chart.append('text')
                .attr('x', this[wwidth]/2)
                .attr('dx', "-1.5em")
                .attr('y', svgh)
                .attr('dy',"-0.5em")
                .text(k)
                .style('fill', "grey");

            //brush creation for each chart
            let  brush = brushX()
                .extent([[0, 0], [this[wwidth], svgh - svgBotMargin]])
                .on("brush end", brushed.bind({group: group, feature: k, scaler: xs}));

            chart.append("g")
                .attr("class", "scentedBrush")
                .attr('id', "scentedBrush-" + k)
                .call(brush)
        }
    }

}


export {Widget};