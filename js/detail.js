import * as d3selector from '../node_modules/d3-selection/src/index.js';
import * as d3scale from '../node_modules/d3-scale/src/index.js';
import * as d3array from '../node_modules/d3-array/src/index.js';
import * as d3axis from '../node_modules/d3-axis/src/index.js';
import {Mediator} from "./index";

const svg = Symbol();
const selections = Symbol("Selection box number");

class Detail {
    constructor(el, graph, width, height, margin) {
        let selectionStarted = false;
        this[selections] = [];
        let activeSelection;

        let xPos = graph.nodes.map(n => n.position.x);
        let yPos = graph.nodes.map(n => n.position.y);
        this[svg] = d3selector.select(el)
            .append('svg')
            .attr('id', 'svgDetail')
            .attr('width', width + margin.right + margin.left)
            .attr('height', height + margin.top + margin.bottom);

        this[svg]
            .append('g')
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        let xs = d3scale.scaleLinear()
            .domain(d3array.extent(xPos))
            .range([0, width]);
        let ys = d3scale.scaleLinear()
            .domain(d3array.extent(yPos))
            .range([height, 0]);

        this[svg].append('g')
            .call(d3axis.axisLeft(ys));
        this[svg].append('g')
            .attr("transform", "translate(0," + height + ")")
            .call(d3axis.axisBottom(xs));

        this[svg].append('text')
            .attr('transform', "rotate(-90)")
            .attr('y', 0 - margin.left)
            .attr('x', 0 - (height / 2))
            .attr('dy', "1em")
            .style('text-anchor', "middle")
            .text("Y");


        let points = this[svg].append('g')
            .selectAll('circle')
            .data(graph.nodes).enter()
            .append('circle')
            .attr('class', 'dataPoints')
            .attr('cx', d => xs(d.position.x))
            .attr('cy', d => ys(d.position.y))
            .attr('r', 2);

        this[svg].on('mousedown', () => {
            selectionStarted = true;
            let mousePos = d3selector.mouse(this[svg].node());
            activeSelection = this[svg].append('rect')
                .attr('id', "selection-" + this[selections].length)
                .attr('x', mousePos[0])
                .attr('y', mousePos[1])
                .attr('width', "0px")
                .attr('height', "0px")
                .attr("stroke-width", "1px")
                .attr("stroke", "black")
                .attr("fill", "none");
            this[selections].push({selection: activeSelection, nodes:[]});
        });

        this[svg].on('mousemove', () => {
            if(!selectionStarted) return;
            let mousePos = d3selector.mouse(this[svg].node());
            activeSelection
                .attr('width', Math.abs(activeSelection.attr('x') - mousePos[0]))
                .attr('height', Math.abs(activeSelection.attr('y') - mousePos[1]));

            activeSelection.data(graph.nodes.filter(n =>
                n.position.x >= activeSelection.attr('x') &&
                n.position.x <= mousePos[0] &&
                n.position.y >= activeSelection.attr('y') &&
                n.position.y <= mousePos[1]));
            console.log(activeSelection.data());

        });

        this[svg].on('mouseup', () => {
            if(activeSelection.attr('width') === "0px" || activeSelection.attr('height') === "0px") {
                console.log("0 size rect");
                let removeSel = this[selections].pop();
                activeSelection.remove();
            }
            selectionStarted = false;
            //draw edges inside the box
            //box is drawn, emit this event to other modules
            Mediator.detailFrameReady();
        });

    }
}

export {Detail};