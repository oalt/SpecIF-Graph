/**
 * Created by Marcus Bätz on 13.04.2017.
 * Ported to TypeScript by Dr. Oliver Alt
 */
/// <reference path="SpecIfGraphGenerator.ts" />
var Application = /** @class */ (function () {
    function Application() {
        var _this = this;
        this.graphGenerator = new SpecIfGraphGenerator();
        var specIFData = (function () {
            var json = null;
            $.ajax({
                'async': false,
                'global': false,
                'url': "./specif/TestModel1.specif",
                'dataType': "json",
                'success': function (data) {
                    json = data;
                }
            });
            return json;
        })();
        var specif = specIFData;
        var selectedIndex = 0;
        ////////////////////////////////////////////////////
        //Mit Slider, der slider erhält eine range zwischen dem kleinsten Index und dem größten Index
        //Mann kann hier schnell durch alle Indizes durch wechseln
        var max = specIFData.resources.length - 1;
        var slider = $("#slider");
        selectedIndex = slider.val();
        $("#label").text("Index: " + selectedIndex);
        slider.attr("max", max);
        $(document).on('input', '#slider', function () {
            options.index = slider.val();
            $("#label").text("Index: " + options.index);
            _this.graphGenerator.init(specif, options);
        });
        ////////////////////////////////////////////////////////////////
        //Ohne Slider, hier einfach den Index der Ressource angeben
        //selectedIndex = 17;
        var options = {
            canvas: 'specifGraph',
            index: selectedIndex,
            /**
             * holds a set of common specIF title properties
             * @type {Array}
             */
            titleProperties: ["dcterms:title", "ReqIF.Name", "SpecIF:Heading", "ReqIF.ChapterName"],
            onDoubleClick: function (evt) {
                console.log('Double Click on:', evt);
                if (evt.target.index > -1 && evt.target.index < specif.resources.length) {
                    options.index = evt.target.index;
                }
                else {
                    if (evt.target.resource && (typeof evt.target.resource == 'string')) {
                        options.index = _this.indexById(specif.resources, evt.target.resource);
                    }
                }
                _this.graphGenerator.init(specif, options);
            }
        };
        this.graphGenerator.init(specif, options);
    }
    Application.prototype.indexById = function (L, id) {
        for (var i = L.length - 1; i > -1; i--) {
            if (L[i].id === id) {
                return i;
            }
        }
        return -1;
    };
    return Application;
}());
//console.debug("Application start.");
var app = new Application();
//# sourceMappingURL=Application.js.map