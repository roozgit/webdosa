import d3, {select, selectAll} from 'd3-selection';
import {histogram, extent as d3extent, max as d3max, range as d3range} from 'd3-array';
import {scaleLinear} from "d3-scale";
import {brushX} from "d3-brush";
import {icon, library as flibrary} from "@fortawesome/fontawesome-svg-core";
import {faScrewdriver} from '@fortawesome/free-solid-svg-icons';
import {faTimes} from '@fortawesome/free-solid-svg-icons';

let widgetTab1 = Symbol();
let widgetTab2 = Symbol();
let wwidth = Symbol();
let widgetMap = Symbol();

const svgh = 60;
const svgBotMargin = 25;

class Widget {
    constructor(graph, width, height, margin) {
        select('div#widgets')
            .style('height', height+"px")
            .style('width', width+"px")
            .style('margin-left', margin.left+"px")
            .style('margin-top', margin.top+"px")
            .style('margin-right', margin.right+"px")
            .style('margin-bottom', margin.bottom+"px");

        this[widgetTab1] = select('#tab-1-content');
        this[widgetTab2] = select('#tab-2-content');
        this[wwidth] = width - 30;
        this[widgetMap] = new Map();

        this.createWidget(graph, 'nodes', this[widgetTab1]);
        this.createWidget(graph, 'edges', this[widgetTab2]);
    }

    createWidget(graph, group, tab) {
        let brushed = function() {
            let sev = d3.event.sourceEvent;
            let layer = graph.layers.find(d => d.selected);
            if(sev.constructor.name === "y") {
                if (!layer) {
                    console.error("No layers selected. Widgets cannot continue");
                    return;
                }
            } else {
                layer.activatedFilters
                    .add(this.group + "-" + this.feature);
                //return;
            }
            // let brushExt = d3.event.selection;
            // let extents = [this.scaler.invert(0), this.scaler.invert(svgh - svgBotMargin)];
            // if (brushExt) extents = brushExt.map(d => this.scaler.invert(d));
            // let filterFunc = function(x) {
            //     return x.features[feat] >= extents[0] &&
            //         x.features[feat] <= extents[1];
            // };
            //
            // if(this.group==="nodes")
            //     layer.nodeVisible.set("nodes-"+this.feature, filterFunc);
            // else
            // {
            //     layer.withinVisible.set("edges-"+this.feature, filterFunc);
            //     layer.betweenVisible.set("edges-"+this.feature, filterFunc);
            // }
        };

        for(let k of Object.keys(graph[group][0].features)) {
            let values = graph[group].map(n => n.features[k]);

            if(typeof values[0] !== "number") {
                let vset = [...(new Set(values))];
                let mapping = d3range(1, vset.length+1);
                values = values.map(x => mapping[vset.indexOf(x)]);
            }
            let ext = d3extent(values);
            let xs = scaleLinear().domain(ext).nice()
                .range([0,this[wwidth]]);
            let bins = histogram().domain(xs.domain()).thresholds(xs.ticks(40))(values);

            let y = scaleLinear()
                .domain([0, d3max(bins, d => d.length)]).nice()
                .range([svgh-svgBotMargin, 0]);

            let chart = tab.append('svg')
                .attr('id', "scent-" + group + "-" + k)
                .attr('class', "scentedSvg")
                .attr('height', svgh)
                .attr('width', this[wwidth]+10)
                .attr("fill", "grey");

            chart.selectAll("rect")
                .data(bins)
                .enter().append("rect")
                .attr("x", d => xs(d.x0) + 1)
                .attr("width", d => Math.max(0, xs(d.x1) - xs(d.x0) - 1))
                .attr("y", d => y(d.length))
                .attr("height", d => y(0) - y(d.length));

            let estr = ext[1].toFixed(1);

            chart.append('text')
                .attr('class', "axis-tick")
                .attr('x', 0)
                .attr('y', svgh)
                .text(ext[0].toFixed(1));
            chart.append('text')
                .attr('class', "axis-tick")
                .attr('x', this[wwidth])
                .attr('dx', `-${estr.length/2}em`)
                .attr('y', svgh)
                .text(ext[1].toFixed(1));

            chart.append('text')
                .attr('x', this[wwidth]/2)
                .attr('dx', "-1.5em")
                .attr('y', svgh)
                .attr('dy',"-0.5em")
                .text(k)
                .style('fill', "grey");
            flibrary.add(faScrewdriver);
            flibrary.add(faTimes);
            const screwIcon = icon({ prefix: 'fas', iconName: 'screwdriver'});
            const closeIcon = icon({ prefix: 'fas', iconName: 'times' });

            chart.append(function() {
                return screwIcon['node'][0];
            }).attr('id', "screwIcon-"+ group + "-" + k)
                .attr('viewBox', "0 0 2048 2048")
                .attr('class', "widgetIcon")
                .attr('x', 50)
                .attr('y', svgh-svgBotMargin)
                //.on('click', () => );
            chart.append(function() {
                return closeIcon['node'][0];
            }).attr('id', "closeIcon-"+ group + "-" + k)
                .attr('viewBox', "0 0 2048 2048")
                .attr('class', "widgetIcon")
                .attr('x', 75)
                .attr('y', svgh-svgBotMargin)
                .on('click', function() {
                    let cid = select(this).attr('id').split("-");
                    let gid = cid[1] + "-" + cid[2];
                    graph.layers.find(lay => lay.selected).activatedFilters.delete(gid);
                });

            //brush creation for each chart
            let  brush = brushX()
                .extent([[0, 0], [this[wwidth], svgh - svgBotMargin]])
                .on("end", brushed.bind({group: group, feature: k, scaler: xs}));

            let brushGroup = chart.append('g')
                .attr("class", "scentedBrush")
                .attr('id', "scentedBrush-" + group + "-" + k);
            brushGroup.call(brush);
            this[widgetMap].set(group+"-"+k, {chart: chart, brushGroup: brushGroup,
                brushFunc: brush, scaler: xs, graph: graph});
        }
    }

    paintLayerBrushes(graph, layerId) {
        let layer = graph.layers.find(lay => lay.id===layerId);
        if(layer.members.size===0) return;
        for(let brf of this[widgetMap].values())
            brf.brushGroup.call(brf.brushFunc.move, [0,0]);
        for(let filteredFeature of layer.activatedFilters) {
            let actualFeat = filteredFeature.split("-")[1];
            let mf = [...layer.members].map(mx => graph.nodeMap.get(mx).features[actualFeat]);
            let mfe = d3extent(mf);
            let targetWidget = this[widgetMap].get(filteredFeature);
            targetWidget.brushGroup.select('rect.selection').attr('fill', layer.color);
            targetWidget.brushGroup.call(targetWidget.brushFunc.move,
                [targetWidget.scaler(mfe[0]), targetWidget.scaler(mfe[1])]);
        }
    }


    fillInfo(pid, nodeData) {
        let par = select('div#widgets #tab-3-content');
        par.selectAll('pre').remove();
        par.append('pre')
            .text(JSON.stringify(nodeData))
            .style('color', "lightgrey");
    }
}

export {Widget};