sap.ui.define(["sap/ui/core/util/MockServer", "bapiWarning/localService/MockRequests"],
    function(MockServer, MockRequests) {
        "use strict";
        var _sModulePath = "bapiWarning.localService",
            _serviceURL = "http://vhcalnplci.dummy.nodomain:8000/sap/opu/odata/SAP/ZODATA_VALIDATION_SRV/";

        var _oMockServer;

        return {
            /**
             * Initializes the mock server. You can configure the delay with the URL parameter "serverDelay"
             * The local mock data in this folder is returned instead of the real data for testing.
             *
             * @public
             */

            init: function() {
                var oUriParameters = jQuery.sap.getUriParameters(),
                    sPath = jQuery.sap.getModulePath(_sModulePath);

                _oMockServer = new MockServer({
                    rootUri: _serviceURL
                });

                // configure mock server with a delay of 1s
                MockServer.config({
                    autoRespond: true,
                    autoRespondAfter: oUriParameters.get("serverDelay") || 0
                });

                // load local mock data
                _oMockServer.simulate(sPath + "/metadata.xml", sPath + "/mockdata", false); //false - don't generate missing data


                var oRequests = new MockRequests(_oMockServer);
                var aRequests = _oMockServer.getRequests();
                _oMockServer.setRequests(aRequests.concat(oRequests.getRequests()));
                _oMockServer.start();

                jQuery.sap.log.info("Running the app with mock data");
            },


            /**
             * @public returns the mockserver of the app, should be used in integration tests
             * @returns {sap.ui.core.util.MockServer} the mockserver instance
             */
            getMockServer: function() {
                return _oMockServer;
            }
        };
    });