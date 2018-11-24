import d3 from 'd3-selection';
import {dispatch} from './index';
let tbl = Symbol();

class LayerMgr {
    constructor(el, width, height, margin) {
        this[tbl] = d3.select(el)
            .append('table')
            .attr('id', 'tblLayerMgr')
            .attr('width', width + margin.right + margin.left)
            .attr('height', height + margin.top + margin.bottom);
            //.style('border', "1px solid grey");
    }

    addLayer(graph, layerId) {
        let layer = graph.layers.find(la => la.id ===layerId);
        let trow = this[tbl].append('tr')
            .attr('id', "layer-"+layerId);

        //layer id -1
        trow.append('td').text(layer.id)
            .on('click', function() {
                layer.selected = !layer.selected;
                d3.select('#tblLayerMgr')
                    .selectAll('tr')
                    .selectAll('td:nth-child(1)')
                    .style('background-color', "black");
                d3.select(this).style('background-color', "red");
            });

        //layer label -2
        trow.append('td').text(layer.label)
            .attr("contentEditable",true)
            .on("keyup", function() {
                if(d3.event.code === "Enter") {
                    //console.log(d3.select(this).text());
                    layer.label = d3.select(this).text();
                    //dispatch.call('layerLabelUpdate');
                }
            });

        //layer members -3
        trow.append('td')
            .text(layer.members.size)
            .style('color', () => {
                return layer.id > 0 ? 'white' : 'gray';
            })
            .style('background-color', layer.color);

        if(layerId > 0) {
            //layer delete -4
            trow.append('td')
                .attr('class', 'fa fa-trash')
                .on("click", function () {
                    if (layerId > 0) {
                        dispatch.call('layerDeleted', this, layerId);
                        d3.select(this).node().parentNode.remove();
                        updateLayerView(graph.layers);
                    } else {
                        alert("Can't delete layer this layer!");
                    }
                });

            //layer raise -5
            trow.append('td')
                .attr('class', 'fa fa-arrow-up')
                .on("click", function () {
                    console.log("clicked me? up")
                });

            //layer lower -6
            trow.append('td')
                .attr('class', 'fa fa-arrow-down')
                .on("click", function () {
                    console.log("clicked me? down")
                });
        }
    }
}

function updateLayerView(layers) {
    d3.select('#tblLayerMgr').selectAll('tr')
        .each(function(_, i) {
            d3.select(this).select('td:nth-child(3)')
                .text(layers[i].members.size);
        });
}

export {LayerMgr, updateLayerView};