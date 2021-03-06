/**
 * @fileoverview Description of file, its uses and information
 * about its dependencies.
 */

'use strict';

/**
 *
 */
var backboneEvents;

var oplevsyddjurs;

var cloud;

var setting;

var print;

var meta;

var legend;

var editor;

var metaDataKeys;

var jquery = require('jquery');
require('snackbarjs');

var showdown = require('showdown');
var converter = new showdown.Converter();

/**
 *
 * @returns {*}
 */
module.exports = {
    set: function (o) {
        backboneEvents = o.backboneEvents;
        cloud = o.cloud;
        setting = o.setting;
        print = o.print;
        meta = o.meta;
        legend = o.legend;
        try {
            editor = o.extensions.editor.index;
        }catch(e) {}
        
        return this;
    },
    init: function () {

        var map = cloud.get().map;

        backboneEvents.get().on("ready:meta", function () {

            metaDataKeys = meta.getMetaDataKeys();

        });

        // Unbind default
        $(document).unbindArrive(".info-label");

        // Set custom
        $(document).arrive('.info-label', function () {
            $(this).on("click", function (e) {
                var t = ($(this).data('gc2-id')), html,
                    meta = metaDataKeys[t] ? $.parseJSON(metaDataKeys[t].meta) : null,
                    name = metaDataKeys[t] ? metaDataKeys[t].f_table_name : null,
                    title = metaDataKeys[t] ? metaDataKeys[t].f_table_title : null,
                    abstract = metaDataKeys[t] ? metaDataKeys[t].f_table_abstract : null;

                html = (meta !== null
                    && typeof meta.meta_desc !== "undefined"
                    && meta.meta_desc !== "") ?
                    converter.makeHtml(meta.meta_desc) : abstract;

                moment.locale('da');

                for (var key in  metaDataKeys[t]) {
                    if (metaDataKeys[t].hasOwnProperty(key)) {
                        console.log(key + " -> " + metaDataKeys[t][key]);
                        if (key === "lastmodified") {
                            metaDataKeys[t][key] = moment(metaDataKeys[t][key]).format('LLLL');
                        }
                    }
                }

                html = html ? Mustache.render(html, metaDataKeys[t]) : "";

                $("#info-modal-top.slide-left").animate({left: "0"}, 200);
                $("#info-modal-top .modal-title").html(title || name);
                $("#info-modal-top .modal-body").html(html + '<div id="info-modal-legend" class="legend"></div>');
                legend.init([t], "#info-modal-legend");
                e.stopPropagation();
            });

        });

        $("#btn-about").on("click", function (e) {
            $("#about-modal").modal({});

        });

        $("#burger-btn").on("click", function () {
            $("#info-modal.slide-left").animate({
                left: "0"
            }, 500)
        });


        $("#info-modal.slide-left .close").on("click", function () {
            $("#info-modal.slide-left").animate({
                left: "-100%"
            }, 500)
        });

        // Bottom dialog
        $(".close-hide").on("click", function (e) {

            var id = ($(this)).parent().parent().attr('id');

            // If print when deactivate
            if ($(this).data('module') === "print") {
                $("#print-btn").prop("checked", false);
                print.activate();
            }

            // If editor when deactivate
            if (editor && $(this).data('module') === "editor") {
                editor.stopEdit();
            }

            $("#" + id).animate({
                bottom: "-100%"
            }, 500, function () {
                $(id + " .expand-less").show();
                $(id + " .expand-more").hide();
            });
        });

        $(".expand-less").on("click", function () {

            var id = ($(this)).parent().parent().attr('id');

            $("#" + id).animate({
                bottom: (($("#" + id).height()*-1)+30) + "px"
            }, 500, function () {
                $("#" + id + " .expand-less").hide();
                $("#" + id + " .expand-more").show();
            });
        });

        $(".expand-more").on("click", function () {

            var id = ($(this)).parent().parent().attr('id');

            $("#" + id).animate({
                bottom: "0"
            }, 500, function () {
                $("#" + id + " .expand-less").show();
                $("#" + id + " .expand-more").hide();
            });
        });

        $(".map-tool-btn").on("click", function (e) {

            e.preventDefault();

            var id = ($(this)).attr('href');

            // If print when activate
            if ($(this).data('module') === "print") {
                $("#print-btn").prop("checked", true);
                print.activate();
            }

            $(id).animate({
                bottom: "0"
            }, 500, function () {
                $(id + " .expand-less").show();
                $(id + " .expand-more").hide();
            })
        });


        $("#info-modal-top.slide-left .close").on("click", function () {
            $("#info-modal-top.slide-left").animate({
                left: "-100%"
            }, 500)
        });

        $("#todo-btn").on("click", function () {
            $("#todo-list-modal").modal({});
        });

        $("#zoom-in-btn").on("click", function () {
            map.zoomIn();
        });

        $("#zoom-out-btn").on("click", function () {
            map.zoomOut();
        });

        $("#zoom-default-btn").on("click", function () {
            cloud.get().zoomToExtent(setting.getExtent());
        });



    }
};