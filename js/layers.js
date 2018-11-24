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
        let trow = this[tbl].append('tr')
            .attr('id', "layer-"+layer.id);
        // let tdarr = [layer.id, layer.label, layer.members.size];
        let tdarr = [layer.id, layer.members.size];


        trow.selectAll('td')
            .data(tdarr).enter()
            .append('td')
            .text(d => d);

        trow.append('td')
            .attr('class','fa fa-eye')
            .on("click",function(){
                console.log("view")
            });


        trow.append('td')
            .text(layer.label)
            .attr("contentEditable",true)
            .on("keyup", function() {
                if(d3.event.keyCode === 13){
                    layer.label = d3.select(this).text();
                    console.log(layer.label);
                }
                    });


        // trow.append('td')
        //     .text(layer.label)
        //     .on("click",function(d){
        //         d.append("xhtml:form")
        //             .append('input')
        //     })

        //     .append("xhtml:form")
        //     .append('input')
        //     .attr("value",layer.label)
        // .on("keypress",function(){
        //     console.log(this,d);
        // })
        //     // .attr('type','text')
        //     // .attr('name','textInput')
        //     // .text(layer.label);


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
            })

        //I don't know why background doesn't get deleted
        trow.append('td')
            .attr('class','fa fa-trash')
            .on("click",function(){
                console.log("deleted-"+layer.label);
                d3.select("tr#layer-"+layer.id).remove();
            });

        //https://github.com/d3/d3-selection#selection_insert
        //http://objjob.phrogz.net/d3/method/1112
        trow.append('td')
            .attr('class','fa fa-arrow-up')
            .on("click",function(d){
                console.log("up")
                console.log(layer.id-2,layer.id)
                d3.select(this[tbl])
                    .insert('tr','#layer-'+layer.id-2)
                    .attr('id',"layer-99");

            });

        trow.append('td')
            .attr('class','fa fa-arrow-down')
            .on("click",function(){
                console.log("down")
            });

        trow.append('td')
            .style('background-color', layer.color);



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