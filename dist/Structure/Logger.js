"use strict";
exports.__esModule = true;
var Logger = (function () {
    function Logger(inLevel) {
        this.logLevel = inLevel ? inLevel : 0;
    }
    Logger.prototype.info = function (msg) {
        if (this.logLevel >= 1) {
            console.log(msg);
        }
    };
    Logger.prototype.debug = function (msg) {
        if (this.logLevel >= 2) {
            console.log(msg);
        }
    };
    return Logger;
}());
exports.Logger = Logger;
