import d3 from 'd3-selection';
import {arcLinks, ellipticalArc, gradientGenerator, insideRect, intersect, samples} from "./util";
import {drag} from "d3-drag";
import {dispatch} from './index';
import {scaleLog} from "d3-scale";
import {sum as d3sum, min as d3min} from 'd3-array';
import {plotMargin} from "./plotter";

let svg = Symbol();
let boxLinks = Symbol();
let boxNodes = Symbol();
let swidth = Symbol();
let sheight = Symbol();
let amargin = Symbol();
let aggControlsX = Symbol();
let aggControlsY = Symbol();
let aggEdges = Symbol();
let arrowFeature = Symbol();
let arrowFunc = Symbol();
let edgeScaler = Symbol();
let plotTypes = Symbol();

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
        .attr('overflow', "hidden")
        .attr('fill', color);
    tmarker.append('path')
        .attr('d', "M 0 0 L 5 5 L 0 10 z");
}

class Aggregation {
    constructor(el, graph, features, edgeFeatures, width, height, margin) {
        this[amargin] = margin;
        this[arrowFunc] = x => [...x].length;
        this[arrowFeature] = "count";

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
        d3.select('#aggDefs').append("clipPath")
            .attr("id", "aggClip")
            .append("rect")
            .attr("width", boxWidth - 2 * plotMargin)
            .attr("height", boxWidth - 2 * plotMargin);

        this[swidth] = width;
        this[sheight] = height;
        this[boxNodes] = this[svg].append('g')
            .attr('id', "boxer");

        this[boxLinks] = this[svg].append('g')
            .attr('id', "linker");

            //select boxes
        this[aggControlsX] = d3.select('#aggControls')
            .append('select')
            .style("position", "relative")
            .attr("id", "agxvar")
            .style('visibility', "hidden")
            .on('change', () => this.boxPlots(this[amargin]));

        this[aggControlsX].selectAll("option")
            .data(features).enter()
            .append("option")
            .attr("value", d => d)
            .text(d => d);

        this[aggControlsY] = d3.select('#aggControls')
            .append('select')
            .style("position", "relative")
            .attr("id", "agyvar")
            .style('visibility', "hidden")
            .on('change', () => this.boxPlots(this[amargin]));

        this[aggControlsY].selectAll("option")
            .data(features).enter()
            .append("option")
            .attr("value", d => d)
            .text(d => d);

        //edge feature selection
        this[aggEdges] = d3.select('#aggControls')
            .append('select')
            .style("position", "relative")
            .attr("id", "agEdges")
            .style('visibility', "hidden")
            .on('change', () => {
                this[arrowFeature] = this[aggEdges].node().value;
                if(this[arrowFeature] === "count") {
                    this[arrowFunc] = x => [...x].length;
                } else if(this[arrowFeature]==="dtype") {
                    this[arrowFunc] = x => new Set([...x]
                        .map(dv => graph.edgeMap.get(dv).features[this[arrowFeature]])).size;
                } else {
                    this[arrowFunc] = x => d3sum([...x]
                        .map(dv => graph.edgeMap.get(dv).features[this[arrowFeature]]));
                }
                this.updateOverview(graph);
            });
        this[aggEdges].selectAll("option")
            .data(edgeFeatures.concat(["count"])).enter()
            .append("option")
            .attr("value", d => d)
            .text(d => d);

        //plot types
        this[plotTypes] = d3.select('#aggControls')
            .append('select')
            .style("position", "relative")
            .attr("id", "agPlotType")
            .style('visibility', "hidden")
            .on('change', () => this.boxPlots(this[amargin]));
        this[plotTypes].selectAll('option')
            .data(["scatter", "line", "chart", "area", "bar", "pie"]).enter()
            .append('option')
            .attr('value', d => d)
            .text(d =>d);
    }

    calcAggregates(graph, ffunc) {
        let layerData = graph.layers.filter(lay => lay.totalVisibility);
        let withinAgg = layerData.map(lay => [lay.id, [...lay.within].filter(d => lay.applyWithinFilter(d))])
            .map(wit => {
                let dest = wit[0];
                if(dest)
                    return {
                        source: layerData.find(la => la.id === wit[0]),
                        target: layerData.find(la => la.id === wit[0]),
                        displacement : displacementSelf[(wit[0]===0 ? 0 : (wit[0]-1)) % 4],
                        value: ffunc(wit[1])
                    };
                else return undefined;
            }).filter(arr => arr);

        let betweenAgg = layerData.map(lay => [lay.id, [...lay.between].filter(d => lay.applyBetweenFilter(d))])
            .map(wit => {
                let betMap = new Map();
                for(let d of wit[1]) {
                    let branch = graph.edgeMap.get(d);
                    let slayerId = branch.from.layers[branch.from.layers.length-1];
                    if(slayerId !== wit[0]) continue;
                    //let slayer = graph.layers.find(lx => lx.id===slayerId);
                    let tlayerId = branch.to.layers[branch.to.layers.length-1];
                    if(tlayerId === wit[0]) continue;
                    let tlayer = graph.layers.find(lx => lx.id===tlayerId);
                    if(tlayer.applyBetweenFilter(branch.to)) {
                        let madeupId = slayerId+"-"+tlayerId;
                        betMap.has(madeupId) ?
                            betMap.set(madeupId, betMap.get(madeupId).concat([d])) :
                            betMap.set(madeupId, [d]);
                    }
                }
                let res = [];
                for(let bm of betMap) {
                    let madeupId = bm[0].split("-");
                    let sid = +madeupId[0];
                    let tid = +madeupId[1];
                    res.push({
                        source: layerData.find(la => la.id === sid),
                        target: layerData.find(la => la.id === tid),
                        displacement: displacementBetween,
                        value: ffunc(bm[1])
                    });
                }
                return res;
            }).reduce((acc, cur) => acc.concat(cur), []);
        return withinAgg.concat(betweenAgg);
    }

    removeLayerBox(layerId) {
        this[boxNodes].select('rect#box-'+layerId).remove();
        this[boxLinks].selectAll('path').filter(d => {
            if(d.source.id === layerId || d.target.id === layerId)
                return true;
        }).remove();
        d3.selectAll('.aggValues').remove();
        d3.select('#boxplot-'+layerId).remove();
    }

    updateOverview(graph) {
        let laycopy = graph.layers.filter(lay => lay.totalVisibility);
        let allArr = this.calcAggregates(graph, this[arrowFunc]);

        let extentSelector;
        if(this[arrowFeature] === "count") {
            extentSelector = [1,graph.edges.length];
        }
        else {
            let tarr = graph.edges.map(dv => Math.abs(dv.features[this[arrowFeature]]));
            let lowerBound = d3min(tarr);
            if(lowerBound===0) lowerBound=.1;
            extentSelector = [lowerBound, d3sum(tarr)];
        }

        this[edgeScaler] = scaleLog().domain(extentSelector)
            .range([1,80]).clamp(true);

        let mmargin = this[amargin];
        let boxDragger = drag()
            .on('drag', function(dat) {
                let item = d3.select('#box-'+dat.id);
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
                    .attr('stroke-width', d => this[edgeScaler](Math.abs(d.value)));
                pathUpdater();
            }.bind(this));

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

        this.boxPlots(mmargin);

        if(allArr.length > 0) {
            laycopy.forEach(la => {
                la.x = this[boxNodes].selectAll('rect')
                    .filter(d => d.id === la.id).attr('x');

                la.y = this[boxNodes].selectAll('rect')
                    .filter(d => d.id === la.id).attr('y');
            });

            let boln = this[boxLinks].selectAll('path')
                .data(allArr, d => d.source.id + "-" + d.target.id);

            boln.exit().remove();
            boln.attr('stroke-width', d => this[edgeScaler](Math.abs(d.value)));
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
                .attr("stroke-width", d => this[edgeScaler](Math.abs(d.value)))
                .attr("fill", "none")
                .attr("stroke", d => {
                    if(d.source.id === d.target.id)
                        return d.source.color;
                    else {
                        if(d.source.x <= d.target.x) {
                            if(d3.select('#aggDefs').select(`#agrad-${d.source.id}-${d.target.id}-lr`)
                                .empty()) {
                                gradientGenerator('#aggDefs', d.source.id, d.target.id,
                                    graph.layers.find(la => la.id===d.source.id).color,
                                    graph.layers.find(la => la.id===d.target.id).color, "lr");
                            }
                            return `url(#agrad-${d.source.id}-${d.target.id}-lr)`;
                        } else {
                            if(d3.select('#aggDefs').select(`#agrad-${d.source.id}-${d.target.id}-rl`)
                                .empty()) {
                                gradientGenerator('#aggDefs', d.source.id, d.target.id,
                                    graph.layers.find(la => la.id===d.target.id).color,
                                    graph.layers.find(la => la.id===d.source.id).color, "rl");
                            }
                            return `url(#agrad-${d.source.id}-${d.target.id}-rl)`;
                        }
                    }
                })
                .attr('marker-end', d => {
                    if(d.source.id === d.target.id)
                        if(d3.select('#arrowHead-' + d.target.id).empty()) {
                            markerGenerator(d.target.color, d.target.id);
                        }
                    return `url(#arrowHead-${d.target.id})`
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
                        {pathBreak: samples(d3.select(this).node(), 12), pathData: d}
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
                    .attr("stroke-width", d => this[edgeScaler](Math.abs(d.value)))
                    .attr('d', newpat)
                    .attr("fill", "none")
                    .attr("stroke", d => {
                        if(d.source.id === d.target.id)
                            return d.source.color;
                        else {
                            if(d.source.x <= d.target.x) {
                                if(d3.select('#aggDefs').select(`#agrad-${d.source.id}-${d.target.id}-lr`)
                                    .empty()) {
                                    gradientGenerator('#aggDefs', d.source.id, d.target.id,
                                        graph.layers.find(la => la.id===d.source.id).color,
                                        graph.layers.find(la => la.id===d.target.id).color, "lr");
                                }
                                return `url(#agrad-${d.source.id}-${d.target.id}-lr)`;
                            } else {
                                if(d3.select('#aggDefs').select(`#agrad-${d.source.id}-${d.target.id}-rl`)
                                    .empty()) {
                                    gradientGenerator('#aggDefs', d.source.id, d.target.id,
                                        graph.layers.find(la => la.id===d.target.id).color,
                                        graph.layers.find(la => la.id===d.source.id).color, "rl");
                                }
                                return `url(#agrad-${d.source.id}-${d.target.id}-rl)`;
                            }
                        }
                    })
                    .attr('marker-end', d => {
                        if(d.source.id !== d.target.id)
                            if(d3.select('#arrowHead-' + d.target.id).empty()) {
                                markerGenerator(d.target.color, d.target.id);
                            }
                            return `url(#arrowHead-${d.target.id})`;
                    });
            }
            d3.selectAll('.aggValues').remove();
            this[boxLinks].selectAll('path')
                .each(function(d) {
                    let pathEl = d3.select(this).node();
                    let evalue = Number.isInteger(d.value) ? d.value : d.value.toFixed(2);
                    let midpoint = pathEl.getPointAtLength(pathEl.getTotalLength()/2);

                    let valueLabel = d3.select('#linker').append('text')
                        .attr('class', "aggValues")
                        .attr('x', midpoint.x)
                        .attr('y', midpoint.y)
                        .attr('font-size', "2em")
                        .text(evalue)
                        .style('fill', "white");
                    valueLabel.raise();
                });
        };
        pathUpdater();

        this[aggControlsX].style('visibility', "visible");
        this[aggControlsY].style('visibility', "visible");
        this[aggEdges].style('visibility', "visible");
        this[plotTypes].style('visibility', "visible");
        this[aggControlsX].selectAll('option').filter(d => d==="index").attr('selected', "selected");
        this[aggControlsY].selectAll('option').filter(d => d==="index").attr('selected', "selected");
        this[aggEdges].selectAll('option').filter(d => d==="count").attr('selected', "selected");
        this[plotTypes].selectAll('option').filter(d => d==="scatter").attr('selected', "selected");
    }

    boxPlots(mmargin) {
        this[boxNodes].selectAll('rect').each(function(d) {
            if(d3.select('#boxplot-'+ d.id).empty())
                dispatch.call('createBoxPlot', mmargin, d, d3.select(this).node().getBBox());
            else
                dispatch.call('updateBoxPlot', {id: d.id,
                    featureX: d3.select('#agxvar').node().value,
                    featureY: d3.select('#agyvar').node().value,
                    plotType: d3.select('#agPlotType').node().value
                }, d);
        });
    }

}

export {Aggregation};