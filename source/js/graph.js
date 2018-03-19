/**
 * Created by baetz on 27.04.2017.
 * Updated by se@enso-managers.de on 2018-03-14
 */
define([ "vis" ], function (vis) {

    function init(specifData,opts) {
//		console.debug('init input',specifData,opts);

		// Check for missing options:
		if ( !opts
			|| !opts.canvas
			) return;
		if( !opts.index || opts.index>specifData.resources.length-1 ) opts.index = 0;
		if( !opts.titleProperties ) opts.titleProperties = [];
			
		// All required parameters are available, so we can begin:
		let relations = collectStatementsByType( specifData.resources[opts.index] );
		console.debug('init relations',relations);
		// if there are no relations, do not create a graph:
		if ( !relations ) return;

		let nodesData = [];
		let edgeData = [];

		let idx = 0;
		for (let entry in relations) {
			// an iteration per relation type:
			if (relations.hasOwnProperty(entry)) {
				if (entry === "inFocus") {
					idx = pushMainNode( nodesData, relations[entry] )
				}
				else {
					let relProp = countRelationTypesAndEdges(relations);
					idx = pushAllChildNodesAndEdges(idx, nodesData, edgeData, relations[entry], entry, relProp)
				}
			}
		};
		console.debug('rawData',nodesData,edgeData);
		let nodes = new vis.DataSet(nodesData);
		let edges = new vis.DataSet(edgeData);
		let container = document.getElementById( opts.canvas );

		let data = {
			nodes: nodes,
			edges: edges
		};
		console.debug('data',nodes,edges);
		let options = {
			autoResize: true,
			height: '100%',
			width: '100%',
			locale: 'en',
			clickToUse: false,
			nodes: {
				shape: "box"
			},
			edges: {
				font: {
					align: "bottom"
				},
				smooth: {
					type: "continuous"
				}
			},
			manipulation: {
				"enabled": false
			},
			physics: {
				enabled: false
			}
		};

		let network = new vis.Network(container, data, options);
		// Collapse/close a 'large' sub-network:
		network.getConnectedNodes("0").forEach(function (connectedNode) {
			let neighbours = network.getConnectedNodes(connectedNode);
			if (neighbours.length > 5) {
				closeCluster(connectedNode, network);
			}
		});
		network.on("doubleClick", function (prms) {
			console.debug("doubleClick",prms);
			if (prms.nodes.length === 1) {
				if (!isIE() && prms.nodes[0] !== 0 &&
					network.getConnectedNodes(prms.nodes[0]).length === 1 &&
					!network.clustering.isCluster(prms.nodes[0])) {
					// it is a peripheral node with a single edge:
					opts.onDoubleClick(prms.nodes[0])
				};
				if (typeof prms.nodes[0] === "string" && prms.nodes[0].includes(":")) {
					if (!network.clustering.isCluster(prms.nodes[0])) return
				};
				// else, open or close the cluster depending in its state:
				if (network.clustering.isCluster(prms.nodes[0])) {
					let releaseOptions = {
						releaseFunction: function (clusterPosition, containedNodesPositions) {
							let newPositions = {};
							let dist, offset;
							let i = 0;
							let length = Object.keys(containedNodesPositions).length - 1;
							for (let id in containedNodesPositions) {
								if (containedNodesPositions.hasOwnProperty(id)) {
									if (id === "0" || (!containedNodesPositions["0"] && !id.includes(":"))) {
										newPositions[id] = {x: clusterPosition.x, y: clusterPosition.y};
										if (id !== "0") {
											offset = Math.atan(clusterPosition.y / clusterPosition.x);
											if (clusterPosition.x < 0) offset += Math.PI;
											dist = 100;
										}
									} 
									else {
										newPositions[id] = calculateNodePosition(
											i,
											length,
											clusterPosition.x, clusterPosition.y,
											dist,
											offset);
										i++
									}
								}
							};
							return newPositions
						}
					};
					network.clustering.openCluster(prms.nodes[0], releaseOptions)
				} 
				else {
					closeCluster(prms.nodes[0], network);
				}
			}
		});


        /**
         * This function closes a given cluster
         * @param node A node that is a cluster
         * @param network the network the node is part of
         */
        function closeCluster(node, network) {
            if (node === 0) {
                network.getConnectedNodes("0").forEach(function (connectedNode) {
                    closeCluster(connectedNode, network)
                })
            };
            let options = {
                joinCondition: function (nodeOptions, childNode) {
                    return childNode.id !== 0
                },
                clusterNodeProperties: {
                    label: "",
                    shape: "diamond"
                }
            };
            network.clustering.clusterByConnection(node, options)
        }

        /**
         * wraps a text after e specific number of chars
         * @param str The Stringt that hast to be wrapped
         * @returns {string} the wrapped string
         */
        function wrapText( str, maxLen ) {
            str = xmlChar2utf8(str);
            let newLine = '\n',
				out = '',
				found = false;
            if ( str.length<maxLen+1 ) return str;
            do {
                found = false;
                // Insert new line at last whitespace before maxLen:
                for ( var i = maxLen-1; i > maxLen*0.7; i--) {
                    if (testWhite(str.charAt(i))) {
                        out = out + [str.slice(0, i), newLine].join('');
                        str = str.slice(i + 1);
                        found = true;
                        break
                    }
                };
                // Inserts new line at maxLen position, the word is too long to wrap
                if (!found) {
                    out += [str.slice(0, maxLen) + "-", newLine].join('');
                    str = str.slice(maxLen)
                }
            } while ( str.length>maxLen-1 );
            return out + str
        }

        /**
         * test a char if it is a whitespace
         * @param x the given char as string
         * @returns {boolean}
         */
        function testWhite(x) {
            let white = new RegExp(/^\s$/);
            return white.test(x.charAt(0))
        }

        /**
         * Returns a calculated Position for a given node
         * @param i the index of the node in the list of neighbour nodes of the parent
         * @param length The length of the list of neighbour nodes of the parent
         * @param x the x position of the parent
         * @param y the y position of the parent
         * @param dist the preferred distance between the parent node and this node
         * @param offset the offset as rad angle where the placement start
         * @returns {{x: number, y: number, alpha: number}}
         */
        function calculateNodePosition(i, length, x, y, dist, offset) {

            let pos = {x: 0, y: 0, alpha: 0};
            if (!dist) dist = 150;
            let u = (length <= 4 ? 8 : length) * dist;
            let r = u / (2 * Math.PI);
            if (r < dist * 2) r = dist * 2;
            if (r > 2 * dist && i % 2 === 0) r = r / 1.5;
            else if (offset && i % 2 === 0) r = r / 2;

            let alpha = (2 * Math.PI) / (length <= 4 ? 8 : length) * i;
            if (offset) alpha = offset + alpha - (2 * Math.PI) / (length <= 4 ? 8 : length) * ((length - 1) / 2);
            pos.x = x + r * Math.cos(alpha);
            pos.y = y + r * Math.sin(alpha);
            pos.alpha = alpha;
            return pos
        }

        /**
         * pushes the Main Node into the nodesData array
         * @param nodesData
         * @param entry
         * @returns {number}
         */
        function pushMainNode( nodesData, entry ) {
            nodesData.push(
                {
                    id: 0,
                    label: wrapText( getResourceTitleByID(entry), 20 ),
                    x: 0,
                    y: 0,
                    shape: "circle"
                }
            );
            return 1
        }

        /**
         * Pushes all child nodes and edges for targets and sources for a given relation entry in the nodesData
         * and edgeData object
         * @param idx Anongoing number for all children of the main node
         * @param nodesData The nodesData object
         * @param edgeData The edgeData object
         * @param entry The relation entry
         * @param value the label for the edge
         * @param relProp the relation properties object containing length and relations number
         * @returns returns a new idx for the next object
         */
        function pushAllChildNodesAndEdges(idx, nodesData, edgeData, entry, value, relProp) {

            if (entry.targets.length)
                idx = pushChildNodesAndEdges(idx, nodesData, edgeData, entry.targets, value, relProp, true);

            if (entry.sources.length)
                idx = pushChildNodesAndEdges(idx, nodesData, edgeData, entry.sources, value, relProp, false);
            return idx
        }

        /**
         * Pushes one child node and edge in the nodesData and edgeData object
         * @param idx The id of the node
         * @param nodesData The nodesData object
         * @param edgeData The childData object
         * @param array Array of all connected child nodes
         * @param value The value of the edge label
         * @param relProp The relation properties object
         * @param isTarget A bool that represents if it is a object or a subject relationship
         * @returns {*}
         */
        function pushChildNodesAndEdges(idx, nodesData, edgeData, array, value, relProp, isTarget) {

//          if (array.length < 2 || relProp.types < 2) {
            if ( array.length < 2 ) {
                array.forEach(function (entry) {
                    let pos = calculateNodePosition( idx, relProp.types<2 ? array.length : relProp.edges, 0, 0 );
                    pushNodeAndEdge(idx,
                        isTarget ? 0 : idx,
                        isTarget ? idx : 0,
                        nodesData,
                        edgeData,
                        entry,
                        value,
                        pos);
                    idx++
                })
            } 
			else {
                let pos = calculateNodePosition(idx, relProp.edges, 0, 0);
                pushNodeAndEdge(idx,
                    isTarget ? 0 : idx,
                    isTarget ? idx : 0,
                    nodesData,
                    edgeData,
                    "",
                    value,
                    pos);
                let childID = 0;
                array.forEach(function (entry) {
                    let childPos = calculateNodePosition(
                        childID,
                        array.length,
                        pos.x, pos.y,
                        100,
                        pos.alpha);
                    let childIDString = idx + ":" + childID;
                    pushNodeAndEdge(childIDString, idx, childIDString, nodesData, edgeData, entry, "", childPos);
                    childID++
                });
                idx++
            };
            return idx
        }

        /**
         * Finally creates and pushes the child and parent node and edge objects into the nodesData and edgeData object
         * @param id The id of the Parent node(main node or helper node)
         * @param sourceID the id of the subject the arrow comes from
         * @param targetID the id of the traget the arrow goes to
         * @param nodesData The nodeData object
         * @param edgeData The edgeData object
         * @param entry The relation entry
         * @param value The value of the edge label
         * @param pos the pos of the node
         */
        function pushNodeAndEdge(id, sourceID, targetID, nodesData, edgeData, entry, value, pos) {
            nodesData.push({
                id: id,
				// cluster nodes do not have a label:
                label: entry?wrapText( getResourceTitleByID(entry), 20 ):"",
                x: pos.x,
                y: pos.y,
                shape: entry === "" ? "circle" : "box"
            });
            edgeData.push({
                from: sourceID,
                to: targetID,
                arrows: sourceID === 0 || targetID === 0 ? "to" : "",
                label: value
            })
//			console.debug('pushNodeAndEdge',entry,value)
        }

		/**
         * If the resource type of a resource has an icon this function returns the icon
         * @param type resource type
         * @returns {string} The resource icon or an empty string
         */
        function getIconForResourceClass(type) {
			for (var i = specifData.resourceClasses.length-1; i>-1; i--)
                if (specifData.resourceClasses[i].id === type)
                    return specifData.resourceClasses[i].icon ? specifData.resourceClasses[i].icon + " " : "";
			return ""
        }

        /**
         * Returns a string representing the title of a resource with the given id.
         * @param id the id of a resource
         * @returns {string} title of the resource with icon, if available
         */
        function getResourceTitle(res) {
			if( res.properties ) {
				for (var n=0; n<res.properties.length; n++)
					if (opts.titleProperties.includes(res.properties[n].title))
						return xmlChar2utf8(res.properties[n].value)
            };
            if( res.title ) return xmlChar2utf8(res.title);
            return undefined
        }
        function getResourceTitleByID(id) {
            let res = resourceByID(id);
			if( res ) return getIconForResourceClass(res.resourceClass) + getResourceTitle(res);
			return id
        }

        /**
         * Returns the title for a given statement
         * @param stm the given statement
         * @returns the title of the statement.
         */
        function getStatementTitle(stm) {
			// Try to get it from a title property:
			if( stm.properties ) {
				for (var n=0; n<stm.properties.length; n++)
					if (opts.titleProperties.includes(stm.properties[n].title))
						return xmlChar2utf8(stm.properties[n].value)
            };
			// else, try:
            if( stm.title ) return xmlChar2utf8(stm.title);
			// finally, get it from the class:
			if( specifData.statementClasses ) {
				let i = specifData.statementClasses.length;
				while (i--) {
					if (specifData.statementClasses[i].id === stm.statementClass)
						return xmlChar2utf8(specifData.statementClasses[i].title)
				}
			};
            return undefined
        }
        function getStatementTitleByID(id) {
            let stm = statementByID(id);
            if( stm ) return getStatementTitle(stm);
			return id
        }

        /**
         * Returns the item for the given id
         * @param id the id of the item
         * @returns the item for the id or undefined if there is none
         */
        function resourceByID(id) {
            for (var i = specifData.resources.length-1; i>-1; i--)
                if (specifData.resources[i].id === id) return specifData.resources[i];
			return undefined
        }
        function statementByID(id) {
            for (var i = specifData.statements.length-1; i>-1; i--)
                if (specifData.statements[i].id === id) return specifData.statements[i];
			return undefined
        }

        /**
         * converts all forbidden chars to html unicode
         * @param str String to be checked
         * @returns {string} cleaned string
         */
/*		function cleanStringFromForbiddenChars(str) {
            str = xmlChar2utf8(str);
            let i = str.length,
                aRet = [];
            while (i--) {
                let iC = str[i].charCodeAt(0);
                if (iC < 65 || iC > 127 || (iC > 90 && iC < 97)) aRet[i] = '&#' + iC + ';';
                else aRet[i] = str[i]
            };
            return aRet.join('')
        }
*/
        /**
         * Converts html numeric character encoding to utf8
         * @param str String to be checked
         * @returns {string} cleaned string
         */
//		function cleanStringHtmlToUniCode(str) {
        function xmlChar2utf8 (str) {
/*			return str.replace(/&#(\d+);/g, function(match, dec) {
                return String.fromCharCode(dec)
            })
        }
*/			str = str.replace(/&#x([0-9a-fA-F]+);/g, function (match, numStr) {
                return String.fromCharCode(parseInt(numStr, 16))
            });
            return str.replace(/&#([0-9]+);/g, function (match, numStr) {
                return String.fromCharCode(parseInt(numStr, 10))
            })
        }

        /**
         * Returns an object containing two properties:
         * - types is the number of relation types
         * - edges is the number of edges in the future graph
		 * If a relation type has both sources and targets, types is 1 and edges is 2.
		 * If a relation type has only sources OR targets, types and edges are 1.
         * @param rels The relations object
         * @returns {{types: number, edges: number}}
         */
        function countRelationTypesAndEdges(rels) {
            let cnt = {types: 0, edges: 0};
            for (let entry in rels) {
                if (rels.hasOwnProperty(entry)) {
                    if (entry !== "inFocus") {
                        if (rels[entry].targets.length) cnt.edges++;
                        if (rels[entry].sources.length) cnt.edges++;
                        cnt.types++
                    }
                }
            };
//			console.debug('countRelationTypesAndEdges',rels,cnt);
            return cnt
        }

        /**
         * Returns an object with pattern {relationtype:{targets:[],sources:[]}} containing all targets and sources
         * related to the given resource and sorted by statement types
         * @param object The resource, where the relations are to
         * @returns json object of the statements with titles for statements, subjects and objects
         */
        function collectStatementsByType(res) {
            let stms = {
				inFocus: res.id
			};
            for (var i=0; i<specifData.statements.length; i++) {
				// SpecIF v0.10.x: subject/object without revision, v0.11.y: with revision
				let oid = specifData.statements[i].object.id || specifData.statements[i].object,
					sid = specifData.statements[i].subject.id || specifData.statements[i].subject;
				
				if ( sid === res.id || oid === res.id) {
					// all statements having the same title are clustered:
					let stmC = getStatementTitle(specifData.statements[i]);
					// all statements having the same class are clustered:
//					let stmC = specifData.statements[i].statementClass;
					if (!stms[stmC]) {
						stms[stmC] = {
							targets: [],
							sources: []
                        }
					};
					if ( oid===res.id ) {
						stms[stmC].sources.push( sid )
					} 
					else {
						stms[stmC].targets.push( oid )
					}
				}
            };
            return stms
        }

        /**
         * Checks if the ie 11 or lower is used
         * @returns {boolean} true if ie es 11 or lower else false
         */
        function isIE() {
            let ua = window.navigator.userAgent;
            let msie = ua.indexOf("MSIE ");
            return msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./);
        }
	};
    return {init: init};
});
