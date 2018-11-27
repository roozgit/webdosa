//https://stackoverflow.com/questions/31804392/create-svg-arcs-between-two-points
import {range} from "d3-array";
import {select} from "d3-selection";

function arcLinks(x1, y1, x2, y2, n, k) {
    if(n === 0) return [];
    let paths = [];
    let cx = (x1+x2)/2;
    let cy = (y1+y2)/2;
    let dx = x2-x1;
    let dy = y2-y1;
    let i;
    for (i=0; i < n; i++) {
        let dd = Math.sqrt(dx*dx+dy*dy);
        let ex = cx - dy/dd * k * (i + 1 -(n-1)/2);
        let ey = cy + dx/dd * k * (i + 1 -(n-1)/2);
        //the if is to prevent zero length arcs (overlapping points)
        if(dd && dd > 0) paths.push("M"+x1+" "+y1+"Q"+ex+" "+ey+" "+x2+" "+y2);
    }
    return paths;
}

 function ellipticalArc(x1, y1, x2, y2, w, r1, r2, dir) {
    return "M" + x1 + "," + y1
        + "A" + r1 + ","
        + r2 + ` 0 ${dir} ` + x2 + "," + y2;
 }

//https://stackoverflow.com/a/8486188/2928853
function getJsonFromUrl() {
    let query = location.search.substr(1);
    let result = {};
    query.split("&").forEach(function(part) {
        let item = part.split("=");
        result[item[0]] = decodeURIComponent(item[1]);
    });
    return result;
}

// Sample the SVG path uniformly with the specified precision.
function samples(path, precision) {
    let n = path.getTotalLength(), t = [0], i = 0, dt = precision;
    while ((i += dt) < n) t.push(i);
    t.push(n);
    return t.map(function(t) {
        let p = path.getPointAtLength(t), a = [p.x, p.y];
        a.t = t / n;
        return a;
    });
}

// Compute quads of adjacent points [p0, p1, p2, p3].
function quads(points) {
    return range(points.length - 1).map(function(i) {
        var a = [points[i - 1], points[i], points[i + 1], points[i + 2]];
        a.t = (points[i].t + points[i + 1].t) / 2;
        return a;
    });
}

// Compute stroke outline for segment p12.
function lineJoin(p0, p1, p2, p3, width) {
    var u12 = perp(p1, p2),
        r = width / 2,
        a = [p1[0] + u12[0] * r, p1[1] + u12[1] * r],
        b = [p2[0] + u12[0] * r, p2[1] + u12[1] * r],
        c = [p2[0] - u12[0] * r, p2[1] - u12[1] * r],
        d = [p1[0] - u12[0] * r, p1[1] - u12[1] * r];

    if (p0) { // clip ad and dc using average of u01 and u12
        var u01 = perp(p0, p1), e = [p1[0] + u01[0] + u12[0], p1[1] + u01[1] + u12[1]];
        a = lineIntersect(p1, e, a, b);
        d = lineIntersect(p1, e, d, c);
    }

    if (p3) { // clip ab and dc using average of u12 and u23
        var u23 = perp(p2, p3), e = [p2[0] + u23[0] + u12[0], p2[1] + u23[1] + u12[1]];
        b = lineIntersect(p2, e, a, b);
        c = lineIntersect(p2, e, d, c);
    }

    return "M" + a + "L" + b + " " + c + " " + d + "Z";
}

// Compute intersection of two infinite lines ab and cd.
function lineIntersect(a, b, c, d) {
    var x1 = c[0], x3 = a[0], x21 = d[0] - x1, x43 = b[0] - x3,
        y1 = c[1], y3 = a[1], y21 = d[1] - y1, y43 = b[1] - y3,
        ua = (x43 * (y1 - y3) - y43 * (x1 - x3)) / (y43 * x21 - x43 * y21);
    return [x1 + ua * x21, y1 + ua * y21];
}

// Compute unit vector perpendicular to p01.
function perp(p0, p1) {
    var u01x = p0[1] - p1[1], u01y = p1[0] - p0[0],
        u01d = Math.sqrt(u01x * u01x + u01y * u01y);
    return [u01x / u01d, u01y / u01d];
}

function insideRect(point, rect) {
    if(!point) return undefined;
    return point[0] >= rect.x && point[0] <= rect.x + rect.width
        && point[1] >= rect.y && point[1] <= rect.y + rect.height;
}

function intersect(points, rect) {
    let forward = false, backward = false;
    let i,j;
    for(i=0, j= points.length-1; i < points.length-1, j>=0; i++, j--) {
        let p1 = points[i];
        let p2 = points[i+1];
        if(!(p1 && p2)) return undefined;
        if (insideRect(p1, rect) &&
            !insideRect(p2, rect)) {
            forward = true;
            break;
        }
        p1 = points[j];
        p2 = points[j - 1];
        if(!(p1 && p2)) return undefined;
        if (insideRect(p1, rect) &&
                !insideRect(p2, rect)) {
            backward = true;
            break;
        }
    }
    if(forward) return points[i];
    else if(backward) return points[j];
    else return undefined;
}

function wcount(arr, item) {
    if(Array.isArray(arr))
        return arr.reduce((acc, cur) => cur===item ? acc+1 : acc, 0);
    throw "count needs an array as input";
}

function gradientGenerator(el, layer1, layer2, color1, color2, dir) {
    let c = '';
    if(el.startsWith("#a")) c= 'a';
    let grd = select(el).append('linearGradient')
        .attr('id', c + `grad-${layer1}-${layer2}-${dir}`)
        .attr("gradientUnits", "objectBoundingBox")
        .attr('x1', "0%")
        .attr('y1', "0%")
        .attr('x2', "100%")
        .attr('y2' , "0%");
    grd.append("stop")
        .attr('class', 'start')
        .attr("offset", "0%")
        .attr("stop-color", color1)
        .attr("stop-opacity", 1);
    grd.append("stop")
        .attr('class', 'end')
        .attr("offset", "100%")
        .attr("stop-color", color2)
        .attr("stop-opacity", 1);
}

export {arcLinks, getJsonFromUrl, ellipticalArc, samples, intersect, gradientGenerator, wcount};

