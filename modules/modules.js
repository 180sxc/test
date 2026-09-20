var mathABS = Math.abs;
var mathCOS = Math.cos;
var mathSIN = Math.sin;
var mathPOW = Math.pow;
var mathSQRT = Math.sqrt;
var mathABS = Math.abs;
var mathATAN2 = Math.atan2;
var mathPI = Math.PI;
var modules = {
  mapScale: 10000,
  maxScreenHeight: 1080,//1080
  maxScreenWidth: 1020,//1920
  fixTo: function (n, v) {
    return parseFloat(n.toFixed(v));
  },
  getDistance: function (x1, y1, x2, y2) {
    return mathSQRT((x2 -= x1) * x2 + (y2 -= y1) * y2);
  },
  getDirection: function (x1, y1, x2, y2) {
    return mathATAN2(y1 - y2, x1 - x2);
  },
  getCenter: function(x1, y1, x2, y2){
    return [(x1 + x2) / 2, (y1 + y2) / 2];
  },
  eventIsTrusted: function (event) {
    if (event && typeof event.isTrusted == "boolean") {
      return event.isTrusted;
    } else {
      return true;
    }
  },
  checkTrusted: function (callback) {
    return function (ev) {
      if (ev && ev instanceof Event && modules.eventIsTrusted(ev)) {
        callback(ev);
      } else {
        console.error("Event is not trusted.", ev);
      }
    };
  },
  setTickloop: function(fn, time) {// idea from https://jesselawson.dev/posts/a-setinterval-alternative/
    let timeout = null,
    next = Date.now() + time,
    container = () => {
      next += time
      timeout = setTimeout(container, next - Date.now());
      return fn();
    }
    timeout = setTimeout(container, next - Date.now());
    const cancel = () => clearTimeout(timeout)
    return { cancel }
  },
  convexHull: function(points) { //convex hull algorithm https://en.wikipedia.org/wiki/Convex_hull
    points = [...points].sort((a,b) => a.x-b.x || a.y-b.y)
    const cross = (o, a, b) => (a.x-o.x)*(b.y-o.y)-(a.y-o.y)*(b.x-o.x)
    let lower = []
    for(let p of points) {
      while(lower.length >= 2 &&
        cross(lower[lower.length-2],lower[lower.length-1], p) <= 0)
        lower.pop()
      lower.push(p)
    }
    let upper = []
    for(let i = points.length-1; i>=0;i--){
      let p = points[i]
      while(upper.length >= 2 &&
        cross(upper[upper.length-2],upper[upper.length-1], p) <= 0)
        upper.pop()
      upper.push(p)
    }
    upper.pop();
    lower.pop();

    return lower.concat(upper)
  },
};
export { modules };
