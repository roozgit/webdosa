import d3 from 'd3-selection';

let tbl = Symbol();

class LayerMgr {
    constructor(el, graph, width, height, margin) {
        this[tbl] = d3.select(el)
            .append('table')
            .attr('id', 'tblLayerMgr')
            .attr('width', width + margin.right + margin.left)
            .attr('height', height + margin.top + margin.bottom);
            //.style('border', "1px solid grey");
    }

    addLayer(layers) {
        let layer = layers[layers.length-1];
        console.log(layer.label)
        let trow = this[tbl].append('tr')
            .attr('id', "layer-"+layer.id);
        let tdarr = [layer.id, layer.label, layer.members.size];

        trow.selectAll('td')
            .data(tdarr).enter()
            .append('td')
            .text(d => d);

        trow.append('input')
            .attr("type","checkbox")
            .style("float","left")
            .property("checked",true)
            .on("change", function(){
                if(this.checked){
                    console.log("layer "+layer.id+" has been added")
                }else {
                    console.log("layer "+layer.id+" has been removed")
                }
            });

        trow.append('td')
            .attr('font-family','FontAwesome')
            .text(function(d){
                return '\uf118'
            });


        trow.append('td')
            .style('background-color', layer.color);

        // trow.on("click", function(d){
        //     console.log("jad")
        // });




    }

    updateLayer(layers) {
        //let targetLayer = layers[layernum];
        this[tbl].selectAll('tr')
            .each(function(_, i) {
                d3.select(this).select('td:nth-child(3)')
                    .text(layers[i].members.size);
            })


    }
}

export {LayerMgr};