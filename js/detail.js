import {scaleLinear} from 'd3-scale';
import {extent} from 'd3-array';
import {axisBottom, axisLeft} from 'd3-axis';
import {quadtree} from 'd3-quadtree';
import d3 from 'd3-selection';
import {brush as d3brush} from 'd3-brush';
import {dispatch} from './index';
import {arcLinks} from './util';

let svg = Symbol();
let nodeGroup = Symbol();
let edgeGroup = Symbol();
let points = Symbol();
let nodeIds = Symbol();
let gBrushes = Symbol();
let quadTree = Symbol();
let brushes = Symbol();
let defs = Symbol();

class Detail {
    constructor(el, graph, width, height, margin) {
        this[nodeIds] = new Set();
        this[brushes] = [];

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

        redraw.call(this, false);

        let detailControlsX = d3.select('#detailControls')
            .append('select')
            .style("position", "relative")
            .attr("id", "xvar");

        detailControlsX.selectAll("option")
            .data(Object.keys(graph.nodes[0].features)).enter()
            .append("option")
            .attr("value", d => d)
            .text(d => d);

        let detailControlsY = d3.select('#detailControls')
            .append('select')
            .style("position", "relative")
            .attr("id", "yvar");
        detailControlsY.selectAll("option")
            .data(Object.keys(graph.nodes[0].features)).enter()
            .append("option")
            .attr("value", d => d)
            .text(d => d);

        detailControlsX.selectAll('option').filter(d => d==="lng").attr('selected', "selected");
        detailControlsY.selectAll('option').filter(d => d==="lat").attr('selected', "selected");

        detailControlsX.on('change', () => {
            let feat = detailControlsX.node().value;
            graph.nodes.forEach(n => n.position.x = n.features[feat]);
            redraw.call(this, true);
        });

        detailControlsY.on('change', () => {
            let feat = detailControlsY.node().value;
            graph.nodes.forEach(n => n.position.y = feat==="lat" ? n.features[feat] : -n.features[feat]);
            redraw.call(this, true);
        });

        function redraw(updateMode) {
            let xPos = graph.nodes.map(n => n.position.x);
            let yPos = graph.nodes.map(n => n.position.y);
            let xs = scaleLinear()
                .domain(extent(xPos))
                .range([0, width]);
            let ys = scaleLinear()
                .domain(extent(yPos))
                .range([0, height]);

            if(updateMode) this[nodeGroup].select('g#axisLeft').remove();
            this[nodeGroup].append('g')
                .attr('id', "axisLeft")
                .style('color', "lightgrey")
                .call(axisLeft(ys));

            if (updateMode) this[nodeGroup].select('g#axisBottom').remove();
            this[nodeGroup].append('g')
                .attr('id', "axisBottom")
                .style('color', "lightgray")
                .attr("transform", "translate(0," + height + ")")
                .call(axisBottom(xs));

            if (updateMode) this[nodeGroup].select('text#leftAxisText').remove();
            this[nodeGroup].append('text')
                .attr('id', "leftAxisText")
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

            if(!updateMode) {
                this[quadTree] = quadtree()
                    .x(d => xs(d.position.x))
                    .y(d => ys(d.position.y))
                    .addAll(graph.nodes);

                // this[nodeGroup].selectAll('.node')
                //     .data(nodes(this[quadTree]))
                //     .enter().append('rect')
                //     .attr('class', "node")
                //     .attr('x', function(d) { return d.x0; })
                //     .attr('y', function(d) { return d.y0; })
                //     .attr('width', function(d) { return d.x1 - d.x0; })
                //     .attr('height', function(d) { return d.y1 - d.y0; })
                //     .style('opacity', .1);
            } else {
                this[quadTree] = quadtree()
                    .x(d => xs(d.position.x))
                    .y(d => ys(d.position.y))
                    .addAll(graph.nodes);

                // this[nodeGroup].selectAll('.node').remove();
                // this[nodeGroup].selectAll('.node')
                //     .data(nodes(this[quadTree]))
                //     .enter().append('rect')
                //     .attr('class', "node")
                //     .attr('x', function(d) { return d.x0; })
                //     .attr('y', function(d) { return d.y0; })
                //     .attr('width', function(d) { return d.x1 - d.x0; })
                //     .attr('height', function(d) { return d.y1 - d.y0; })
                //     .style('opacity', .1);
            }
            // function nodes(qt) {
            //     var nodes = [];
            //     qt.visit(function(node, x0, y0, x1, y1) {
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

            if (!updateMode) {
                this[points] =
                    this[nodeGroup].append('g').attr('id', "scatterPlot");
            }
            if(updateMode) this[edgeGroup].remove();
            this[edgeGroup] = this[nodeGroup].append('g').attr('id',"edgeContainer");

            if (updateMode) {
                this[points] = this[points]
                    .data(graph.nodes);
                this[points]
                    .attr('cx', d => xs(d.position.x))
                    .attr('cy', d => ys(d.position.y));
            } else {
                this[points] = this[points]
                    .selectAll('circle')
                    .data(graph.nodes).enter()
                    .append('circle')
                    .attr('id', d => d.data.id)
                    .attr('class', 'dataPoints')
                    .attr('stroke', "lightgray")
                    .attr('cx', d => xs(d.position.x))
                    .attr('cy', d => ys(d.position.y))
                    .attr('r', 2);
            }
            if(!updateMode) {
                this.createBrush(graph, xs, ys);
                this[gBrushes] = this[nodeGroup].append('g')
                    .attr("class", "brushes");
                this.drawBrushes(document.getElementById('xvar'), document.getElementById('yvar'));
            } else {
                let xv = document.getElementById('xvar');
                let yv = document.getElementById('yvar');
                this[gBrushes].selectAll(`g:not(.brush-${xv ? xv.value : "lng"}-${yv ? yv.value : "lat"})`)
                    .filter((_, i) => i > 0)
                    .style('visibility', "hidden");
                this[gBrushes].selectAll('g').filter((_, i) => i === 0).remove();
                this[brushes].pop();
                this.createBrush(graph, xs, ys);
                this.drawBrushes(document.getElementById('xvar'), document.getElementById('yvar'));
                this[gBrushes].selectAll(`g.brush-${xv ? xv.value : "lng"}-${yv ? yv.value : "lat"}`)
                    .style('visibility', "");
            }
        }
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
             //d3.selectAll('#scatterPlot circle')
             this[points]
                 .filter(d => !this[nodeIds].has(d.data.id) && (d.layers[d.layers.length-1]===0 ||
                     d.layers[d.layers.length-1]===layernum))
                 .attr('stroke', "lightgrey");
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
                 this[edgeGroup].append('g')
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

             let emptyGs = [...document.getElementsByClassName(`visibleEdges-layer-${layernum}`)]
                 .filter(xc => xc.children.length === 0);
             emptyGs.forEach(g => g.remove());
         }

         function emitData() {
             d3.selectAll('#scatterPlot circle')
                 .filter(d => this[nodeIds].has(d.data.id))
                 .attr('stroke', graph.colorScale(layernum-1));

             d3.select(`#brush-${layernum}`).selectAll('rect.handle')
                 .attr('fill', graph.colorScale(layernum-1));

             if(newBrushFlag)
                 this.createBrush(graph, xs, ys);

             // Always draw brushes
             this.drawBrushes(document.getElementById('xvar'), document.getElementById('yvar'));
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
                         let dp = [d.position.x, d.position.y];
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

     drawBrushes(xvar, yvar) {
         let brushSelection = this[gBrushes]
             .selectAll('[class^=brush]')
             .data(this[brushes], d => d.id);

         // brushSelection.exit()
         //     .remove();
         // Set up new brushes
         brushSelection.enter()
             .insert('g', ":first-child")//, '.brush-'+ (xvar ? xvar.value : "lng")  + '-' + (yvar ? yvar.value : "lat"))
             .attr('class', 'brush-'+ (xvar ? xvar.value : "lng")  + '-' + (yvar ? yvar.value : "lat"))
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
         this[gBrushes]
             .selectAll('[class^=brush]')
             .filter((_,i) => i > 0)
             .selectAll('.overlay')
             .style('pointer-events', "none");


             // .each(function (brushObject) {
             //     d3.select(this)
             //         //.attr('class', 'brush-'+ (xvar ? xvar.value : "lng")  + '-' + (yvar ? yvar.value : "lat"))
             //         .selectAll('.overlay')
             //         .style('pointer-events', function() {
             //             console.log(brushObject);
             //             if (brushObject.id === len) {
             //                 return 'all';
             //             } else {
             //                 return 'none';
             //             }
             //         });
             // });

     }
}

export {Detail};