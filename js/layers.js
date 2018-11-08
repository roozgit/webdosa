import d3 from 'd3-selection';

let svg = Symbol();

class LayerMgr {
    constructor(el, graph, width, height, margin) {
        this[svg] = d3.select(el)
            .append('svg')
            .attr('id', 'svgLayerMgr')
            .attr('width', width + margin.right + margin.left)
            .attr('height', height + margin.top + margin.bottom)
            .style('border', "1px solid black")
            .append('g')
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");
        //add background layer
        console.log(graph);
    }

    addSelection(nodes) {
        console.log(nodes);
        //this[table].add a row to the table
    }
}

export {LayerMgr};