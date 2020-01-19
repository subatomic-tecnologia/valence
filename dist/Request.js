"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Request = /** @class */ (function () {
    function Request(_a) {
        var _this = this;
        var req = _a.req, res = _a.res, ready = _a.ready;
        this.requestStream = req;
        this.responseStream = res;
        // Initializes the body
        this.bodyString = '';
        this.body = {};
        // Whenever there's body info, read it
        this.requestStream.on('readable', function () {
            _this.bodyString += _this.requestStream.read();
        });
        // When ready, we'll parse the body and callback the ready function
        this.requestStream.on('end', function () {
            // Triggers callback
            ready();
        });
    }
    /**
     * Returns the response with an optional status code
     *
     * @param {Object} body The HTTP response (if provided as `Number`, will be considered a status code!)
     * @param {Number} status The HTTP status
     * @return {String} The current class name.
     */
    Request.prototype.respond = function (body, status) {
        // If we don't have body and status, return the raw response stream
        if (!body && !status) {
            return this.responseStream;
        }
        // If we don't have a status, assume it as 200
        if (!status) {
            status = 200;
            // If our "body" is a number, use it as status
            if ('number' == typeof body) {
                status = body;
                body = '';
            }
        }
        // Sets headers and statuses
        this.responseStream.setHeader('Status', status);
        // Finishes response
        this.responseStream.end(body);
    };
    return Request;
}());
exports.default = Request;
