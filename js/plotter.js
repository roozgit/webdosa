import d3 from 'd3-selection';
import {scaleLinear} from "d3-scale";
import {extent as d3extent} from "d3-array";

let svg = Symbol();
let scaleX = Symbol();
let scaleY = Symbol();
let pcolor = Symbol();

const plottypes = ["scatter", "bar", "line", "area"];
const margin = 15;

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
            .attr('x', this.pwidth /2 - margin)
            .attr('y', margin)
            .text(label)
            .style('fill', color);
    }

    plot(gdata, label, featureX, featureY, plottype) {

        let featureNames = Object.keys(gdata[0].features);
        if(!featureX || !featureNames.includes(featureX)) featureX = "index";
        if(!featureY || !featureNames.includes(featureY)) featureY = "index";

        //plot types : scatter", bar, line, area
        if(!plottype || !plottypes.includes(plottype)) plottype = "scatter";

        let fx = gdata.map(d => +d.features[featureX]);
        let fy = gdata.map(d => +d.features[featureY]);

        this[scaleX] = scaleLinear().domain(d3extent(fx)).range([0, this.pwidth]);
        this[scaleY] = scaleLinear().domain(d3extent(fy)).range([this.pheight, 0]);

        let posx = fx.map(d => this[scaleX](d));
        let posy = fy.map(d => this[scaleY](d));

        let pos = posx.map((d, i) => {
            return [d, posy[i]];
        });

        switch(plottype) {
            case "scatter":
            case "bar":
            case "line":
            case "area":
                let dps = this[svg].selectAll('circle').data(pos);
                dps.exit().remove();

                dps.enter()
                    .append('circle')
                    .attr('cx', d => d[0])
                    .attr('cy', d => d[1])
                    .attr('stroke', "gray")
                    .attr('r', 1)
                    .attr('fill', "gray");
        }
    }

    moveTo(x, y) {
        this[svg].attr('x', x).attr('y', y);
    }
}

export {Plotter};