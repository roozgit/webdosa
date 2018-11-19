import d3 from 'd3-selection';
import {forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY} from "d3-force";
import {arcLinks} from "./util";
import {symbol, symbolTriangle} from "d3-shape";
import {drag} from "d3-drag";

let svg = Symbol();
let boxLinks = Symbol();
let boxNodes = Symbol();
let swidth = Symbol();
let sheight = Symbol();
let boxDragger = Symbol();
const boxWidth = 150;

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

        this[swidth] = width;
        this[sheight] = height;
        this[boxNodes] = this[svg].append('g')
            .attr('id', "boxer");

        this[boxLinks] = this[svg].append('g')
            .attr('id', "linker");

        // this[boxDragger] = drag()
        //     .on('drag', function() {
        //     d3.select(this)
        //         .attr('x', +d3.event.x)
        //         .attr('y', +d3.event.y);
        // })
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
                value: btg.length
            };
        });

        let withinAgg = [...within.keys()].map(kw => {
            let dest = within.get(kw)[0];
            if(dest)
                return {
                    source: laycopy.find(la => la.id === dest.dlayers[0]),
                    target: laycopy.find(la => la.id === dest.dlayers[0]),
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
                    .filter(d => d.source.id === item.data()[0].id)
                    .attr('d', d => {
                    if (d.source.id === d.target.id) {
                        let dx = boxWidth/2,
                            dy = boxWidth/2,
                            dr = Math.sqrt(dx * dx + dy * dy);
                        return "M" + (+d.source.x+boxWidth) + "," + (+d.source.y+dy)
                            + "A" + dx + ","
                            + dx + " 0 1,0 " + (+d.target.x+dx) + "," + d.target.y;

                    }
                    else
                        return "M" + (+d.source.x) + "," + (+d.source.y)
                            + "A" + boxWidth/2 + ","
                            + boxWidth/2 + " 0 1,0 " + (+d.target.x) + "," + d.target.y;
                });

                d3.select('#linker').selectAll('.arrowHeads')
                    .attr('d', symbol().type(symbolTriangle))
                    .attr('transform', d =>
                        `translate(${(+d.target.x+boxWidth/2)},${+d.target.y})
                    rotate(180)
                    scale(5 5)`)
                    .style('fill', d => d.source.color)
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
            .attr('stroke-width', "10px")
            .attr('fill', "black").call(boxDragger);

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
            this[boxLinks].selectAll('.arrowHeads')
                .data(allArr, d => d.source.id + "-" + d.target.id).exit()
                .remove();

            this[boxLinks].selectAll('path')
                .data(allArr, d => d.source.id + "-" + d.target.id).enter()
                .append('path')
                .attr('class', "arrows")
                .attr('d', d => {
                    if (d.source.id === d.target.id) {
                        let dx = boxWidth/2,
                            dy = boxWidth/2,
                            dr = Math.sqrt(dx * dx + dy * dy);
                        return "M" + (+d.source.x+boxWidth) + "," + (+d.source.y+dy)
                            + "A" + dx + ","
                            + dx + " 0 1,0 " + (+d.target.x+dx) + "," + d.target.y;

                    }
                    else {

                        return "M" + (+d.source.x) + "," + (+d.source.y)
                            + "A" + boxWidth/2 + ","
                            + boxWidth/2 + " 0 1,0 " + (+d.target.x) + "," + d.target.y;
                    }
                })
                .attr("stroke-width", "35px")
                .attr("fill", "none")
                .attr("stroke", d => d.source.color);

            this[boxLinks].selectAll('.arrowHeads')
                .data(allArr, d => d.source.id + "-" + d.target.id).enter()
                .append('path')
                .attr('class', "arrowHeads")
                .attr('d', symbol().type(symbolTriangle))
                .attr('transform', d =>
                    `translate(${(+d.target.x+boxWidth/2)},${+d.target.y})
                    rotate(180)
                    scale(5 5)`)
                .style('fill', d => d.source.color);
        }
    }
}

export {Aggregation};