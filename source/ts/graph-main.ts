/**
 * Created by Marcus Bätz on 13.04.2017.
 * Ported to TypeScript by Dr. Oliver Alt
 */
/// <reference path="graph.ts" />

class Application {

	////////////////////////////////////////////////////
	//Mit Slider, der slider erhält eine range zwischen dem kleinsten Index und dem größten Index
	//Mann kann hier schnell durch alle Indizes durch wechseln

	private static graph;


	constructor() {

		Application.graph = new SpecIfGraphGenerator();

		let specIFData = (() => {
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

		let max = specIFData.resources.length - 1;
		let slider = $("#slider");
		let specif = specIFData;

		let options = {
			canvas: 'specifGraph',
			index: slider.val(),
			/**
			 * holds a set of common specIF title properties
			 * @type {Array}
			 */
			titleProperties: ["dcterms:title", "ReqIF.Name", "SpecIF:Heading", "ReqIF.ChapterName"],
			onDoubleClick: function (evt) {
				console.log('Double Click on:', evt);
				if (evt.target.index > -1 && evt.target.index < specif.resources.length) {
					options.index = evt.target.index
				}
				else {
					if (evt.target.resource && (typeof evt.target.resource == 'string')) {
						options.index = this.indexById(specif.resources, evt.target.resource);
					}
				}
				this.graph.init(specif, options);
			}
		};

		$("#label").text("Index: " + options.index);

		Application.graph.init(specif, options);

		slider.attr("max", max);

		$(document).on('input', '#slider', function () {
			options.index = slider.val();
			$("#label").text("Index: " + options.index);
			Application.graph.init(specif, options);
		});
	}

	////////////////////////////////////////////////////////////////
	//Ohne Slider, hier einfach den Index der Ressource angeben
	//let specif = specIFData;
	//graph.init(specif,15);

	private indexById(L, id) {
		for (var i = L.length - 1; i > -1; i--) {
			if (L[i].id === id) {
				return i;
			}
		}
		return -1;
	}


}

//console.debug("Application start.");
let app = new Application();
