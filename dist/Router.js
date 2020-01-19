"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var Request_1 = require("./Request");
var Router = /** @class */ (function () {
    function Router() {
    }
    /**
     * Creates keyed regex that can be processed by the request handler during runtime
     * @param markup The markup-based path string for the route
     */
    Router.createRegexFromRouteMarkup = function (markup) {
        // The main regex for finding markups
        var markupRegexMain = /\{(.*?)\}/gi;
        // Processes the markup with a few basic replaces
        var finalRegex = markup.replace(/\//g, '\\/');
        // Creates the mapping of our regex and our keys
        var mapping = [];
        // Gets all the markups present in our path
        var markupEntry = null;
        while (markupEntry = markupRegexMain.exec(markup)) {
            // Extracts only the contents of the entry
            var markupEntryData = markupEntry[1];
            // Initialize all properties
            var entryKey = markupEntryData;
            var entryRegex = '.*';
            // Checks if we're using an advanced key:regex pattern
            if (~markupEntryData.indexOf(':')) {
                // Splits the data of the pattern
                var markupEntryDataSplitted = markupEntryData.split(':');
                // Checks if we have two parameters
                if (markupEntryDataSplitted.length < 2)
                    throw "Invalid format for expression: " + markupEntryData;
                // Applies new parameters
                entryKey = markupEntryDataSplitted[0];
                entryRegex = markupEntryDataSplitted[1];
            }
            // Finishes off the expression
            mapping.push(entryKey);
            // Replace in the source
            finalRegex = finalRegex.replace(markupEntry[0], "(" + entryRegex + ")") + '.*';
        }
        // Returns our finished regex with the keys
        return {
            regex: new RegExp(finalRegex),
            regexString: finalRegex,
            keys: mapping
        };
    };
    /**
     * Fetches the correct route and processes the URL parameters for it
     * @param method The HTTP method in use
     * @param path The HTTP path we're using
     */
    Router.fetchRequestRoute = function (method, path) {
        // Makes method lowercase
        method = method.toLowerCase();
        // Extracts the routing table for the selected method
        var routingTable = Router.routingTable[method];
        // If it's invalid, return null
        if (null == routingTable)
            return null;
        // Sorts the routing table from the largest entry to smallest one
        routingTable = routingTable.sort(function (a, b) {
            if (a.regexString.length > b.regexString.length)
                return -1;
            if (a.regexString.length < b.regexString.length)
                return 1;
            return 0;
        });
        // Loops through the entries on the routing table trying to match them against the 
        var route = null;
        for (var iEntry = 0; iEntry < routingTable.length; iEntry++) {
            // Extracts the route for current entry
            route = routingTable[iEntry];
            // Runs the regex
            var routeParamsRaw = route.regex.exec(path);
            // Did it match?
            if (null != routeParamsRaw) {
                // Checks the lengths (they MUST match)
                if (route.keys.length != routeParamsRaw.length - 1)
                    continue;
                // Let's key them!
                var routeParams = {};
                // For each of our new parameters...
                for (var iKey = 0; iKey < route.keys.length; iKey++) {
                    // Set them to the parameters object
                    routeParams[route.keys[iKey]] = routeParamsRaw[iKey + 1];
                }
                // Returns the processed URL
                return __assign(__assign({}, route), { params: routeParams });
            }
        }
        // Returns null if everything fails
        return null;
    };
    /**
     * Registers an event handler for a combination of HTTP method and path
     * @param method The HTTP method
     * @param path  The path
     * @param callback The function that should be called
     */
    Router.on = function (method, path, callback) {
        // Makes method lowercase
        method = method.toLowerCase();
        // Initializes the routing table method entry if required
        if (!Router.routingTable[method])
            Router.routingTable[method] = [];
        // Pushes our new object there
        Router.routingTable[method].push(__assign(__assign({}, Router.createRegexFromRouteMarkup(path)), { callback: callback }));
        // Returns self for chaining
        return this;
    };
    // Handles the Node.js native request
    Router.handle = function (req, res) {
        var _this = this;
        // Creates a new internal request object
        var request = new Request_1.default({
            req: req, res: res, ready: function () { return __awaiter(_this, void 0, void 0, function () {
                var route, altResponse;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            route = Router.fetchRequestRoute(req.method || 'GET', req.url || '/');
                            console.log(route, req.method, req.url);
                            // If route is null, throw a 404
                            if (null == route)
                                return [2 /*return*/, request.respond('Invalid endpoint.', 404)
                                    // Invokes the callback
                                ];
                            return [4 /*yield*/, route.callback({
                                    request: request,
                                    params: route.params
                                })
                                // In case the response wasn't sent, force send the value returned by callback
                            ];
                        case 1:
                            altResponse = _a.sent();
                            // In case the response wasn't sent, force send the value returned by callback
                            if (!res.finished)
                                return [2 /*return*/, request.respond(altResponse, 404)];
                            return [2 /*return*/];
                    }
                });
            }); }
        });
    };
    Router.routingTable = {};
    return Router;
}());
exports.default = Router;
