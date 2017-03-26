sap.ui.define(["sap/ui/base/Object"],
    function(BaseObject) {
        "use strict";
        /* eslint-env es6 */
        return BaseObject.extend("bapiWarning.localService.MockRequests", {
            sEntitySetName: "MyEntity",
            constructor: function(oMockServer) {
                this._oMockServer = oMockServer;
            },

            /**
             * get custom mock request
             * @return {array} list of cutom requests
             */
            getRequests: function() {
                return [this._mockChangeMyEntity()];
            },

            /**
             * mock request for MERGE MyEntity
             * @return {object} callback if regex is met
             */
            _mockChangeMyEntity: function() {
                return {
                    method: "MERGE",
                    path: new RegExp("(" + this.sEntitySetName + ")\\(([^/\\?#]+)\\)/?(.*)?"),
                    response: function(oXhr, sEntitySetName, sKey, sNavName) {
                        const sField = "Field1";
                        let iResponse = 400;
                        let oHeaders;
                        let oBody;

                        // MERGE with existing entry
                        let oEntity = Object.assign(this._getMyEntity(sKey.replace(/'/g, "")), JSON.parse(oXhr.requestBody));

                        // get the messages
                        let aMessages = this._getMessages(oEntity, sField, oEntity.ThrowException ? "Body" : "Header");

                        // determine the leading message (one highlighted on field) from message severity
                        const sType = this._highestSeverityMessage(aMessages);
                        let oLeadingMessage = aMessages.find(oMessage => oMessage.severity === sType);

                        if (!oEntity.ThrowException) {
                            iResponse = 204;
                            // serialize the messages to the http header "sap-messages"
                            oHeaders = this._serializeHeader(aMessages, oLeadingMessage);
                            oBody = JSON.stringify({
                                d: []
                            });

                            //update mockdata with new values
                            let oMockdata = this._oMockServer._oMockdata[sEntitySetName];
                            let iIndex = oMockdata.findIndex(o => o.Key1 === oEntity.Key1);
                            if (iIndex > -1) {
                                jQuery.extend(oMockdata[iIndex], oEntity);
                            }
                        } else {
                            // serialize the exception to response body
                            oBody = this._serializeBody(aMessages, oLeadingMessage);
                        }
                        oXhr.respondJSON(iResponse, oHeaders, oBody);
                        return true; //stop further processing
                    }.bind(this)
                };
            },

            /**
             * @param   {string}   sKey1  entity key
             * @returns {Object}   entity
             */
            _getMyEntity: function(sKey1) {
                const fnFilter = oEntity => oEntity.Key1 === sKey1;
                return this._oMockServer.getEntitySetData(this.sEntitySetName).filter(fnFilter)[0] || undefined;
            },

            /**
             * serialize the messages for inserting into response header
             * @param {array} aMessages messages
             * @param {object} oLeadingMessage leading menssage
             * @returns {object}    header object
             */
            _serializeHeader: function(aMessages, oLeadingMessage) {
                // remove leading message from the messages
                let iIndex = aMessages.findIndex(o => o === oLeadingMessage);
                aMessages.splice(iIndex, 1);

                oLeadingMessage["details"] = aMessages;
                return { "sap-message": JSON.stringify(oLeadingMessage) };
            },

            /**
             * serialize the messages for inserted into the response body after and exception is thrown
             * @param {array} aMessages messages
             * @param {object} oLeadingMessage leading menssage
             * @return {Object}  object of messages formatted for body
             */
            _serializeBody: function(aMessages, oLeadingMessage) {
                let oError = {
                    "code": oLeadingMessage["code"],
                    "message": {
                        "lang": "en",
                        "value": oLeadingMessage["message"]
                    },
                    "innererror": { "errordetails": aMessages }
                };
                return { "error": oError };
            },

            /**
             * determine the message with the highest severity
             * @param {array} aMessages arrary of aMessages
             * @return {string} the highest severity found
             */
            _highestSeverityMessage: function(aMessages) {
                const aPriority = ["error", "warning", "info", "success"];
                return aPriority.find(sPriority => aMessages.some(o => o.severity === sPriority));
            },

            /**
             * get messages
             * @param {oject} oEntity Entity
             * @param {string} sField Field name
             * @param {string} sOrigin body or header
             * @returns {array} list of message
             */
            _getMessages: function(oEntity, sField, sOrigin) {
                // severity that can be shown in sap.m.Input
                const aShowTarget = ["error", "warning"];

                // get context mapping from entity metadata - eg /MyEntity('Key') + /Field1
                const sTargetField = oEntity.__metadata.uri.match(/\/(?:.(?!\/))+$/)[0] + "/" + sField;

                // toggle fields
                const aFields = ["ShowWarning", "ShowInfo", "ShowSuccess", "ShowError"];
                const fnFilterTrueValues = sField => oEntity[sField] === true;
                const fnMapFields = sField => sField.replace(/Show/g, "").toLowerCase();
                let aMessageTypes = aFields.filter(fnFilterTrueValues).map(fnMapFields);

                // map message object
                const fnMapMessageTypes = sType => {
                    let sTarget = aShowTarget.indexOf(sType) > -1 ? sTargetField : undefined;
                    let sMessage = sOrigin + " : " + sType.charAt(0).toUpperCase() + sType.slice(1) + " from Mockserver - " + oEntity[sField];
                    return { "code": "00/003", "severity": sType, "target": sTarget, "message": sMessage };
                };

                // return an array of messages
                return aMessageTypes.map(fnMapMessageTypes);
            }
        });
    });