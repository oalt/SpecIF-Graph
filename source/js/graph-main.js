/**
 * Created by Marcus Bätz on 13.04.2017.
 */

require(["config"], function() {
    require([ "graph", "jquery","specIFData"], function(graph,$,specIFData) {
////////////////////////////////////////////////////
        //Mit Slider, der slider erhält eine range zwischen dem kleinsten Index und dem größten Index
        //Mann kann hier schnell durch alle Indizes durch wechseln
        let max = specIFData.resources.length-1;
        let slider =  $("#slider");
		let specif = specIFData;
		let options = {
			canvas:'specifGraph',
			/**
			 * holds a set of common specIF title properties
			 * @type {Array}
			 */
			titleProperties: ["dcterms:title", "ReqIF.Name", "SpecIF:Heading", "ReqIF.ChapterName"],
			index: slider.val()
		};
        $("#label").text("Index: " +options.index );
        graph.init(specif,options);
        slider.attr("max",max);
        slider
        $(document).on('input', '#slider', function() {
			options.index = slider.val();
            $("#label").text("Index: " +options.index );
            graph.init(specif,options)
        });
////////////////////////////////////////////////////////////////
        //Ohne Slider, hier einfach den Index der Ressource angeben
//		let specif = specIFData;
//		graph.init(specif,15);

    });
});