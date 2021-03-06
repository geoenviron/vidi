var express = require('express');
var router = express.Router();
var http = require('http');
var config = require('../../config/config.js').cartodb;

router.get('/api/meta/:db/:schema', function (req, response) {
    var db = req.params.db, schema = req.params.schema, url, layers, data = [], u = 0, jsfile = "",
        schemas = schema.split(",");
    (function iter() {
        if (u === schemas.length) {
            jsfile = {
                data: data,
                success: true
            };
            response.header('content-type', 'application/json');
            response.send(jsfile);
            return;
        }
        url = "http://" + db + ".cartodb.com/api/v2/viz/" + schemas[u] + "/viz.json";
        console.log(url);
        http.get(url, function (res) {
            var statusCode = res.statusCode;
            if (statusCode != 200) {
                response.header('content-type', 'application/json');
                response.status(res.statusCode).send({
                    success: false,
                    message: "Could not get the Viz. Please check CartoDB viz id."
                });
                return;
            }
            var chunks = [];
            res.on('data', function (chunk) {
                chunks.push(chunk);
            });
            res.on("end", function () {
                var layerObj, fieldConf;
                jsfile = new Buffer.concat(chunks);
                try {
                    layers = JSON.parse(jsfile).layers[1].options.layer_definition.layers;
                } catch (e) {
                    console.log(e);
                }
                for (var i = 0; i < layers.length; i++) {
                    fieldConf = {};
                    for (var m = 0; m < layers[i].infowindow.fields.length; m++) {
                        fieldConf[layers[i].infowindow.fields[m].name] = {};
                        fieldConf[layers[i].infowindow.fields[m].name].sort_id = m;
                        fieldConf[layers[i].infowindow.fields[m].name].querable = true;
                        fieldConf[layers[i].infowindow.fields[m].name].alias = layers[i].infowindow.alternative_names[layers[i].infowindow.fields[m].name] || layers[i].infowindow.fields[m].name;
                    }

                    for (var m = 0; m < layers[i].tooltip.fields.length; m++) {
                        if (typeof fieldConf[layers[i].tooltip.fields[m].name] === "undefined") {
                            fieldConf[layers[i].tooltip.fields[m].name] = {};
                        }
                        fieldConf[layers[i].tooltip.fields[m].name].utfgrid = true;
                        fieldConf[layers[i].tooltip.fields[m].name].alias_tooltip = layers[i].tooltip.alternative_names[layers[i].tooltip.fields[m].name] || layers[i].tooltip.fields[m].name;
                    }

                    layers[i].legend.template = layers[i].legend.template.replace(/"/g, "'");
                    layerObj = {
                        f_table_schema: schemas[u],
                        f_table_name: layers[i].options.layer_name,
                        f_table_title: layers[i].options.layer_name,
                        f_geometry_column: "the_geom_webmercator",
                        pkey: "cartodb_id",
                        srid: "3857",
                        sql: layers[i].options.sql,
                        cartocss: layers[i].options.cartocss,
                        layergroup: JSON.parse(jsfile).title,
                        fieldconf: JSON.stringify(fieldConf),
                        legend: layers[i].legend,
                        meta: null,
                        infowindow: layers[i].infowindow,
                        tooltip: layers[i].tooltip
                    };
                    data.push(layerObj)
                }
                u++;
                iter();
            });
        }).on("error", function () {
            callback(null);
        });
    }());
});
module.exports = router;


