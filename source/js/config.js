/**
 * Created by Marcus Bätz on 13.04.2017.
 */
require.config({
    baseUrl: "",
    paths: {
        "specIF-loader": "js/specIF-loader",
        "specIFData": "js/specIFData",
        "vis": "lib/vis/dist/vis-network.min",
        "jquery": "lib/jquery/dist/jquery.min",
        "graph": "js/graph"
    },

    shim: {
        "jquery": {
            exports: "$"
        }
    }
});