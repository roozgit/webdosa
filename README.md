# Web-DOSA

DOSA stands for Detail to Overview via Selections and Aggregations. It is a multivariate graph visualization system
designed by Stef van den Elzen and Jarke J. van Wijk. You can find the link to the paper 
[here (PDF)](https://ieeexplore.ieee.org/stamp/stamp.jsp?arnumber=6875972).

We are trying to implement this visualization system for browsers.

## Online Demos

- [Texas Synthetic Electrical System](https://electricgrids.engr.tamu.edu/electric-grid-test-cases/activsg2000/)
: https://roozgit.github.io/webdosa?dataset=activsg 

- [US Flights(incomplete)](http://stat-computing.org/dataexpo/2009/the-data.html):
https://roozgit.github.io/webdosa?dataset=flight

- Our test dataset: https://roozgit.github.io/webdosa?dataset=toy  

## Installation

Just clone the repository or download the zip file and extract it to a folder. Then change
directory to that folder; once inside the folder, type:

`$ npm install`

This will have all the dependencies installed. The app can then be started by simply opening
**index.html** from the project root folder. To avoid trouble with some browsers' CORS
policy, we recommend serving the whole folder using a local server.

## System Description

### (D)etail

Detail view starts with all nodes in the graph shown. The default x axis is longitude (*lng*), and the 
default y axis is latitude (*lat*). The use can perform the following actions in the detail view:

1. Make a selection: by clicking and dragging the mouse, the user can brush through the graph. 
To make brushing fast and efficient, the system uses a 
[quadtree](https://github.com/d3/d3-quadtree) to index the nodes. This technique enables fast
selections and enables the system support larger number of nodes. Each selection the user makes
creates a new layer which translates directly to the [Overview](#Overview).

2. Change graph projection using other features. Dataset features are listed in two select boxed
below the graph. After the user changes an axis projection feature, the system, rescales the
axis, and also recalculates the quadtree before plotting the data again.

### (O)verview

The overview displays an infographic representing an aggregated view of the selections
(layers). The infographic summarizes the selected nodes with a chart and summarizes the
selected edges with fat arrows. The user can do the following actions in this view:

1. The user can drag the infographic boxes around and arrange them in a desired fashion.

2. By changing the first two selection boxes under the overview, the user 
can change the projection of the summarized nodes based on various features in the dataset.
The user can also change the chart type in the aggregated box by changing the corresponding
selection box.

3. The user can change the criteria for edge aggregation. By default the system scales the 
width of the arrows based on the number of edges between or within each selection. The user 
can select a different edge feature and visualize the aggregation of that feature.

4. The user can export an SVG file of the overview. One good way to do this is to use browser
extension. We use [crowbar](https://nytimes.github.io/svg-crowbar/) which allows for a quick
download of the SVG from the overview. The user can then edit the SVG file in a graphical
editor such as [Inkscape](https://inkscape.org/) and enhance the infographic or make it 
ready for publication.

### (S)elections and (A)ggregations

#### Selection System

The selection system follows a layered approach. When a node is selected by two or more
layers, the layer with higher priority takes precedence and picks up the node. The layers can
be reordered, deleted or frozen using the layer manager on the left hand pane of the app.

The layers can only be created by brushing in the detail window. The color is selected 
automatically and the new layer is added to the layer manager table. Layer label can be 
edited by the user by clicking on the label in the table. Also, layer manager shows the 
number of nodes currently selected by that layer.

#### Scented Widgets

The scented widgets show an overview of the dataset features. Discrete features are first 
enumerated and then projected on a continuous scale. The user can do the following actions
with the scented widgets:

1. After creating a new layer, the user can create a filter by brushing on a node widget.
The initial selection is not important; it only tells the system that this widget is
activated. After this action, When the user moves the selection around, the corresponding 
widget also shows the *extent* of values within that selection.

2. To reverse filtering direction, the user can click on the small screwdriver icon below the 
widget (note that this only works if the widget has been already activated). After this
action, it is the widget that controls the detail; when the user moves the selection around
in the detail, only nodes that satisfy the created filters are picked up and added to the 
selection.

3. The user can click on the close icon (X) to remove the filtering from the widget.

Note that each layer can have its own filters in both directions.

#### Info tab

The user can hover on the points in the small scatterplot inside the overview to highlight
those points in the detail; in addition, all the data associated with that point is displayed
in the Info tab.

## Data Format

The system can accept any dataset similar to the following JSON which represents a graph
with two nodes and one edge between them:

```json5
{
   "nodes":[
      {
         "classes":"airport",         
         "data":{
            "id":1,
            "dataField1":"MSP",
            "dataField2":"Minneapolis",
            "dataField3":187
         },
         "features":{
            "lat":44.883333,
            "lng":-93.216944,
           "feature1" : 1,
           "feature2" :2,
           "feature3" :3
         },
         "position":{
            "x":-93.216944,
            "y":-44.883333
         }
      },
      {
               "classes":"airport",         
               "data":{
                  "id":2,
                  "dataField1":"MSP",
                  "dataField2":"Minneapolis",
                  "dataField3":187
               },
               "features":{
                  "lat":54.883333,
                  "lng":-13.216944,
                 "feature1" : 1,
                 "feature2" :2,
                 "feature3" :3
               },
               "position":{
                  "x":-13.216944,
                  "y":54.883333
               }
            }
   ],
   "edges":[
      {
         "classes":"Line",
         "data":{
            "id": "1",
            "source":1,
            "target":2
         },
         "features":{
            "edgeFeature1":1,
            "edgeFeature2":2,
           "edgeFeature3":3
         }
      }
   ]
}
```

A few things to consider if you are planning to convert your dataset to this format:

- Please do not use dash `-` character in feature names. The system uses feature names to 
create IDs for HTML element. These IDs usually look like : `SomeString-feature1-feature2`.
This ID is then used by various elements in the system. To extract useful information, 
Javascript `string.split("-")` function is used. Therefore, the use of dash character can
create ambiguities during execution.

- `data` and `classes` objects are not currently used in the system. These are there for
possible future uses.

## Application Design

### Module System

The application is designed in a modular fashion using es6 modules. The whole application is loaded using 
[unpkg's getlib](https://www.npmjs.com/package/getlibs) and therefore requires a working
Internet connection. Other than that, the application has no explicit dependencies. All
dependencies are managed using npm through package.json to ensure that they are always
up-to-date. The developer does not need to worry about updating this application explicitly
at all.

### Coordinated Views Design

The application heavily uses [d3-dispatch](https://github.com/d3/d3-dispatch) for
inter-module communication. Almost no module directly manipulates the objects belonging to
another module.

There is still some shared state between the modules (graph data). But the application is 
designed in a way to make it easier to refactor each module and move towards a fully modular
application.

### Module Descriptions

Following is a short explanation of each module ordered alphabetically:

- **aggregation.js**: responsible for calculating and rendering the overview.
- **datastore.js**: responsible for loading data. It can load data from remote locations too.
- **detail.js**: calculates and renders the detail view
- **HGraph.js**: holds the underlying graph data structure shared between all modules. It also
contains graph adjacency list, graph reverse adjacency list, node and edge filtering, and
layer information.
- **index.js**: entry point of the app. Registers all events and wires up different parts of the app.
- **layers.js**: displays the layer manager table.
- **plotter.js**: creates and manipulates the plots inside the infographic boxes
- **util.js**: contains utility functions
- **widget.js**: manages scented widgets and their respective events. 
