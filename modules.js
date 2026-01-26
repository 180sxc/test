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
  maxScreenHeight: 1080,
  maxScreenWidth: 1920,
  fixTo: function (n, v) {
    return parseFloat(n.toFixed(v));
  },
  getDistance: function (x1, y1, x2, y2) {
    return mathSQRT((x2 -= x1) * x2 + (y2 -= y1) * y2);
  },
  getDirection: function (x1, y1, x2, y2) {
    return mathATAN2(y1 - y2, x1 - x2);
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
};
export { modules };
