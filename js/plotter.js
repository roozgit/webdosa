import d3 from 'd3-selection';
import {scaleLinear} from "d3-scale";
import {extent as d3extent} from "d3-array";
import {area} from "d3-shape";

let svg = Symbol();
let scaleX = Symbol();
let scaleY = Symbol();
let pcolor = Symbol();
let gplot = Symbol();

const plottypes = ["scatter", "bar", "line", "area"];
const plotMargin = 15;


class Plotter {
    constructor(location, svgRect, id, label, color) {
        let x = svgRect.x;
        let y = svgRect.y;
        let width = svgRect.width;
        let height = svgRect.height;
        this.pwidth = width;
        this.pheight = height;
        this[pcolor] = color;
        this[svg] = d3.select(location).select('svg')
            .append('svg')
            .attr('id', "boxplot-" + id)
            .attr('x', x)
            .attr('y', y)
            .attr('width', this.pwidth)
            .attr('height', this.pheight);

        this[svg].append('text')
            .attr('x', this.pwidth /2 - plotMargin)
            .attr('y', 0)
            .attr('dx', "-3.5em")
            .attr('dy', "1em")
            .text(label)
            .style('fill', color);

        this[gplot] = this[svg].append('g')
            .attr('class', "clipperPath")
            .attr('transform', `translate(${plotMargin}, ${plotMargin})`);

        // this[svg].append('line')
        //     .attr('x1', plotMargin)
        //     .attr('y1', this.pheight - plotMargin)
        //     .attr('x2', this.pwidth - plotMargin)
        //     .attr('y2', this.pheight - plotMargin)
        //     .attr('stroke', this[pcolor]);
    }

    plot(gdata, label, featureX, featureY, plottype) {

        let featureNames = Object.keys(gdata[0].features);
        if(!featureX || !featureNames.includes(featureX)) featureX = "index";
        if(!featureY || !featureNames.includes(featureY)) featureY = "index";

        //plot types : scatter", bar, line, area
        if(!plottype || !plottypes.includes(plottype)) plottype = "scatter";

        let fx = gdata.map(d => +d.features[featureX]);
        let fy = gdata.map(d => +d.features[featureY]);

        this[scaleX] = scaleLinear().domain(d3extent(fx)).range([0, this.pwidth-2*plotMargin]);
        this[scaleY] = scaleLinear().domain(d3extent(fy)).range([this.pheight-2*plotMargin, 0]);

        let posx = fx.map(d => this[scaleX](d));
        let posy = fy.map(d => this[scaleY](d));

        let pos = posx.map((d, i) => {
            return [d, posy[i]];
        });

        switch(plottype) {
            case "scatter":
            case "bar":
            case "line":
                this[gplot].selectAll('*').remove();
                this[gplot]
                    .selectAll('circle').data(pos).enter()
                    .append('circle')
                    .attr('cx', d => d[0])
                    .attr('cy', d => d[1])
                    .attr('r', 1)
                    .attr('fill', this[pcolor]);
                break;
            case "area":
                pos.sort((a, b) => a[0]-b[0]);
                this[gplot].selectAll('*').remove();
                let area1 = area()
                    .x(d => d[0])
                    .y0(this[scaleY](0))
                    .y1(d => d[1]);
                this[gplot].append('path')
                    .datum(pos)
                    .attr('d', area1)
                    .attr('fill', this[pcolor]);


                break;

        }
    }

    moveTo(x, y) {
        this[svg].attr('x', x).attr('y', y);
    }
}

export {Plotter, plotMargin};