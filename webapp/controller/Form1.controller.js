sap.ui.define([
    "sap/ui/core/mvc/Controller", "sap/m/MessagePopover", "sap/m/MessagePopoverItem"
], function(Controller, MessagePopover, MessagePopoverItem) {
    "use strict";
    return Controller.extend("bapiWarning.controller.Form1", {
        /**
         * init
         */
        onInit: function() {
            this._oModel = this.getOwnerComponent().getModel();
            this._oModel.getMetaModel().loaded().then(function() {
                let sPath = "/" + this._oModel.createKey("MyEntity", {
                    Key1: 'PI'
                });

                this.getView().bindElement(sPath);
            }.bind(this));

            this.getView().setModel(sap.ui.getCore().getMessageManager().getMessageModel(), "message");
            this._oMessagePopover = new MessagePopover({});
        },

        /**
         * input field change event handler
         */
        onField1Change: function() {
            this._oModel.submitChanges();
        },

        /**
         * on messagepopover button pressed
         * @param {object} oEvent Event
         */
        openMessagePopover: function(oEvent) {
            this._oMessagePopover.openBy(oEvent.getSource());
        }
    });
});