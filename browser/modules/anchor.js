var urlparser = require('./urlparser');
var urlVars = urlparser.urlVars;
var db = urlparser.db;
var schema = urlparser.schema;
var cloud;
var anchor = function () {
    var p = geocloud.transformPoint(cloud.getCenter().x, cloud.getCenter().y, "EPSG:900913", "EPSG:4326");
    return "#" + cloud.getBaseLayerName() + "/" + Math.round(cloud.getZoom()).toString() + "/" + (Math.round(p.x * 10000) / 10000).toString() + "/" + (Math.round(p.y * 10000) / 10000).toString() + "/" + ((cloud.getNamesOfVisibleLayers()) ? cloud.getNamesOfVisibleLayers().split(",").reverse().join(",") : "");
};
module.exports = {
    set: function (o) {
        cloud = o.cloud;
        return this;
    },
    init: function () {
        return "/" + db + "/" + schema + "/" + (typeof urlVars.i === "undefined" ? "" : "?i=" + urlVars.i.split("#")[0]) + anchor();
    }
};