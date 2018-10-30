import d3 from 'd3-selection';

let svg = Symbol();

class LayerMgr {
    constructor(el, width, height, margin) {
        this[svg] = d3.select(el)
            .append('svg')
            .attr('id', 'svgLayerMgr')
            .attr('width', width + margin.right + margin.left)
            .attr('height', height + margin.top + margin.bottom)
            .style('border', "1px solid black")
            .append('g')
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");
    }

    addSelection(nodes) {
        console.log(nodes);
    }
}

export {LayerMgr};