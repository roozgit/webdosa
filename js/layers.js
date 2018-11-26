import d3 from 'd3-selection';
import {dispatch} from './index';
import {icon, library as flibrary} from "@fortawesome/fontawesome-svg-core";
import {faTrash} from '@fortawesome/free-solid-svg-icons';
import {faArrowUp} from '@fortawesome/free-solid-svg-icons';
import {faArrowDown} from '@fortawesome/free-solid-svg-icons';
import {faEye} from '@fortawesome/free-solid-svg-icons';

let tbl = Symbol();

class LayerMgr {
    constructor(el, width, height, margin) {
        this[tbl] = d3.select(el)
            .append('table')
            .attr('id', 'tblLayerMgr')
            .attr('width', width + margin.right + margin.left)
            .attr('height', height + margin.top + margin.bottom);
    }

    addLayer(graph, layerId) {
        flibrary.add(faTrash);
        flibrary.add(faArrowUp);
        flibrary.add(faArrowDown);
        flibrary.add(faEye);

        const trashIcon = icon({ prefix: 'fas', iconName: 'trash' });
        const arrowUpIcon = icon({ prefix: 'fas', iconName: 'arrow-up' });
        const arrowDownIcon = icon({ prefix: 'fas', iconName: 'arrow-down' });
        const eyeIcon = icon({ prefix: 'fas', iconName: 'eye' });

        let layer = graph.layers.find(la => la.id ===layerId);
        let trow = this[tbl].append('tr')
            .attr('id', "layer-"+layerId);

        //layer id -1
        trow.append('td').text(layer.id)
            .on('click', function() {
                graph.selectLayer(layer.id);
                d3.select('#tblLayerMgr')
                    .selectAll('tr')
                    .selectAll('td:nth-child(1)')
                    .style('background-color', "black");
                if(layer.selected) {
                    d3.select(this).style('background-color', "#484848");
                    d3.select(this.nextSibling).style('background-color', "#484848");
                } else {
                    d3.select(this).style('background-color', "black");
                    d3.select(this.nextSibling).style('background-color', "black");
                }
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
            let td4 = trow.append('td')
                .on("click", function () {
                    if (layerId > 0) {
                        dispatch.call('layerDeleted', this, layerId);
                        d3.select(this).node().parentNode.remove();
                        updateLayerView(graph.layers);
                    } else {
                        alert("Can't delete layer this layer!");
                    }
                });
            td4.node().appendChild(trashIcon['node'][0]);

            //layer raise -5
            let td5 = trow.append('td')
                .attr('class', 'fa fa-arrow-up')
                .on("click", function () {
                    console.log("clicked me? up")
                });

            td5.node().appendChild(arrowUpIcon['node'][0]);

            //layer lower -6
            let td6 = trow.append('td')
                .attr('class', 'fa fa-arrow-down')
                .on("click", function () {
                    console.log("clicked me? down")
                });

            td6.node().appendChild(arrowDownIcon['node'][0]);

            //layer visible -7
            let td7 = trow.append('td')
                .attr('class', 'fa fa-arrow-down')
                .on("click", function () {
                    console.log("clicked me? down")
                });
            td7.node().appendChild(eyeIcon['node'][0]);
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