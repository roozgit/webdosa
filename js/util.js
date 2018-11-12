//https://stackoverflow.com/questions/31804392/create-svg-arcs-between-two-points
function arcLinks(x1,y1,x2,y2,n,k) {
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
        if(dd > 0) paths.push("M"+x1+" "+y1+"Q"+ex+" "+ey+" "+x2+" "+y2);
    }
    return paths;
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

export {arcLinks, getJsonFromUrl};

