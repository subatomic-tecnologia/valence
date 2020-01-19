/// <reference types="node" />
import * as http from 'http';
declare class Request {
    private requestStream;
    private responseStream;
    bodyString: Object;
    body: {
        [key: string]: any;
    };
    constructor({ req, res, ready }: {
        req: http.IncomingMessage;
        res: http.ServerResponse;
        ready: Function;
    });
    /**
     * Returns the response with an optional status code
     *
     * @param {Object} body The HTTP response (if provided as `Number`, will be considered a status code!)
     * @param {Number} status The HTTP status
     * @return {String} The current class name.
     */
    respond(body: any, status: number): http.ServerResponse | undefined;
}
export default Request;
