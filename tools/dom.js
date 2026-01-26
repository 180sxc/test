export function byID(e, t) {
    return e.getElementById(t)
}
export function byCN(e, t){
    return e.getElementsByClassName(t)
}
export function qsa(e, t){
    return e.querySelectorAll(t)
}
export function qs(e, t){
    return e.querySelector(t)
}
class Local {
    save(key, item){
        localStorage.setItem(key, item)
    }
    get(key){
        localStorage.getItem(key)
    }
}
var ls = new Local()
var canvas = byID(document, "main-canvas");
export {canvas, ls};
