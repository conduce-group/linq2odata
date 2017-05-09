"use strict";
exports.__esModule = true;
var ODataProvider = (function () {
    function ODataProvider() {
        this.queryResource = [];
    }
    ODataProvider.prototype.get = function () {
        return this.getFrom(this.getQuery());
    };
    ODataProvider.prototype.getQuery = function () {
        var query = "";
        if (this.queryResource.length > 0)
            query = "?";
        for (var index = 0; index < this.queryResource.length; index++) {
            if (index != 0)
                query += "&";
            query += this.queryResource[index];
        }
        return query;
    };
    ODataProvider.prototype.filter = function (filterQuery) {
        this.queryResource.push("filter=" + filterQuery);
    };
    ODataProvider.prototype.top = function (topQuery) {
        this.queryResource.push("top=" + topQuery);
    };
    return ODataProvider;
}());
exports.ODataProvider = ODataProvider;
