# SpecIF-Graph
Draws a neighborhood graph of a given [SpecIF](http://specif.de) resource. Input is a SpecIF data-set plus some options, output is a HTML-5 canvas appended to a specified DOM element.

## Example
... taken from the show-case: Integrated Specification of a Mechatronic System ['Dimmer'](https://specif.de/apps/view.html#import=%22../examples/Dimmer.specifz%22):
![example](example.PNG)

## Required Libraries 
1. Requirejs: Not essential, can easily be removed.
2. Jquery: Only used by the top level example code (graph-main).
3. Vis.js: For creating the graph.

## Javascript-Sources
1.	Config: Die Pfade zu den Library-Files als Alias für Requirejs.
2.	Graph: Die gesamte Logik zur Erzeugung des Graphen. Als Parameter wird nur der Index des darzustellenden objects-Element aus dem SpecIF benötigt. Er zeichnet den Graphen dann in ein Canvas, welches er in ein in den options übergebenes div-Element einbettet. 
3.	Graph-main: Das einzige Element das direkt im html-Dokument verlinkt werden muss. Es erzeugt automatisch beim Laden der Seite den Graphen. Je nachdem wie es verwenden werden soll, gibt es auch eine Version, bei der über einen Schieberegler zwischen den einzelnen objects-Indizes gewechselt werden kann; der Graph wird dabei sofort neu gezeichnet. Andernfalls kann der Code entfernt und die eine auskommentierten Zeile verwendet werden.
4.	SpecIFData: Liefert ein Beispiel einer SpecIF-JSON Datei als return-Wert.

## Acknowledgements
Many thanks to 
- author marcusbaetz. 
- the makers of the fabulous library [vis.js](https://github.com/almende/vis)
- This work has been sponsored by [adesso AG](http://adesso.de), Berlin.
