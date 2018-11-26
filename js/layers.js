import d3, {select} from 'd3-selection';
import {dispatch} from './index';
import {icon, library as flibrary} from "@fortawesome/fontawesome-svg-core";
import {faTrash} from '@fortawesome/free-solid-svg-icons';
import {faArrowUp} from '@fortawesome/free-solid-svg-icons';
import {faArrowDown} from '@fortawesome/free-solid-svg-icons';
import {faEye, faEyeSlash} from '@fortawesome/free-solid-svg-icons';

let tbl = Symbol();

class LayerMgr {
    constructor(el, width, height, margin) {
        this[tbl] = select(el)
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
        flibrary.add(faEyeSlash);

        const trashIcon = icon({ prefix: 'fas', iconName: 'trash' });
        const arrowUpIcon = icon({ prefix: 'fas', iconName: 'arrow-up' });
        const arrowDownIcon = icon({ prefix: 'fas', iconName: 'arrow-down' });
        const eyeIcon = icon({ prefix: 'fas', iconName: 'eye' });
        const eyeSlashIcon = icon({ prefix: 'fas', iconName: 'eye-slash' });

        let layer = graph.layers.find(la => la.id ===layerId);
        let trow = this[tbl].append('tr')
            .attr('id', "layer-"+layerId);

        //layer id -1
        let td1 = trow.append('td').text(layer.id)
            .on('click', () => {
                graph.selectLayer(layer.id);
                this.selectRow(td1.node());
            });

        //layer label -2
        trow.append('td').text(layer.label)
            .attr("contentEditable",true)
            .on("keyup", function() {
                if(d3.event.code === "Enter") {
                    //console.log(select(this).text());
                    layer.label = select(this).text();
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
                        select(this).node().parentNode.remove();
                        updateLayerView(graph.layers);
                    } else {
                        alert("Can't delete layer this layer!");
                    }
                });
            td4.node().appendChild(trashIcon['node'][0]);

            //layer raise -5
            let td5 = trow.append('td')
                .on("click", function () {
                    console.log("clicked me? up")
                });
            td5.node().appendChild(arrowUpIcon['node'][0]);

            //layer lower -6
            let td6 = trow.append('td')
                .on("click", function () {
                    console.log("clicked me? down")
                });
            td6.node().appendChild(arrowDownIcon['node'][0]);

            //layer visible -7
            let td7 = trow.append('td')
                .on("click", function () {
                    dispatch.call('toggleLayer', this, layerId);
                    let attr = td7.select('svg').attr('data-icon');
                    td7.node().removeChild(td7.node().childNodes[0]);
                    if(attr === "eye") {
                        td7.node().appendChild(eyeSlashIcon.node[0]);
                    } else {
                        td7.node().appendChild(eyeIcon.node[0]);
                    }
                });
            td7.node().appendChild(eyeIcon['node'][0]);
        }

        this.selectRow(td1.node());
    }

    selectRowById(id) {
        let tds = select('#tblLayerMgr')
            .selectAll('tr')
            .selectAll('td:nth-child(1)');
        this.selectRow(tds.nodes().find(n => +n.innerHTML === id));
    }

    selectRow(elem) {

        select('#tblLayerMgr')
            .selectAll('tr')
            .selectAll('td:nth-child(1), td:nth-child(2)')
            .style('background-color', "black");
        select(elem).style('background-color', "#484848");
        select(elem.nextSibling).style('background-color', "#484848");
    }

}

function updateLayerView(layers) {
    select('#tblLayerMgr').selectAll('tr')
        .each(function(_, i) {
            select(this).select('td:nth-child(3)')
                .text(layers[i].members.size);
        });
}

export {LayerMgr, updateLayerView};