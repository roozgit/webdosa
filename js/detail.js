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

        // this[points].selectAll('.node')
        //     .data(nodes(tree))
        //     .enter().append('rect')
        //     .attr('class', "node")
        //     .attr('x', function(d) { return d.x0; })
        //     .attr('y', function(d) { return d.y0; })
        //     .attr('width', function(d) { return d.x1 - d.x0; })
        //     .attr('height', function(d) { return d.y1 - d.y0; });

        this[points] = this[points]
            .selectAll('circle')
            .data(graph.nodes).enter()
            .append('circle')
            .attr('class', 'dataPoints')
            .attr('cx', d => xs(d.position.x))
            .attr('cy', d => ys(d.position.y))
            .attr('r', 2);

        // this[nodeGroup].append('g')
        //     .selectAll('text')
        //     .data(graph.nodes).enter()
        //     .append('text')
        //     .attr('x', d => xs(d.position.x))
        //     .attr('y', d => ys(d.position.y))
        //     .text(d => d.classes.includes("bus") ? d.data.id : "");
        //let ppoints = this[points];

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

        // function nodes(qtree) {
        //     let nodes = [];
        //     qtree.visit(function(node, x0, y0, x1, y1) {
        //         node.x0 = x0, node.y0 = y0;
        //         node.x1 = x1, node.y1 = y1;
        //         if(y1 > height) node.y1 = height;
        //         if(y0 > height) node.y0 = height;
        //         if(x1 > width) node.x1 = width;
        //         if(x0 > width) node.x0 = width;
        //         nodes.push(node);
        //     });
        //     return nodes;
        // }

        // Find the nodes within the specified rectangle.
        function search(points, qtree, x0, y0, x3, y3) {
            let results = [];
            qtree.visit(function(node, x1, y1, x2, y2) {
                if (!node.length) {
                    do {
                        let d = node.data;
                        let dp = [node.data.position.x, node.data.position.y];
                        d.selected = (xs(dp[0]) >= x0) && (xs(dp[0]) < x3) && (ys(dp[1]) >= y0) && (ys(dp[1]) < y3);
                        if(d.selected) {results.push(d.data.id);}
                    } while (node = node.next);
                }
                return x1 >= x3 || y1 >= y3 || x2 < x0 || y2 < y0;
            });
            return results;
        }

        function brushStart() {
            //this.selection
            console.log("started");
        }

        function brushed() {
            let extent = d3.event.selection;
            this[points].each(d => d.selected = false);
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
            dispatch.call('selectionChanged', this, this.selections);
        }

        function emitData() {
            console.log(this.selections)
            this.selectionIndex = (this.selectionIndex + 1) % 4;
        }
     }
}

export {Detail};