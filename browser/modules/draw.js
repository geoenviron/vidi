/**
 * @fileoverview Description of file, its uses and information
 * about its dependencies.
 */

'use strict';

/**
 * @type {*|exports|module.exports}
 */
var cloud;

/**
 *
 * @type {boolean}
 */
var drawOn = false;

/**
 *
 * @type {L.FeatureGroup}
 */
var drawnItems = new L.FeatureGroup();

/**
 * @type {*|exports|module.exports}
 */
var drawControl;

/**
 * @type {gc2table}
 */
var table;

/**
 *
 * @type {geocloud.get().sqlStore}
 */
var store = new geocloud.sqlStore({
    clickable: true
});

/**
 *
 * @type {Array}
 */
var destructFunctions = [];

/**
 * @type {*|exports|module.exports}
 */
var backboneEvents;

var editing = false;

/**
 * Get readable distance of layer
 * @param e
 * @returns {string}
 * @private
 */
var _getDistance = function (e) {
    var tempLatLng = null;
    var totalDistance = 0.00000;
    $.each(e._latlngs, function (i, latlng) {
        if (tempLatLng == null) {
            tempLatLng = latlng;
            return;
        }
        totalDistance += tempLatLng.distanceTo(latlng);
        tempLatLng = latlng;
    });
    return L.GeometryUtil.readableDistance(totalDistance, true);
};

/**
 * Get readable area of layer
 * @param e
 * @returns {string}
 * @private
 */
var _getArea = function (e) {
    return L.GeometryUtil.readableArea(L.GeometryUtil.geodesicArea(e.getLatLngs()), true);
};

/**
 *
 * @type {{set: module.exports.set, control: module.exports.control, init: module.exports.init, getDrawOn: module.exports.getDrawOn, getLayer: module.exports.getLayer, getTable: module.exports.getTable, setDestruct: module.exports.setDestruct}}
 */
module.exports = {
    set: function (o) {
        cloud = o.cloud;
        backboneEvents = o.backboneEvents;
        return this;
    },
    control: function () {

        var me = this;

        if ($("#draw-btn").is(':checked')) {
            backboneEvents.get().trigger("on:drawing");

            // Turn info click off
            backboneEvents.get().trigger("off:infoClick");

            L.drawLocal = require('./drawLocales/draw.js');

            drawControl = new L.Control.Draw({
                position: 'topright',
                draw: {
                    polygon: {
                        allowIntersection: true,
                        shapeOptions: {
                        },
                        showArea: true
                    },
                    polyline: {
                        metric: true,
                        shapeOptions: {
                        }
                    },
                    rectangle: {
                        shapeOptions: {
                        }
                    },
                    circle: {
                        shapeOptions: {
                        }
                    },
                    marker: true,
                    circlemarker: true
                },

                edit: {
                    featureGroup: drawnItems
                }

            });

            drawControl.setDrawingOptions({
                polygon: {
                    icon: cloud.iconSmall
                },
                polyline: {
                    icon: cloud.iconSmall
                },
                rectangle: {
                    icon: cloud.iconSmall
                },
                circle: {
                    icon: cloud.iconSmall
                }
            });

            cloud.get().map.addControl(drawControl);
            $(".leaflet-draw-draw-circlemarker").append('<i class="fa fa-commenting-o" aria-hidden="true"></i>').css("background-image", "none");

            drawOn = true;

            // Unbind events
            cloud.get().map.off('draw:created');
            cloud.get().map.off('draw:drawstart');
            cloud.get().map.off('draw:drawstop');
            cloud.get().map.off('draw:editstart');
            cloud.get().map.off('draw:editstop');
            cloud.get().map.off('draw:deletestart');
            cloud.get().map.off('draw:deletestop');
            cloud.get().map.off('draw:deleted');
            cloud.get().map.off('draw:created');
            cloud.get().map.off('draw:edited');

            // Bind events
            cloud.get().map.on('draw:editstart', function (e) {
                editing = true;
            });

            cloud.get().map.on('draw:editstop', function (e) {
                editing = false;
            });

            cloud.get().map.on('draw:deletestart', function (e) {
                editing = true;
            });

            cloud.get().map.on('draw:deletestop', function (e) {
                editing = false;
            });

            cloud.get().map.on('draw:created', function (e) {

                var type = e.layerType, area = null, distance = null, drawLayer = e.layer;

                if (type === 'marker') {
                    drawLayer._vidi_marker = true;
                }

                if (type === 'circlemarker') {

                    drawLayer._vidi_marker = true;

                    var text = prompt(__("Enter a text for the marker or cancel to add without text"), "");

                    if (text !== null) {
                        drawLayer.bindTooltip(text, {permanent: true}).on("click", function () {
                        }).openTooltip();

                        drawLayer._vidi_marker_text = text;

                    } else {

                        drawLayer._vidi_marker_text = null;
                    }

                }

                drawnItems.addLayer(drawLayer);

                me.setStyle(drawLayer, type);

                if (type !== 'circlemarker') {
                    drawLayer.on('click', function (event) {

                        me.bindPopup(event);

                    });
                }

                if (type === "polygon" || type === "rectangle") {
                    area = _getArea(drawLayer);
                    //distance = getDistance(drawLayer);
                }
                if (type === 'polyline') {
                    distance = _getDistance(drawLayer);

                }
                if (type === 'circle') {
                    distance = L.GeometryUtil.readableDistance(drawLayer._mRadius, true);
                }

                drawLayer._vidi_type = "draw";

                drawLayer.feature = {
                    properties: {
                        type: type,
                        area: area,
                        distance: distance
                    }
                };
                table.loadDataInTable();
            });
            cloud.get().map.on('draw:deleted', function (e) {
                table.loadDataInTable();
            });
            cloud.get().map.on('draw:edited', function (e) {

                $.each(e.layers._layers, function (i, v) {

                    if (typeof v._mRadius !== "undefined") {
                        v.feature.properties.distance = L.GeometryUtil.readableDistance(v._mRadius, true);
                        v.updateMeasurements();

                    }
                    else if (typeof v._icon !== "undefined") {
                    } else if (v.feature.properties.distance !== null) {
                        v.feature.properties.distance = _getDistance(v);
                        v.updateMeasurements();

                    }
                    else if (v.feature.properties.area !== null) {
                        v.feature.properties.area = _getArea(v);
                        v.updateMeasurements();

                    }
                });
                table.loadDataInTable();
            });

            var po1 = $('.leaflet-draw-section:eq(0)').popover({content: __("Use these tools for creating markers, lines, areas, squares and circles."), placement: "left"});
            po1.popover("show");
            setTimeout(function () {
                po1.popover("hide");
            }, 2500);

            var po2 = $('.leaflet-draw-section:eq(1)').popover({content: __("Use these tools for editing existing drawings."), placement: "left"});
            po2.popover("show");
            setTimeout(function () {
                po2.popover("hide");
            }, 2500);
        } else {
            backboneEvents.get().trigger("off:drawing");

            // Turn info click on again
            backboneEvents.get().trigger("on:infoClick");

            drawOn = false;
        }
    },

    bindPopup: function (event) {

        if (editing) {
            return;
        }

        var popup = L.popup(), me = this;

        popup.setLatLng(event.latlng)
            .setContent('<p style="width: 200px">' + __("Apply default style settings for this drawing?") + '</p><a href="javascript:void(0)" id="btn-draw-apply-style-cancel" class="btn btn-raised btn-default btn-xs">' + __("Cancel") + '</a><a href="javascript:void(0)" id="btn-draw-apply-style-ok" class="btn btn-raised btn-primary btn-xs">' + __("Ok") + '</a>')
            .openOn(cloud.get().map);

        $("#btn-draw-apply-style-ok").on("click", function () {
            me.setStyle(event.target, event.target.feature.properties.type);
            cloud.get().map.closePopup(popup);
        });

        $("#btn-draw-apply-style-cancel").on("click", function () {
            cloud.get().map.closePopup(popup);

        });
    },

    /**
     * Set style on layer
     * @param l
     * @param type
     */
    setStyle: function (l, type) {

        if ($("#draw-measure").is(":checked") && type !== 'marker') {
            l.hideMeasurements();
            l.showMeasurements({
                showTotal: $("#draw-line-total-dist").is(":checked")
            });
        } else {
            if (type !== 'marker' && type !== 'circlemarker' ) {
                l.hideMeasurements();
            }
        }

        if (type !== 'marker' && type !== 'circlemarker') {
            l.setStyle({dashArray: $("#draw-line-type").val()});

            l.setStyle({lineCap: $("#draw-line-cap").val()});

            l.setStyle({color: $("#draw-colorpicker-input").val()});

            l.setStyle({weight: $("#draw-line-weight").val()});

            l.setStyle({opacity: "1.0"});
        }

        if (type === 'polyline') {

            window.lag = l.showExtremities($("#draw-line-extremity").val(), $("#draw-line-extremity-size").val(), $("#draw-line-extremity-where").val());

            l._extremities = {
                pattern: $("#draw-line-extremity").val(),
                size: $("#draw-line-extremity-size").val(),
                where: $("#draw-line-extremity-where").val()
            }
        }

        if (type === 'circlemarker') {
            l.setStyle({opacity: "0.0"});
            l.setStyle({fillOpacity: "0.0"});
        }
    },

    init: function () {

        var me = this;

        // Bind events
        $("#draw-btn").on("click", function () {
            me.control();
        });

        $("#draw-line-extremity").on("change", function () {
            var b = $("#draw-line-extremity").val() === "none";
            $("#draw-line-extremity-size").prop("disabled", b);
            $("#draw-line-extremity-where").prop("disabled", b);

        });

        $("#draw-measure").on("change", function () {
            var b = $("#draw-measure").is(":checked");
            $("#draw-line-total-dist").prop("disabled", !b);
        });
        //

        cloud.get().map.addLayer(drawnItems);
        store.layer = drawnItems;
        $("#draw-colorpicker").colorpicker({
            container: $("#draw-colorpicker")
        });
        $("#draw-table").append("<table class='table'></table>");
        (function poll() {
            if (gc2table.isLoaded()) {
                table = gc2table.init({
                    el: "#draw-table table",
                    geocloud2: cloud.get(),
                    locale: window._vidiLocale.replace("_", "-"),
                    store: store,
                    cm: [
                        {
                            header: __("Type"),
                            dataIndex: "type",
                            sortable: true
                        },
                        {
                            header: __("Area"),
                            dataIndex: "area",
                            sortable: true
                        },
                        {
                            header: __("Distance/Radius"),
                            dataIndex: "distance",
                            sortable: true
                        }
                    ],
                    autoUpdate: false,
                    loadData: false,
                    height: 400,
                    setSelectedStyle: false,
                    responsive: false,
                    openPopUp: false
                });

            } else {
                setTimeout(poll, 30);
            }
        }());
    },
    off: function () {
        // Clean up
        try {
            cloud.get().map.removeControl(drawControl);
        } catch (e) {
        }
        $("#draw-btn").prop("checked", false);
        // Unbind events
        cloud.get().map.off('draw:created');
        cloud.get().map.off('draw:drawstart');
        cloud.get().map.off('draw:drawstop');
        cloud.get().map.off('draw:editstart');
        cloud.get().map.off('draw:editstop');
        cloud.get().map.off('draw:deletestart');
        cloud.get().map.off('draw:deletestop');
        cloud.get().map.off('draw:deleted');
        cloud.get().map.off('draw:created');
        cloud.get().map.off('draw:edited');

        // Call destruct functions
        $.each(destructFunctions, function (i, v) {
            v();
        });
    },

    /**
     *
     * @returns {boolean}
     */
    getDrawOn: function () {
        return drawOn;
    },

    /**
     *
     * @returns {L.FeatureGroup|*}
     */
    getLayer: function () {
        return store.layer;
    },

    /**
     *
     * @returns {gc2table}
     */
    getTable: function () {
        return table;
    },

    /**
     *
     * @param f {string}
     */
    setDestruct: function (f) {
        destructFunctions.push(f);
    }
};


/**
 * PolylineExtremities.js
 */
(function () {

    var __onAdd = L.Polyline.prototype.onAdd,
        __onRemove = L.Polyline.prototype.onRemove,
        __bringToFront = L.Polyline.prototype.bringToFront;


    var PolylineExtremities = {

        SYMBOLS: {
            stopM: {
                'viewBox': '0 0 2 8',
                'refX': '1',
                'refY': '4',
                'markerUnits': 'strokeWidth',
                'orient': 'auto',
                'path': 'M 0 0 L 0 8 L 2 8 L 2 0 z'
            },
            squareM: {
                'viewBox': '0 0 8 8',
                'refX': '4',
                'refY': '4',
                'markerUnits': 'strokeWidth',
                'orient': 'auto',
                'path': 'M 0 0 L 0 8 L 8 8 L 8 0 z'
            },
            dotM: {
                'viewBox': '0 0 20 20',
                'refX': '10',
                'refY': '10',
                'markerUnits': 'strokeWidth',
                'orient': 'auto',
                'path': 'M 10, 10 m -7.5, 0 a 7.5,7.5 0 1,0 15,0 a 7.5,7.5 0 1,0 -15,0'
            },
            dotL: {
                'viewBox': '0 0 45 45',
                'refX': '22.5',
                'refY': '22.5',
                'markerUnits': 'strokeWidth',
                'orient': 'auto',
                // http://stackoverflow.com/a/10477334
                'path': 'M 22.5, 22.5 m -20, 0 a 20,20 0 1,0 40,0 a 20,20 0 1,0 -40,0'
            },
            arrowM: {
                'viewBox': '0 0 10 10',
                'refX': '1',
                'refY': '5',
                'markerUnits': 'strokeWidth',
                'orient': 'auto',
                'path': 'M 0 0 L 10 5 L 0 10 z'
            },
        },

        onAdd: function (map) {
            __onAdd.call(this, map);
            this._drawExtremities();
        },

        onRemove: function (map) {
            map = map || this._map;
            __onRemove.call(this, map);
        },

        bringToFront: function () {
            __bringToFront.call(this);
            this._drawExtremities();
        },

        _drawExtremities: function () {
            var pattern = this._pattern;
            this.showExtremities(pattern);
        },

        showExtremities: function (pattern, size, where) {
            this._pattern = pattern;

            var id = 'pathdef-' + L.Util.stamp(this);

            this._path.setAttribute('marker-end', 'none');
            this._path.setAttribute('marker-start', 'none');

            if (pattern === "none") {
                return this;
            }

            /* If not in SVG mode or Polyline not added to map yet return */
            /* showExtremities will be called by onAdd, using value stored in this._pattern */
            if (!L.Browser.svg || typeof this._map === 'undefined') {
                return this;
            }

            /* If empty pattern, hide */
            if (!pattern) {
                if (this._patternNode && this._patternNode.parentNode)
                    this._map._pathRoot.removeChild(this._patternNode);
                return this;
            }

            var svg = this._map._pathRoot;

            // Check if the defs node is already created
            /* var defsNode;
             if (L.DomUtil.hasClass(svg, 'defs')) {
                 defsNode = svg.getElementById('defs');
             } else {
                 L.DomUtil.addClass(svg, 'defs');
                 defsNode = L.Path.prototype._createElement('defs');
                 defsNode.setAttribute('id', 'defs');
                 var svgFirstChild = svg.childNodes[0];
                 svg.insertBefore(defsNode, svgFirstChild);
             }*/

            //

            var svg = this._map._renderer._container;

            // Check if the defs node is already created
            var defsNode;
            if (L.DomUtil.hasClass(svg, 'defs')) {
                defsNode = svg.getElementById('defs');

            } else{
                L.DomUtil.addClass(svg, 'defs');
                defsNode = L.SVG.create('defs');
                defsNode.setAttribute('id', 'defs');
                var svgFirstChild = svg.childNodes[0];
                svg.insertBefore(defsNode, svgFirstChild);
            }

            // Add the marker to the line

            this._path.setAttribute('id', id);

            var markersNode, markerPath, symbol = PolylineExtremities.SYMBOLS[pattern];

            // Check if marker is already created
            if (document.getElementById("defs").querySelector("#" + id)) {
                markersNode = document.getElementById("defs").querySelector("#" + id);
                markerPath = document.getElementById("defs").querySelector("#" + id).querySelector("path")
            } else {
                markersNode = L.SVG.create('marker');
                markerPath = L.SVG.create('path');
            }


            // Create the markers definition
            markersNode.setAttribute('id', id);
            for (var attr in symbol) {
                if (attr != 'path') {
                    markersNode.setAttribute(attr, symbol[attr]);
                } else {
                    markerPath.setAttribute('d', symbol[attr]);
                }
            }

            // Copy the path apparence to the marker
            var styleProperties = ['class', 'stroke', 'stroke-opacity'];
            for (var i = 0; i < styleProperties.length; i++) {
                var styleProperty = styleProperties[i];
                var pathProperty = this._path.getAttribute(styleProperty);
                markersNode.setAttribute(styleProperty, pathProperty);
            }
            markersNode.setAttribute('fill', markersNode.getAttribute('stroke'));
            markersNode.setAttribute('fill-opacity', markersNode.getAttribute('stroke-opacity'));
            markersNode.setAttribute('stroke-opacity', '0');
            markersNode.setAttribute('markerWidth', size);
            markersNode.setAttribute('markerHeight', size);

            markersNode.appendChild(markerPath);

            defsNode.appendChild(markersNode);

            switch (where) {
                case "1":
                    this._path.setAttribute('marker-end', 'url(#' + id + ')');
                    break;

                case "2":
                    this._path.setAttribute('marker-start', 'url(#' + id + ')');
                    break;

                case "3":
                    this._path.setAttribute('marker-end', 'url(#' + id + ')');
                    this._path.setAttribute('marker-start', 'url(#' + id + ')');
                    break;
            }

            return this;
        }

    };

    L.Polyline.include(PolylineExtremities);

    L.LayerGroup.include({
        showExtremities: function (pattern) {
            for (var layer in this._layers) {
                if (typeof this._layers[layer].showExtremities === 'function') {
                    this._layers[layer].showExtremities(pattern);
                }
            }
            return this;
        }
    });

})();



