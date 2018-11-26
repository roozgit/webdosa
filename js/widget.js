import d3, {select} from 'd3-selection';
import {histogram, extent as d3extent, max as d3max, range as d3range} from 'd3-array';
import {scaleLinear} from "d3-scale";
import {brushX} from "d3-brush";

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
            let brushExt = d3.event.selection;
            //let extents = brushExt.map(d => this.scaler(d));
            //console.log(this);
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

            //brush creation for each chart
            let  brush = brushX()
                .extent([[0, 0], [this[wwidth], svgh - svgBotMargin]])
                .on("brush end", brushed.bind({group: group, feature: k, scaler: xs}));

            let brushGroup = chart.append('g')
                .attr("class", "scentedBrush")
                .attr('id', "scentedBrush-" + group + "-" + k);
            brushGroup.call(brush);

            this[widgetMap].set(group+"-"+k, {chart: chart, brushGroup: brushGroup, brushFunc: brush, scaler: xs});
        }
    }

    moveWidgetSelection(graph, layerId, featureX, featureY) {
        let layer = graph.layers.find(lay => lay.id===layerId);
        if(layer.members.size===0) return;
        let mfx = [...layer.members].map(mx => graph.nodeMap.get(mx).features[featureX]);
        let mfxe = d3extent(mfx);
        let mfy = [...layer.members].map(mx => graph.nodeMap.get(mx).features[featureY]);
        let mfye = d3extent(mfy);

        let targetWidgetX = this[widgetMap].get('nodes-'+featureX);
        targetWidgetX.brushGroup.call(targetWidgetX.brushFunc.move,
            [targetWidgetX.scaler(mfxe[0]), targetWidgetX.scaler(mfxe[1])]);

        let targetWidgetY = this[widgetMap].get('nodes-'+featureY);
        targetWidgetY.brushGroup.call(targetWidgetY.brushFunc.move,
            [targetWidgetY.scaler(mfye[0]), targetWidgetY.scaler(mfye[1])]);

        targetWidgetX.brushGroup.select('rect.selection').attr('fill', layer.color);
        targetWidgetY.brushGroup.select('rect.selection').attr('fill', layer.color);
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