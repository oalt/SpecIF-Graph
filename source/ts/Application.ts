/**
 * Created by Marcus Bätz on 13.04.2017.
 * Ported to TypeScript by Dr. Oliver Alt
 */
/// <reference path="SpecIfGraphGenerator.ts" />

class Application {

	
	private graphGenerator: SpecIfGraphGenerator;

	constructor() {

		this.graphGenerator = new SpecIfGraphGenerator();

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

		

		
		let specif = specIFData;
		let selectedIndex : number = 0;

		////////////////////////////////////////////////////
		//Mit Slider, der slider erhält eine range zwischen dem kleinsten Index und dem größten Index
		//Mann kann hier schnell durch alle Indizes durch wechseln


		let max = specIFData.resources.length - 1;
		let slider = $("#slider");

		selectedIndex = slider.val() as number;

		$("#label").text("Index: " + selectedIndex);

		slider.attr("max", max);

		$(document).on('input', '#slider', () => {

			options.index = slider.val() as number;

			$("#label").text("Index: " + options.index);
			this.graphGenerator.init(specif, options);
		});

		

		////////////////////////////////////////////////////////////////
		//Ohne Slider, hier einfach den Index der Ressource angeben

		//selectedIndex = 17;


		let options = {
			canvas: 'specifGraph',
			index: selectedIndex,
			/**
			 * holds a set of common specIF title properties
			 * @type {Array}
			 */
			titleProperties: ["dcterms:title", "ReqIF.Name", "SpecIF:Heading", "ReqIF.ChapterName"],
			onDoubleClick: (evt) => {
				console.log('Double Click on:', evt);
				if (evt.target.index > -1 && evt.target.index < specif.resources.length) {
					options.index = evt.target.index
				}
				else {
					if (evt.target.resource && (typeof evt.target.resource == 'string')) {
						options.index = this.indexById(specif.resources, evt.target.resource);
					}
				}
				this.graphGenerator.init(specif, options);
			}
		};

		this.graphGenerator.init(specif, options);
	}

	

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
