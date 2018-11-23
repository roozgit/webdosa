import d3 from 'd3-selection';
import {arcLinks, ellipticalArc, insideRect, intersect, samples} from "./util";
import {drag} from "d3-drag";
import {dispatch} from './index';
import {scaleLinear, scaleLog, scaleSequential} from "d3-scale";
import {interpolateBasis, interpolateNumber} from "d3-interpolate";
import {range as d3range} from 'd3-array';

let svg = Symbol();
let boxLinks = Symbol();
let boxNodes = Symbol();
let boxLables = Symbol();
let swidth = Symbol();
let sheight = Symbol();
let amargin = Symbol();

const quadSep = 60;
const boxWidth = 150;
const displacementSelf = [
    {dx1 : boxWidth, dy1 : boxWidth/2, dx2 : boxWidth/2, dy2 : 0, dir: "1,0", arrowRot: 180},
    {dx1 : 0, dy1 : boxWidth/2, dx2 : boxWidth/2, dy2 : 0, dir: "1,1"},
    {dx1 : boxWidth, dy1 : boxWidth/2, dx2 : boxWidth/2, dy2 : boxWidth, dir: "1,1"},
    {dx1 : 0, dy1 : boxWidth/2, dx2 : boxWidth/2, dy2 : boxWidth, dir: "1,0"}
];
const displacementBetween =
    {dx1 : boxWidth/2, dy1 : boxWidth/2, dx2 : boxWidth/2, dy2 : boxWidth/2, dir: "1,0"};

function markerGenerator(color, mid) {
    let tmarker = d3.select('#aggDefs')
        .append('marker')
        .attr('id', "arrowHead-" + mid)
        .attr('viewBox', "0 0 10 10")
        .attr('markerWidth', 2)
        .attr('markerHeight', 2)
        .attr('refX', "2")
        .attr('refY', "5")
        .attr('markerUnits', "strokeWidth")
        .attr('orient', "auto")
        .attr('overflow', "visible")
        .attr('fill', color);
    tmarker.append('path')
        .attr('d', "M 0 0 L 5 5 L 0 10 z");
}

class Aggregation {
    constructor(el, features, width, height, margin) {

        this[amargin] = margin;

        this[svg] = d3.select(el)
            .append('svg')
            .attr('id', 'svgAggregation')
            .attr('width', width + margin.right + margin.left)
            .attr('height', height + margin.top + margin.bottom)
            .style('border', "1px solid lightgray")
            .append('g')
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        d3.select('#svgAggregation').insert('defs', "g")
            .attr('id', "aggDefs");

        this[swidth] = width;
        this[sheight] = height;
        this[boxNodes] = this[svg].append('g')
            .attr('id', "boxer");

        this[boxLinks] = this[svg].append('g')
            .attr('id', "linker");

            //select boxes
        let aggControlsX = d3.select('#aggControls')
            .append('select')
            .style("position", "relative")
            .attr("id", "agxvar");

        aggControlsX.selectAll("option")
            .data(features).enter()
            .append("option")
            .attr("value", d => d)
            .text(d => d);

        let aggControlsY = d3.select('#aggControls')
            .append('select')
            .style("position", "relative")
            .attr("id", "agyvar");
        aggControlsY.selectAll("option")
            .data(features).enter()
            .append("option")
            .attr("value", d => d)
            .text(d => d);

        aggControlsX.selectAll('option').filter(d => d==="index").attr('selected', "selected");
        aggControlsY.selectAll('option').filter(d => d==="index").attr('selected', "selected");
    }

    /*
    fsel: feature selection function:
 */
    updateOverview(overviewObj, graph) {
        let within = overviewObj.within;
        let between = overviewObj.between;
        let laycopy = graph.layers.slice(1);
        let betweenMap = new Map();

        //let interpolator = interpolateBasis(d3range(0, graph.edges.length));
        let edgeScaler = scaleLog().domain([1,graph.edges.length])
            .range([1,100]);

        between.forEach(btg => {
            let branch = graph.edgeMap.get(btg);
            let idl = branch.from.layers[branch.from.layers.length-1] +
                "-" + branch.to.layers[branch.to.layers.length-1];
            if(betweenMap.has(idl))
                betweenMap.set(idl, betweenMap.get(idl).concat([btg]));
            else
                betweenMap.set(idl, [btg]);
        });

        let betweenAgg = [];
        for (let key of [...betweenMap.keys()]) {
            let keys = key.split("-");
            betweenAgg.push({
                    source: laycopy.find(la => la.id === +keys[0]),
                    target: laycopy.find(la => la.id === +keys[1]),
                    displacement : displacementBetween,
                    value: betweenMap.get(key).length
                });
        }

        let withinAgg = [...within.keys()].map(kw => {
            let dest = within.get(kw)[0];
            if(dest)
                return {
                    source: laycopy.find(la => la.id === dest.dlayers[0]),
                    target: laycopy.find(la => la.id === dest.dlayers[0]),
                    displacement : displacementSelf[(dest.dlayers[0]-1) % 4],
                    value: within.get(kw).length
                };
            else return undefined;
        }).filter(arr => arr);

        let allArr = withinAgg.concat(betweenAgg);

        let mmargin = this[amargin];
        let boxDragger = drag()
            .on('drag', function() {
                let item = d3.select(this);
                item.data()[0].x = +d3.event.x;
                item.data()[0].y = +d3.event.y;
                item.attr('x', +d3.event.x)
                    .attr('y', +d3.event.y);

                dispatch.call('dragBoxPlot', +item.attr('id').split("-")[1], +d3.event.x, +d3.event.y, mmargin);

                d3.select('#linker').selectAll('path')
                    .filter(d => d.source.id === item.data()[0].id || d.target.id === item.data()[0].id)
                    .attr('d', d => {
                        let sx = +d.source.x + d.displacement.dx1;
                        let sy = +d.source.y + d.displacement.dy1;
                        let tx = +d.target.x + d.displacement.dx2;
                        let ty = +d.target.y + d.displacement.dy2;
                        if(d.source.x===d.target.x && d.source.y===d.target.y)
                            return ellipticalArc(sx, sy, tx, ty, boxWidth, boxWidth/2, boxWidth/2, d.displacement.dir);
                        else
                            return arcLinks(sx,sy,tx,ty,1,quadSep);
                    })
                    .attr('stroke-width', d => edgeScaler(d.value));
                pathUpdater();
            });

        this[boxNodes].selectAll('rect')
            .data(laycopy, la=>la.id).enter()
            .append('rect')
            .attr('id', d => "box-" + d.id)
            .attr('x', (this[swidth]-150) * Math.random())
            .attr('y', (this[sheight]-250) * Math.random())
            .attr('width', boxWidth)
            .attr('height', boxWidth)
            .attr('stroke', d => d.color)
            .attr('stroke-width', "5px")
            .call(boxDragger);

        //draw diagrams inside boxes
        this[boxNodes].selectAll('rect').each(function(d) {
            if(d3.select('#boxplot-'+ d.id).empty())
                dispatch.call('createBoxPlot', mmargin, d, d3.select(this).node().getBBox());
            else
                dispatch.call('updateBoxPlot', d.id, d);
        });

        //End of draw diagrams inside boxes

        if(allArr.length > 0) {
            laycopy.forEach(la => {
                la.x = this[boxNodes].selectAll('rect')
                    .filter(d => d.id===la.id).attr('x');

                la.y = this[boxNodes].selectAll('rect')
                    .filter(d => d.id===la.id).attr('y');
            });

            let boln = this[boxLinks].selectAll('path')
                .data(allArr, d => d.source.id + "-" + d.target.id);

            boln.exit().remove();
            boln.attr('stroke-width', d => edgeScaler(d.value));
            boln.enter()
                .append('path')
                .attr('id', d => "bigPath-" + d.source.id + "-" + d.target.id )
                .attr('class', "arrows")
                .attr('d', d => {
                    let sx = +d.source.x + d.displacement.dx1;
                    let sy = +d.source.y + d.displacement.dy1;
                    let tx = +d.target.x + d.displacement.dx2;
                    let ty = +d.target.y + d.displacement.dy2;
                    if(d.source.x===d.target.x && d.source.y===d.target.y)
                        return ellipticalArc(sx, sy, tx, ty, boxWidth, boxWidth/2, boxWidth/2, d.displacement.dir);
                    else
                        return arcLinks(sx,sy,tx,ty,1,quadSep);
                })
                .attr("stroke-width", d => edgeScaler(d.value))
                .attr("fill", "none")
                .attr("stroke", d => {
                    if(d.source.id === d.target.id)
                        return d.source.color;
                })
                .attr('marker-end', d => {
                    if(d3.select('#arrowHead-' + d.source.id).empty()) {
                        markerGenerator(d.source.color, d.source.id);
                    }
                    return `url(#arrowHead-${d.source.id})`
                });
        } else this[boxLinks].selectAll('path').remove();

        var pathUpdater = () => {
            let rects = new Map();
            let paths = new Map();
            this[boxNodes].selectAll('rect').each(function(d) {
                rects.set(d.id, d3.select(this).node().getBBox());
            });
            this[boxLinks].selectAll('path').filter(d => d.source.id!==d.target.id)
                .each(function(d) {
                    paths.set(d.source.id + "-" + d.target.id,
                        {pathBreak: samples(d3.select(this).node(), 8), pathData: d}
                    );
                    d3.select(this).remove();
                });
            for(let pat of paths) {
                let patsplit = pat[0].split("-");
                let b1 = patsplit[0];
                let b2 = patsplit[1];
                let isec1 = intersect(pat[1].pathBreak, rects.get(+b1));
                let isec2 = intersect(pat[1].pathBreak, rects.get(+b2));
                let newpat = arcLinks(isec1[0],isec1[1], isec2[0], isec2[1], 1, quadSep);
                this[boxLinks].selectAll('path').filter(d => d.id === "bigPath-"+pat[0]).remove();
                this[boxLinks].append('path')
                    .datum(pat[1].pathData, d => d.source.id + "-" + d.target.id)
                    .attr('id', pat[0])
                    .attr("stroke-width", d => edgeScaler(d.value))
                    .attr('d', newpat)
                    .attr("fill", "none")
                    .attr("stroke", d => d.source.color)
                    .attr('marker-end', d => {
                        if(d3.select('#arrowHead-' + d.source.id).empty()) {
                            markerGenerator(d.source.color, d.source.id);
                        }
                        return `url(#arrowHead-${d.source.id})`
                    });
            }
        };
        pathUpdater();
    }

}

export {Aggregation};