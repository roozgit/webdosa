import d3 from 'd3-selection';

let svg = Symbol();

class Widget {
    constructor(el, graph, width, height, margin) {
        console.log(graph);
        this[svg] = d3.select(el)
            .append('svg')
            .attr('id', 'svgWidget')
            .attr('width', width + margin.right + margin.left)
            .attr('height', height + margin.top + margin.bottom)
            .style('border', "1px solid black")
            .append('g')
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        //extract multivariate components
        let nodeMultivars = Object.keys(graph.nodes[0].data);
        let edgeMultivars = Object.keys(graph.edges[0].data);

        console.log(nodeMultivars);

        for(let i in nodeMultivars) {
            let item = nodeMultivars[i];
            if (typeof graph.nodes[0].data[item] === "number") {
                this.plotNumericalVar(graph.nodes.map(n => n.data.id),
                    graph.nodes.map(n => n.data[item]), i);
            }
        }

    }

    plotNumericalVar(ids, data, order) {
        console.log(ids, data);
    }
}


export {Widget};