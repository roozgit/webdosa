import d3, {select} from 'd3-selection';
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
            let brushExt = d3.event.selection;
            if(sev.constructor.name === "y") {
                if (!layer) {
                    console.error("No layers selected. Widgets cannot continue");
                }
            } else {
                let hasFilter = layer.activatedFilters.has(this.group + "-" + this.feature);
                let wfun = this.mapper.get(this.group + "-" + this.feature);
                if(hasFilter && wfun) {
                    let extents = [wfun.scaler.invert(0), wfun.scaler.invert(svgh - svgBotMargin)];
                    if (brushExt) extents = brushExt.map(d => wfun.scaler.invert(d));
                    let feat= this.feature;
                    let filterFunc = function(x) {
                        return x.features[feat] >= extents[0] &&
                            x.features[feat] <= extents[1];
                    };
                    if(this.group==="nodes")
                        layer.nodeVisible.set("nodes-"+this.feature, filterFunc);
                    else {
                        layer.withinVisible.set("edges-"+this.feature, filterFunc);
                        layer.betweenVisible.set("edges-"+this.feature, filterFunc);
                    }
                    wfun.fixed = true;
                    wfun.fixedExtents = brushExt;
                } else {
                    layer.activatedFilters.add(this.group + "-" + this.feature);
                }
            }
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
                .attr('y', svgh-svgBotMargin);
                // .on('click', function(a,b,el) {
                //     let cid = el[0].id;
                //     let gid = cid[1] + "-" + cid[2];
                //     let val = this[widgetMap].get(gid);
                //     if(val) {
                //         val.fixed = true;
                //         this[widgetMap].set(gid, val);
                //     }
                // }.bind(this));
            chart.append(function() {
                return closeIcon['node'][0];
            }).attr('id', "closeIcon-"+ group + "-" + k)
                .attr('viewBox', "0 0 2048 2048")
                .attr('class', "widgetIcon")
                .attr('x', 75)
                .attr('y', svgh-svgBotMargin)
                .on('click', (a, b, el) => {
                    let cid = el[0].id.split("-");
                    let gid = cid[1] + "-" + cid[2];
                    let layerx = graph.layers.find(lay => lay.selected);
                    layerx.activatedFilters.delete(gid);
                    layerx.nodeVisible.delete(gid);
                    let wfun = this[widgetMap].get(gid);
                    wfun.fixed = false;
                    select('#screwIcon-'+gid).selectAll('path')
                        .attr('fill',"white");
                    select('#scentedBrush-'+gid).select('.selection')
                        .attr('width', 0);
                });

            //brush creation for each chart
            let  brush = brushX()
                .extent([[0, 0], [this[wwidth], svgh - svgBotMargin]])
                .on("end", brushed.bind({group: group, feature: k, mapper: this[widgetMap]}));

            let brushGroup = chart.append('g')
                .attr("class", "scentedBrush")
                .attr('id', "scentedBrush-" + group + "-" + k);
            brushGroup.call(brush);
            this[widgetMap].set(group+"-"+k, {brushGroup: brushGroup,
                brushFunc: brush, scaler: xs, fixed: false, fixedExtents: []});
        }
    }

    paintLayerBrushes(graph, layerId) {
        let layer = graph.layers.find(lay => lay.id===layerId);
        if(layer.members.size===0) return;
        for(let filteredFeature of layer.activatedFilters) {
            let actualFeat = filteredFeature.split("-")[1];
            let mf = [...layer.members].map(mx => graph.nodeMap.get(mx).features[actualFeat]);
            let mfe = d3extent(mf);
            let targetWidget = this[widgetMap].get(filteredFeature);
            targetWidget.brushGroup.select('rect.selection').attr('fill', layer.color);
            if(targetWidget.fixed) {
                targetWidget.brushGroup.call(targetWidget.brushFunc.move,
                    targetWidget.fixedExtents);
                select('#screwIcon-'+filteredFeature).selectAll('path')
                    .attr('fill',layer.color);
            } else {
                targetWidget.brushGroup.call(targetWidget.brushFunc.move,
                    [targetWidget.scaler(mfe[0]), targetWidget.scaler(mfe[1])]);
            }
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