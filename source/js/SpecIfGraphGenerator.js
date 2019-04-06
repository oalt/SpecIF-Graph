/**
 * Created by baetz on 27.04.2017.
 * Updated by se@enso-managers.de on 2018-03-14
 * Accepts data-sets according to v0.10.4 or v0.11.2 and later.
 * Ported to TypeScript by Dr. Oliver Alt
 */
var SpecIfGraphGenerator = /** @class */ (function () {
    function SpecIfGraphGenerator() {
        this.nodesData = [];
        this.edgeData = [];
    }
    SpecIfGraphGenerator.prototype.init = function (specifData, opts) {
        this.specifData = specifData;
        this.opts = opts;
        //console.debug('init input',specifData,opts);
        // Accepts data-sets according to v0.10.4 or v0.11.2 and later.
        // Check for missing options:
        if (!opts || !opts.canvas)
            return;
        if (!opts.index || opts.index > specifData.resources.length - 1)
            opts.index = 0;
        if (!opts.titleProperties)
            opts.titleProperties = [];
        if (!opts.lineLength)
            opts.lineLength = 22;
        if (!opts.focusColor)
            opts.focusColor = '#6ca0dc';
        if (!opts.nodeColor)
            opts.nodeColor = '#afcbef';
        if (!opts.edgeColor)
            opts.edgeColor = 'black';
        if (!opts.clusterColor)
            opts.clusterColor = '#c3daf6';
        // All required parameters are available, so we can begin:
        var relations = this.collectStatementsByType(specifData.resources[opts.index]);
        //		console.debug('init relations',relations);
        // if there are no relations, do not create a graph:
        if (!relations)
            return;
        this.nodesData = [];
        this.edgeData = [];
        var relProp = this.countRelationTypesAndEdges(relations);
        var idx = this.pushMainNode(specifData.resources[opts.index]); // returns always 1
        for (var entry in relations) {
            // an iteration per relation type,
            // first the inbound relations, i.e. where the node in focus is target:
            if (relations.hasOwnProperty(entry) && relations[entry].sources.length) {
                idx = this.pushChildNodesAndEdges(idx, relations[entry].sources, relProp, true);
            }
        }
        for (var entry in relations) {
            // an iteration per relation type,
            // then the outbound relations, i.e. where the node in focus is source:
            if (relations.hasOwnProperty(entry) && relations[entry].targets.length) {
                idx = this.pushChildNodesAndEdges(idx, relations[entry].targets, relProp, false);
            }
        }
        //		console.debug('rawData',nodesData,edgeData);
        var nodes = new vis.DataSet(this.nodesData);
        var edges = new vis.DataSet(this.edgeData);
        var container = document.getElementById(opts.canvas);
        var data = {
            nodes: nodes,
            edges: edges
        };
        var options = {
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
                smooth: true
            },
            manipulation: {
                "enabled": false
            },
            physics: {
                enabled: false
            }
        };
        var network = new vis.Network(container, data, options);
        // Collapse/close a 'large' sub-network:
        // see https://github.com/GfSE/SpecIF-Graph/blob/master/source/js/graph.js
        for (var _i = 0, _a = network.getConnectedNodes("0"); _i < _a.length; _i++) {
            var connectedNode = _a[_i];
            var neighbours = network.getConnectedNodes(connectedNode);
            if (neighbours.length > 5) {
                this.closeCluster(connectedNode, network);
            }
        }
        //		network.on("doubleClick", function (prms) {
        ////			console.debug("doubleClick",prms);
        //			if (prms.nodes.length === 1) {
        //				if( prms.nodes[0] == 0 ) return;  // no action for the node in focus
        //				if( !isIE() && 
        //					(typeof(opts.onDoubleClick)==="function") &&
        //					network.getConnectedNodes(prms.nodes[0]).length === 1 &&
        //					!network.clustering.isCluster(prms.nodes[0])) {
        //					// it is a peripheral node with a single edge,
        //					// extract the node-id from 'n:m=id':
        //					let nId = prms.nodes[0].match(/.+=([\S]+)/)[1];
        //					opts.onDoubleClick({target:{resource:nId,statement:prms.edges[0]}});
        //					return
        //				};
        //				if (typeof(prms.nodes[0])==="string" && prms.nodes[0].includes(":")) {
        //					if (!network.clustering.isCluster(prms.nodes[0]))
        //						return;
        //				};
        //				// else, open or close the cluster depending in its state:
        //				if (network.clustering.isCluster(prms.nodes[0])) {
        //					let releaseOptions = {
        //						releaseFunction: function (clusterPosition, containedNodesPositions) {
        //							let newPositions = {};
        //							let dist, offset;
        //							let i = 0;
        //							let length = Object.keys(containedNodesPositions).length - 1;
        //							for(let id in containedNodesPositions) {
        //								if (containedNodesPositions.hasOwnProperty(id)) {
        //									if (id === "0" || (!containedNodesPositions["0"] && !id.search(":"))) {
        //										newPositions[id] = {x: clusterPosition.x, y: clusterPosition.y};
        //										if (id !== "0") {
        //											offset = Math.atan(clusterPosition.y / clusterPosition.x);
        //											if (clusterPosition.x < 0) offset += Math.PI;
        //											dist = 160;
        //										}
        //									} 
        //									else {
        //										newPositions[id] = calculateNodePosition(
        //											i,
        //											Math.sqrt(2)*Math.PI, 
        //											length,
        //											clusterPosition,
        //											dist,
        //											offset);
        //										i++
        //									}
        //								}
        //							};
        //							return newPositions
        //						}
        //					};
        //					network.clustering.openCluster(prms.nodes[0], releaseOptions)
        //				} 
        //				else {
        //					closeCluster(prms.nodes[0], network);
        //				}
        //			}
        //		});
    }; // we're done ...
    /**
     * This function closes a given cluster
     * @param node A node that is a cluster
     * @param network the network the node is part of
     */
    SpecIfGraphGenerator.prototype.closeCluster = function (node, network) {
        if (node === 0) {
            for (var _i = 0, _a = network.getConnectedNodes("0"); _i < _a.length; _i++) {
                var connectedNode = _a[_i];
                this.closeCluster(connectedNode, network);
            }
        }
        var options = {
            joinCondition: function (nodeOptions, childNode) {
                return childNode.id !== 0;
            },
            clusterNodeProperties: {
                label: "",
                color: this.opts.clusterColor,
                shape: "diamond"
            }
        };
        network.clustering.clusterByConnection(node, options);
    };
    /**
     * wraps a text after e specific number of chars
     * @param str The String that hast to be wrapped
     * @returns {string} the wrapped string
     */
    SpecIfGraphGenerator.prototype.wrap = function (str, maxLen) {
        if (str.length < maxLen + 1)
            return str;
        // separate title into single words:
        var words = str.match(/[^-\s]+[-\s]{0,}/g), // don't like '*/', even if it is correct and working 
        newLine = '\n', lineLength = 0, part = '', out = '';
        // simple algorithm working quite nicely with words < maxLen/2.
        for (var i = 0; i < words.length; i++) { // re-evaluate words.length every time, as it may grow while looping
            // hyphenate 'long' words:
            if (words[i].length > maxLen) {
                part = words[i].slice(Math.round(words[i].length / 2));
                words.splice(i + 1, 0, part); // insert second part
                words[i] = words[i].slice(0, Math.round(words[i].length / 2)) + '-'; // update first part
            }
            ;
            // combine words to lines with length<maxLen:
            if ((lineLength + words[i].length) < maxLen) {
                out += words[i];
                lineLength += words[i].length;
            }
            else {
                out += newLine + words[i];
                lineLength = words[i].length;
            }
        }
        ;
        return out;
    };
    /**
     * test a char if it is a whitespace
     * @param x the given char as string
     * @returns {boolean}
     */
    SpecIfGraphGenerator.prototype.testWhite = function (x) {
        var white = new RegExp(/^\s$/);
        return white.test(x.charAt(0));
    };
    /**
     * Returns a calculated Position for a given node
     * @param i the index of the node in the list of neighbour nodes of the parent
     * @param count The length of the list of neighbour nodes per half-circle
     * @param parentPos the position of the parent
     * @param dist the preferred distance between the parent node and this node
     * @param offset the offset angle [rad] to start the placement
     * @returns {{x: number, y: number, alpha: number}}
     */
    SpecIfGraphGenerator.prototype.calculateNodePosition = function (i, sector, count, parentPos, dist, offset) {
        var pos = { x: 0, y: 0, alpha: 0 };
        if (!dist)
            dist = 200;
        var r = dist;
        // alternate distance of neighboring nodes:
        r = (i % 2 === 1) ? (r / 1.2) : (r * 1.2);
        var segment = sector / count;
        var alpha = offset - sector / 2 + segment * i + segment / 2;
        pos.x = parentPos.x + r * Math.cos(alpha);
        pos.y = parentPos.y + r * Math.sin(alpha);
        pos.alpha = alpha;
        //			console.debug('calculateNodePosition',i,alpha)
        return pos;
    };
    /**
     * Pushes one child node and edge in the nodesData and edgeData object
     * @param idx The id of the node
     * @param nodesData The nodesData object
     * @param edgeData The childData object
     * @param children Array of all connected child nodes
     * @param rel The edge label
     * @param relProp The relation properties object
     * @param isTarget A bool that represents if it is a object or a subject relationship
     * @returns {*}
     */
    SpecIfGraphGenerator.prototype.pushChildNodesAndEdges = function (idx, children, relProp, inbound) {
        // the number of edges for the current half sector (inbound resp outbound):
        var edges = inbound ? relProp.sources : relProp.targets;
        // the index for the relations in the current sector:
        var sectorIdx = idx - (inbound ? 0 : relProp.sources) - 1;
        // position the inbound relation to the upper left side,
        // and the outbound to the lower right.
        // zero degrees is to the 'east', so inbound come from north-west and outbound go to south-east.
        var offs = inbound ? (Math.PI * 1.25) : (Math.PI * 0.25);
        //			console.debug('push',relG,children,inbound)
        if (children.length < 2) {
            // there is a single node related by the same type and same direction,
            // so the node is connected directly:
            var pos = this.calculateNodePosition(sectorIdx, Math.PI, edges, { x: 0, y: 0 }, 240, offs);
            this.pushNodeAndEdge(idx, 0, // node in focus has id==0
            children[0].resource, pos, children[0].statement, inbound);
            idx++;
        }
        else {
            // there are several nodes related by the same type and same direction,
            // so there will be a cluster node:
            var pos = this.calculateNodePosition(sectorIdx, Math.PI, edges, { x: 0, y: 0 }, 300, offs);
            this.pushNodeAndEdge(idx, 0, {}, // cluster node
            pos, { title: children[0].statement.title }, // assuming that all have the same title; don't supply id!
            inbound);
            var childID = 0;
            for (var _i = 0, children_1 = children; _i < children_1.length; _i++) {
                var child = children_1[_i];
                var childPos = this.calculateNodePosition(childID, Math.sqrt(2) * Math.PI, children.length, pos, 160, pos.alpha);
                var childIDString = idx + ":" + childID;
                this.pushNodeAndEdge(childIDString, idx, child.resource, childPos, child.statement, false);
                childID++;
            }
            idx++;
        }
        ;
        return idx;
    };
    /**
     * Finally create and push the child and parent node and edge objects into the nodesData and edgeData object
     * @param id The id of the Parent node(main node or helper node)
     * @param sourceID the id of the subject the arrow comes from
     * @param targetID the id of the traget the arrow goes to
     * @param nodesData The nodeData object
     * @param edgeData The edgeData object
     * @param res The new node (resource) to show
     * @param edgeLabel The edge label
     * @param pos the pos of the new node
     */
    SpecIfGraphGenerator.prototype.pushNodeAndEdge = function (idx, parentId, child, pos, rel, inbound) {
        // include always idx, as the same element can be shown several times and childID must be unique:
        var childId = child.id ? idx + '=' + child.id : idx;
        this.nodesData.push({
            // cluster nodes don't have id nor label:
            id: childId,
            label: child.title ? this.wrap(this.getResourceTitle(child), this.opts.lineLength) : "",
            x: pos.x,
            y: pos.y,
            color: child.id ? this.opts.nodeColor : this.opts.clusterColor,
            shape: child.id ? "box" : "circle"
        });
        // show arrow and label only on edges starting at the node in focus (parentId==0),
        // but not for those in a cluster:
        var edge = {
            from: inbound ? childId : parentId,
            to: inbound ? parentId : childId,
            arrows: parentId == 0 ? "to" : "",
            color: this.opts.edgeColor,
            label: parentId == 0 ? this.getStatementTitle(rel) : "",
            //label: getStatementTitle(rel),
            id: ""
        };
        if (rel.id) {
            edge.id = rel.id;
        }
        this.edgeData.push(edge);
    };
    /**
     * push the Main Node into the nodesData array
     * @param resource = node in Focus
     * @returns {number} next index
     */
    SpecIfGraphGenerator.prototype.pushMainNode = function (res) {
        this.nodesData.push({
            id: 0,
            label: this.wrap(this.getResourceTitle(res), this.opts.lineLength),
            x: 0,
            y: 0,
            color: this.opts.focusColor,
            shape: "box"
        });
        return 1;
    };
    /**
     * If the resource type of a resource has an icon this function returns the icon
     * @param type resource type
     * @returns {string} The resource icon or an empty string
     */
    SpecIfGraphGenerator.prototype.getIconForResourceClass = function (type) {
        if (this.specifData.resourceClasses) {
            for (var i = this.specifData.resourceClasses.length - 1; i > -1; i--) {
                if (this.specifData.resourceClasses[i].id === type) {
                    return this.specifData.resourceClasses[i].icon ? this.xmlChar2utf8(this.specifData.resourceClasses[i].icon) + " " : "";
                }
            }
        }
        return "";
    };
    /**
     * Returns a string representing the title of a resource with the given id.
     * @param id the id of a resource
     * @returns {string} title of the resource with icon, if available
     */
    SpecIfGraphGenerator.prototype.getResourceTitle = function (res) {
        if (res.properties) {
            for (var n = 0; n < res.properties.length; n++) {
                if (this.opts.titleProperties.includes(res.properties[n].title)) {
                    return this.getIconForResourceClass(res['class']) + this.getResourceTypeString(res) + "\r\n" + this.xmlChar2utf8(res.properties[n].value[0].text);
                }
            }
        }
        if (res.title) {
            return this.getIconForResourceClass(res['class']) + this.xmlChar2utf8(res.title);
        }
        else {
            return undefined;
        }
    };
    SpecIfGraphGenerator.prototype.getResourceTypeString = function (resource) {
        var result = "";
        if (resource.properties) {
            for (var n = 0; n < resource.properties.length; n++) {
                if (resource.properties[n].title === "dcterms:type") {
                    result = "[" + resource.properties[n].value[0].text + "]";
                    break;
                }
            }
        }
        if (result === "") {
            result = "[" + resource.class.id + "]";
        }
        return result;
    };
    /**
     * Returns the title for a given statement
     * @param stm the given statement
     * @returns the title of the statement.
     */
    SpecIfGraphGenerator.prototype.getStatementTitle = function (stm) {
        var result = "";
        // Try to get it from a title property:
        if (stm.properties) {
            for (var n = 0; n < stm.properties.length; n++) {
                if (this.opts.titleProperties.includes(stm.properties[n].title)) {
                    var text = this.xmlChar2utf8(stm.properties[n].value[0].text);
                    if (text !== "") {
                        result = text;
                        break;
                    }
                    else {
                        break;
                    }
                }
            }
        }
        ;
        // else, try:
        if (stm.title) {
            result = this.xmlChar2utf8(stm.title);
        }
        // finally, get it from the class:
        if (this.specifData.statementClasses) {
            var i = this.specifData.statementClasses.length;
            while (i--) {
                if (this.specifData.statementClasses[i].id === stm['class']) {
                    result = this.xmlChar2utf8(this.specifData.statementClasses[i].title);
                }
            }
        }
        ;
        if (result === "UML:Relationship") {
            var typeString = "";
            for (var n = 0; n < stm.properties.length; n++) {
                if (stm.properties[n].title === "dcterms:type") {
                    typeString = this.xmlChar2utf8(stm.properties[n].value[0].text);
                    break;
                }
            }
            result += "\r\n" + typeString;
        }
        return result;
    };
    /**
     * Returns the item for the given id
     * @param id the id of the item
     * @returns the item for the id or undefined if there is none
     */
    SpecIfGraphGenerator.prototype.resourceById = function (id) {
        for (var i = this.specifData.resources.length - 1; i > -1; i--) {
            if (this.specifData.resources[i].id === id) {
                return this.specifData.resources[i];
            }
        }
        return undefined;
    };
    SpecIfGraphGenerator.prototype.statementById = function (id) {
        for (var i = this.specifData.statements.length - 1; i > -1; i--) {
            if (this.specifData.statements[i].id === id) {
                return this.specifData.statements[i];
            }
        }
        return undefined;
    };
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
    SpecIfGraphGenerator.prototype.xmlChar2utf8 = function (str) {
        str = str.replace(/&#x([0-9a-fA-F]+);/g, function (match, numStr) {
            return String.fromCharCode(parseInt(numStr, 16));
        });
        return str.replace(/&#([0-9]+);/g, function (match, numStr) {
            return String.fromCharCode(parseInt(numStr, 10));
        });
    };
    /**
     * Returns an object containing two properties:
     * - types is the number of relation types
     * - edges is the number of edges in the future graph
     * If a relation type has both sources and targets, types is 1 and edges is 2.
     * If a relation type has only sources OR targets, types and edges are 1.
     * @param rels The relations object
     * @returns {{types: number, edges: number}}
     */
    SpecIfGraphGenerator.prototype.countRelationTypesAndEdges = function (rels) {
        var cnt = { types: 0, sources: 0, targets: 0 };
        for (var entry in rels) {
            if (rels.hasOwnProperty(entry)) {
                if (rels[entry].targets.length)
                    cnt.targets++;
                if (rels[entry].sources.length)
                    cnt.sources++;
                cnt.types++;
            }
        }
        ;
        //			console.debug('countRelationTypesAndEdges',rels,cnt);
        return cnt;
    };
    /**
     * Returns an object with pattern {relationtype:{targets:[],sources:[]}} containing all targets and sources
     * related to the given resource and sorted by statement types
     * @param object The resource, where the relations are to
     * @returns json object of the statements with titles for statements, subjects and objects
     */
    SpecIfGraphGenerator.prototype.collectStatementsByType = function (res) {
        var stms = {}, oid = null, sid = null;
        for (var counter = 0; counter < this.specifData.statements.length; counter++) {
            var st = this.specifData.statements[counter];
            // SpecIF v0.10.x: subject/object without revision, v0.11.y: with revision
            var objectID = st.object.id || st.object;
            var subjectID = st.subject.id || st.subject;
            if (subjectID === res.id || objectID === res.id) {
                // all statements having the same title are clustered:
                var stmC = this.getStatementTitle(st);
                // all statements having the same class are clustered:
                //let stmC = st['class'].id;
                if (!stms[stmC]) {
                    stms[stmC] = { targets: [], sources: [] };
                }
                if (objectID === res.id) {
                    stms[stmC].sources.push({ resource: this.resourceById(subjectID), statement: st });
                }
                else {
                    stms[stmC].targets.push({ resource: this.resourceById(objectID), statement: st });
                }
            }
        }
        return stms;
    };
    /**
     * Checks if the ie 11 or lower is used
     * @returns {boolean} true if ie es 11 or lower else false
     */
    SpecIfGraphGenerator.prototype.isIE = function () {
        var ua = window.navigator.userAgent;
        var msie = ua.indexOf("MSIE ");
        return msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./);
    };
    return SpecIfGraphGenerator;
}());
//# sourceMappingURL=SpecIfGraphGenerator.js.map