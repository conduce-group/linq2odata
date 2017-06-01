"use strict";
exports.__esModule = true;
var ODataProvider = (function () {
    function ODataProvider() {
        this.queryResource = [];
    }
    ODataProvider.prototype.get = function () {
        return this.getFromQuery(this.getQuery());
    };
    ODataProvider.prototype.getQuery = function () {
        var query = "";
        if (this.queryResource.length > 0) {
            query = "?";
        }
        for (var index = 0; index < this.queryResource.length; index++) {
            if (index != 0) {
                query += "&";
            }
            query += this.queryResource[index];
        }
        this.queryResource = [];
        return query;
    };
    ODataProvider.prototype.filter = function (filterQuery) {
        this.queryResource.push("$filter=" + filterQuery);
        return this;
    };
    ODataProvider.prototype.top = function (topQuery) {
        this.queryResource.push("$top=" + topQuery);
        return this;
    };
    ODataProvider.prototype.skip = function (skipQuery) {
        this.queryResource.push("$skip=" + skipQuery);
        return this;
    };
    ODataProvider.prototype.count = function () {
        this.queryResource.push("$count=true");
        return this;
    };
    ODataProvider.prototype.orderby = function (field) {
        this.queryResource.push("$orderby=" + field);
        return this;
    };
    return ODataProvider;
}());
exports.ODataProvider = ODataProvider;
