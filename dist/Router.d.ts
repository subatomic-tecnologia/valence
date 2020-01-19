/// <reference types="node" />
import * as http from 'http';
declare class Router {
    private static routingTable;
    /**
     * Creates keyed regex that can be processed by the request handler during runtime
     * @param markup The markup-based path string for the route
     */
    private static createRegexFromRouteMarkup;
    /**
     * Fetches the correct route and processes the URL parameters for it
     * @param method The HTTP method in use
     * @param path The HTTP path we're using
     */
    private static fetchRequestRoute;
    /**
     * Registers an event handler for a combination of HTTP method and path
     * @param method The HTTP method
     * @param path  The path
     * @param callback The function that should be called
     */
    static on(method: string, path: string, callback: Function): typeof Router;
    static handle(req: http.IncomingMessage, res: http.ServerResponse): void;
}
export default Router;
