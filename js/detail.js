import {scaleLinear} from 'd3-scale';
import {extent} from 'd3-array';
import {axisBottom, axisLeft} from 'd3-axis';
import {quadtree} from 'd3-quadtree';
import d3 from 'd3-selection';
import {brush as d3brush} from 'd3-brush';
import {dispatch} from './index';
import {Util} from './util';

let svg = Symbol();
let nodeGroup = Symbol();
let points = Symbol();

class Detail {
    constructor(el, graph, width, height, margin) {
        let xPos = graph.nodes.map(n => n.position.x);
        let yPos = graph.nodes.map(n => n.position.y);
        this.selectionIndex = 0;
        this.selections = [];
        this.colors = new Map([[0, "blue"], [1, "red"], [2, "orange"], [3,"green"]]);
        this[svg] = d3.select(el)
            .append('svg')
            .attr('id', "svgDetail")
            .attr('width', width + margin.right + margin.left)
            .attr('height', height + margin.top + margin.bottom);

        this[nodeGroup] = this[svg].append('g')
            .attr('id', "nodeGroup")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        let xs = scaleLinear()
            .domain(extent(xPos))
            .range([0, width]);
        let ys = scaleLinear()
            .domain(extent(yPos))
            .range([0, height]);

        this[nodeGroup].append('g')
            .call(axisLeft(ys));
        this[nodeGroup].append('g')
            .attr("transform", "translate(0," + height + ")")
            .call(axisBottom(xs));

        this[nodeGroup].append('text')
            .attr('transform', "rotate(-90)")
            .attr('y', 0 - margin.left)
            .attr('x', 0 - (height / 2))
            .attr('dy', "1em")
            .attr('pointer-events', "none")
            .style('text-anchor', "middle")
            .text("Y");
        d3.selectAll('.tick')
            .attr('pointer-events', "none");

        let tree = quadtree()
            .x(d => xs(d.position.x))
            .y(d => ys(d.position.y))
            .addAll(graph.nodes);


        this[points] = this[nodeGroup].append('g').attr('id', "scatterPlot");

        this[points] = this[points]
            .selectAll('circle')
            .data(graph.nodes).enter()
            .append('circle')
            .attr('class', 'dataPoints')
            .attr('cx', d => xs(d.position.x))
            .attr('cy', d => ys(d.position.y))
            .attr('r', 2);

        let bbox = d3.select('#scatterPlot').node().getBBox();
        let brush = d3brush()
            .extent([[bbox.x, bbox.y], [bbox.x + bbox.width, bbox.y + bbox.height]])
            .on('start', brushStart.bind(this))
            .on('brush', brushed.bind(this))
            .on('end', emitData.bind(this));

        this[nodeGroup].append('g')
            .attr('class', "brush")
            .call(brush);
            //.call(brush.move, [[300,300], [420,420]]);


        let detailControlsX = d3.select('#detailControls')
            .append('select')
            .style("position", "relative")
            .attr("id", "xvar")
            .selectAll("option")
            .data(Object.keys(graph.nodes[0].data))
            .enter()
            .append("option")
            .attr("value", d => d)
            .text(d => d);


        let detailControlsY = d3.select('#detailControls')
            .append('select')
            .style("position", "relative")
            .attr("id", "yvar")
            .selectAll("option")
            .data(Object.keys(graph.nodes[0].data))
            .enter()
            .append("option")
            .attr("value", d => d)
            .text(d => d);

        detailControlsX.filter(d => d==="lng").attr('selected', "selected");
        detailControlsY.filter(d => d==="lat").attr('selected', "selected");
        let submitButton = d3.select('#detailControls')
            .append('button')
            .attr('id', "varChange")
            .text('Redraw!')
            .on('click', redrawPlot.bind(this));

        // Find the nodes within the specified rectangle.
        function search(points, qtree, x0, y0, x3, y3) {
            let results = [];
            qtree.visit(function(node, x1, y1, x2, y2) {
                if (!node.length) {
                    do {
                        let d = node.data;
                        let dp = [node.data.position.x, node.data.position.y];
                        let selected = (xs(dp[0]) >= x0) && (xs(dp[0]) < x3) && (ys(dp[1]) >= y0) && (ys(dp[1]) < y3);
                        if(selected) {results.push(d.data.id);}
                    } while (node = node.next);
                }
                return x1 >= x3 || y1 >= y3 || x2 < x0 || y2 < y0;
            });
            return results;
        }

        function redrawPlot() {
            let xvar = detailControlsX.attr('value');
            let yvar = detailControlsY.attr('value');
        }

        function brushStart() {
            //this.selection
            console.log("started");
        }

        function brushed() {
            let extent = d3.event.selection;
            let nodeIds =
                new Set([...search(this[points], tree, extent[0][0], extent[0][1], extent[1][0], extent[1][1])]);

            let visibleFroms = [], visibleTos = [];
            let drawn = new Set();
            let inside = new Set();
            let outside = new Set();
            //get outgoing and encode the arcs going from right to left
            for(let fnode of graph.adjList.entries()) {
                if (nodeIds.has(fnode[0])) {
                    let fromNode = graph.nodeMap.get(fnode[0]);
                    let toNodes = fnode[1];
                    for(let toNode of toNodes) {
                        let nume = toNode.via.length;
                        if(fromNode.position.x !== toNode.to.position.x &&
                            fromNode.position.y !== toNode.to.position.y) {
                            visibleFroms.push(Util.arcLinks(xs(fromNode.position.x), ys(fromNode.position.y),
                                xs(toNode.to.position.x), ys(toNode.to.position.y), nume, 15));
                            drawn.add(`${fromNode.data.id}-${toNode.to.data.id}`);
                        }

                    }
                }
            }

            //get incoming and encode arcs going from left to right
            for(let tnode of graph.revAdjList.entries()) {
                if (nodeIds.has(tnode[0])) {
                    let toNode = graph.nodeMap.get(tnode[0]);
                    let fromNodes = tnode[1];
                    for(let fromNode of fromNodes) {
                        let nume = fromNode.via.length;
                        if(toNode.position.x !== fromNode.from.position.x &&
                            toNode.position.y !== fromNode.from.position.y) {
                            if(!drawn.has(`${fromNode.from.data.id}-${toNode.data.id}`))
                                visibleTos.push(Util.arcLinks(xs(fromNode.from.position.x), ys(fromNode.from.position.y),
                                    xs(toNode.position.x), ys(toNode.position.y), nume, 15));
                        }
                    }
                }
            }
            visibleFroms = [].concat(...visibleFroms);
            let allVisible = visibleFroms.concat(...visibleTos);

            //console.log(this.selections);
            //d3.select('#visibleEdges').remove();
            let visibleEdges =  d3.select('#scatterPlot').append('g')
                .attr('id', "visibleEdges")
                .selectAll('path')
                .data(allVisible).enter()
                .append('path')
                .attr('d', d => d)
                .attr('fill', "none")
                .attr('stroke', this.colors.get(this.selectionIndex));
            this.selections[this.selectionIndex] = nodeIds;

        }

        function emitData() {
            this.selectionIndex = (this.selectionIndex + 1) % 4;
            dispatch.call('selectionChanged', this, this.selections);
        }
     }
}

export {Detail};