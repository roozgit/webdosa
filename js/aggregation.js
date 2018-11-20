import d3 from 'd3-selection';
import {arcLinks, ellipticalArc, insideRect, intersect, samples} from "./util";
import {drag} from "d3-drag";

let svg = Symbol();
let boxLinks = Symbol();
let boxNodes = Symbol();
let swidth = Symbol();
let sheight = Symbol();

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
    constructor(el, width, height, margin) {

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

    }

    /*
    fsel: feature selection function:
 */
    updateOverview(overviewObj, graph, fsel) {
        let within = overviewObj.within;
        let between = overviewObj.between;

        let laycopy = graph.layers.slice(1);

        let betweenAgg = between.map(btg => {
            return {
                source: laycopy.find(la => la.id === btg.dlayers[0]),
                target: laycopy.find(la => la.id === btg.dlayers[1]),
                displacement : displacementBetween,
                value: btg.length
            };
        });

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

        let boxDragger = drag()
            .on('drag', function() {
                let item = d3.select(this);
                item.data()[0].x = +d3.event.x;
                item.data()[0].y = +d3.event.y;
                item.attr('x', +d3.event.x)
                    .attr('y', +d3.event.y);

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
                    });
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
            //.attr('fill', "black")
            .call(boxDragger);

        if(allArr.length > 0) {
            laycopy.forEach(la => {
                la.x = this[boxNodes].selectAll('rect')
                    .filter(d => d.id===la.id).attr('x');

                la.y = this[boxNodes].selectAll('rect')
                    .filter(d => d.id===la.id).attr('y');
            });

            this[boxLinks].selectAll('path')
                .data(allArr, d => d.source.id + "-" + d.target.id).exit()
                .remove();

            this[boxLinks].selectAll('path')
                .data(allArr, d => d.source.id + "-" + d.target.id).enter()
                .append('path')
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
                .attr("stroke-width", "35px")
                .attr("fill", "none")
                .attr("stroke", d => d.source.color)
                .attr('marker-end', d => {
                    if(d3.select('#arrowHead-' + d.source.id).empty()) {
                        markerGenerator(d.source.color, d.source.id);
                    }
                    return `url(#arrowHead-${d.source.id})`
                });
        }

        var pathUpdater = () => {
            let rects = new Map();
            let paths = new Map();
            this[boxNodes].selectAll('rect').each(function(d) {
                rects.set(d.id, d3.select(this).node().getBBox());
            });
            this[boxLinks].selectAll('path').filter(d => d.source.id!==d.target.id)
                .each(function(d) {
                    paths.set(d.source.id + "-" + d.target.id, samples(d3.select(this).node(),1));
                });
            for(let pat of paths) {
                let patsplit = pat[0].split("-");
                let b1 = patsplit[0];
                let b2 = patsplit[1];
                let isec1 = intersect(pat[1], rects.get(+b1));
                let isec2 = intersect(pat[1], rects.get(+b2));
                d3.select('#linker').append('circle').attr('cx', isec2[0])
                    .attr('cy', isec2[1]).attr('fill', "blue").attr('r', 15)
                console.log(isec1);

            }
        };
        pathUpdater();
    }
}

export {Aggregation};