import {scaleLinear} from 'd3-scale';
import {extent} from 'd3-array';
import {axisBottom, axisLeft} from 'd3-axis';
import {quadtree} from 'd3-quadtree';
import d3 from 'd3-selection';
import {brush as d3brush, brushSelection} from 'd3-brush';
import {dispatch} from './index';
import {arcLinks} from './util';

let svg = Symbol();
let nodeGroup = Symbol();
let points = Symbol();
let nodeIds = Symbol();
let gBrushes = Symbol();
let quadTree = Symbol();
let brushes = Symbol();
let defs = Symbol();

class Detail {
    constructor(el, graph, width, height, margin) {
        let xPos = graph.nodes.map(n => n.position.x);
        let yPos = graph.nodes.map(n => n.position.y);
        this[nodeIds] = new Set();
        this[brushes] =[];

        this[svg] = d3.select(el)
            .append('svg')
            .attr('id', "svgDetail")
            .attr('width', width + margin.right + margin.left)
            .attr('height', height + margin.top + margin.bottom);

        this[defs] = this[svg].append('defs');
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
            .style('color', "lightgray")
            .call(axisLeft(ys));

        this[nodeGroup].append('g')
            .style('color', "lightgray")
            .attr("transform", "translate(0," + height + ")")
            .call(axisBottom(xs));

        this[nodeGroup].append('text')
            .attr('transform', "rotate(-90)")
            .attr('y', 0 - margin.left)
            .attr('x', 0 - (height / 2))
            .attr('dy', "1em")
            .attr('pointer-events', "none")
            .style('text-anchor', "middle")
            .style('fill', "lightgray")
            .text("Y");

        d3.selectAll('.tick')
            .attr('pointer-events', "none");

        this[quadTree] = quadtree()
            .x(d => xs(d.position.x))
            .y(d => ys(d.position.y))
            .addAll(graph.nodes);

        this[points] = this[nodeGroup].append('g').attr('id', "scatterPlot");

        this[points] = this[points]
            .selectAll('circle')
            .data(graph.nodes).enter()
            .append('circle')
            .attr('class', 'dataPoints')
            .attr('stroke', "lightgray")
            .attr('cx', d => xs(d.position.x))
            .attr('cy', d => ys(d.position.y))
            .attr('r', 2);

        this[gBrushes] = this[nodeGroup].append('g')
            .attr("class", "brushes");

        this.createBrush(graph,xs, ys);
        this.drawBrushes();

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
     }

     createBrush(graph, xs, ys) {
         let bbox = d3.select('#scatterPlot').node().getBBox();
         let brush = d3brush()
             .extent([[bbox.x, bbox.y], [bbox.x + bbox.width, bbox.y + bbox.height]])
             .on('start', brushStart)
             .on('brush', brushed.bind(this))
             .on('end', emitData.bind(this));

         this[brushes].push({id: this[brushes].length+1, brush: brush});

         let curBrushes = this[brushes];
         let newBrushFlag = false;
         let layernum = 0;

         function brushStart() {
             layernum = +d3.select(this).attr('id').split("-")[1];
             newBrushFlag = !curBrushes.map(bru => bru.id).includes(layernum + 1);
         }

         function brushed() {
             let extent = d3.event.selection;
             this[nodeIds] = search(this[points], this[quadTree],
                 extent[0][0], extent[0][1], extent[1][0], extent[1][1]);

             let visible = [];
             let drawnEdges= new Set();

             for(let nodeId of this[nodeIds]) {
                 let node = graph.nodeMap.get(nodeId);
                 let tos = graph.adjList.get(nodeId);
                 let froms = graph.revAdjList.get(nodeId);
                 if(tos) {
                     //tos = tos.filter(nod => nod.to.layers[nod.to.layers.length-1]!==0)
                     for (let tonode of tos) {
                         let tonodeLayers = tonode.to.layers;
                         let tonodelayer = tonodeLayers[tonodeLayers.length-1];
                         let destlayer = this[nodeIds].has(tonode.to.data.id) ? layernum : tonodelayer;

                         let topos = tonode.to.position;
                         let nume = tonode.via.length;
                         for (let edge of tonode.via)
                             if (drawnEdges.has(edge.data.id)) nume--;
                             else drawnEdges.add(edge.data.id);

                         let toPaths = arcLinks(xs(node.position.x), ys(node.position.y),
                             xs(topos.x), ys(topos.y), nume, 15);
                         for (let p = 0; p < toPaths.length; p++)
                             visible.push({id: tonode.via[p].data.id, path: toPaths[p],
                                 dlayers: [layernum, destlayer],
                             from: nodeId, to: tonode.to.data.id});
                     }
                 }
                 if(froms) {
                     //froms = froms.filter(nod => nod.from.layers[nod.from.layers.length-1]!==0);
                     for (let fromnode of froms) {
                         let fromnodeLayers = fromnode.from.layers;
                         let fromnodelayer = fromnodeLayers[fromnodeLayers.length-1];
                         let destlayer = this[nodeIds].has(fromnode.from.data.id) ? layernum : fromnodelayer;

                         let frompos = fromnode.from.position;
                         let nume = fromnode.via.length;
                         for (let edge of fromnode.via)
                             if (drawnEdges.has(edge.data.id)) nume--;
                             else drawnEdges.add(edge.data.id);

                         let fromPaths = arcLinks(xs(frompos.x), ys(frompos.y),
                             xs(node.position.x), ys(node.position.y), nume, 15);
                         for (let p = 0; p < fromPaths.length; p++)
                             visible.push({id: fromnode.via[p].data.id, path: fromPaths[p],
                                 dlayers: [destlayer, layernum],
                                 from: fromnode.from.data.id, to: nodeId});
                     }
                 }
             }

             d3.selectAll(`.visibleEdges-layer-${layernum}`).selectAll('path')
                 .filter(d =>
                    !this[nodeIds].has(d.from) && !this[nodeIds].has(d.to)).remove();

             let defc = this[defs];
             if(visible.length > 0)
                 d3.select('#scatterPlot').append('g')
                     .attr('class', "visibleEdges-layer-" + layernum)
                     .selectAll('path')
                     .data(visible).enter()
                     .append('path')
                     .attr('d', d => d.path)
                     .attr('id', d => d.id)
                     .attr('fill', "none")
                     .attr('stroke', function(d) {
                         let lays = d.dlayers;
                         if(lays[0]===lays[1]) {
                             return graph.colorScale(layernum - 1);
                         }
                         if(lays[0]===0 || lays[1]===0) return "none";
                         if(document.getElementById(`grad-${lays[0]}-${lays[1]}`) === null) {
                             let grd = defc.append('linearGradient')
                                 .attr('id', `grad-${lays[0]}-${lays[1]}`)
                                 .attr("gradientUnits", "userSpaceOnUse");
                             grd.append("stop")
                                 .attr('class', 'start')
                                 .attr("offset", "0%")
                                 .attr("stop-color", lays[0]===0 ? "lightgrey" : graph.colorScale(lays[0]-1))
                                 .attr("stop-opacity", 1);
                             grd.append("stop")
                                 .attr('class', 'end')
                                 .attr("offset", "200%")
                                 .attr("stop-color", lays[1]===0 ? "lightgrey" : graph.colorScale(lays[1]-1))
                                 .attr("stop-opacity", 1);
                         }
                         return `url(#grad-${lays[0]}-${lays[1]})`;
                     });
                     //.attr('stroke', graph.colorScale(layernum-1));

             let emptyGs = [...document.getElementsByClassName(`visibleEdges-layer-${layernum}`)]
                 .filter(xc => xc.children.length === 0);
             emptyGs.forEach(g => g.remove());
         }

         function emitData() {
             d3.select(`#brush-${layernum}`).selectAll('rect.handle')
                 .attr('fill', graph.colorScale(layernum-1));
             if(newBrushFlag)
                 this.createBrush(graph, xs, ys);

             // Always draw brushes
             this.drawBrushes();
             if(newBrushFlag)
                 dispatch.call('layerAdded', this, this[nodeIds]);
             else
                 dispatch.call('layerMoved', this, {layer: layernum, nodeIds: this[nodeIds]});
         }

         // Find the nodes within the specified rectangle.
         function search(points, qtree, x0, y0, x3, y3) {
             let results = new Set();
             qtree.visit(function(node, x1, y1, x2, y2) {
                 if (!node.length) {
                     do {
                         let d = node.data;
                         let dp = [node.data.position.x, node.data.position.y];
                         let selected = (xs(dp[0]) >= x0) && (xs(dp[0]) < x3) && (ys(dp[1]) >= y0) && (ys(dp[1]) < y3);
                         if(selected) {
                             results.add(d.data.id);
                         }
                     } while (node = node.next);
                 }
                 return x1 >= x3 || y1 >= y3 || x2 < x0 || y2 < y0;
             });
             return results;
         }
     }

     drawBrushes() {
         let brushSelection = this[gBrushes]
             .selectAll('.brush')
             .data(this[brushes], d => d.id);

         // Set up new brushes
         brushSelection.enter()
             .insert("g", '.brush')
             .attr('class', 'brush')
             .attr('id', function(brush){ return "brush-" + brush.id; })
             .each(function(brushObject) {
                 brushObject.brush(d3.select(this));
             });

         /* REMOVE POINTER EVENTS ON BRUSH OVERLAYS
          *
          * This part is abbit tricky and requires knowledge of how brushes are implemented.
          * They register pointer events on a .overlay rectangle within them.
          * For existing brushes, make sure we disable their pointer events on their overlay.
          * This frees the overlay for the most current (as of yet with an empty selection) brush to listen for click and drag events
          * The moving and resizing is done with other parts of the brush, so that will still work.
          */
         let len = this[brushes].length;
         brushSelection
             .each(function (brushObject) {
                 d3.select(this)
                     .attr('class', 'brush')
                     .selectAll('.overlay')
                     .style('pointer-events', function() {
                         if (brushObject.id === len) {
                             return 'all';
                         } else {
                             return 'none';
                         }
                     });
             });

         brushSelection.exit()
             .remove();
     }
}

export {Detail};