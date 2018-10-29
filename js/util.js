export class Util {
    //https://stackoverflow.com/questions/31804392/create-svg-arcs-between-two-points
    static arcLinks(x1,y1,x2,y2,n,k) {
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
            paths.push("M"+x1+" "+y1+"Q"+ex+" "+ey+" "+x2+" "+y2);
        }
        return paths;
    }
}