import * as http from 'http'

class Request {
  // Initialize our private properties
  private requestStream : http.IncomingMessage
  private responseStream : http.ServerResponse

  // The body of our request
  bodyString : Object
  body : { [key: string]: any }

  constructor({ req, res, ready } : { req: http.IncomingMessage, res: http.ServerResponse, ready: Function }) {
    this.requestStream = req
    this.responseStream = res

    // Initializes the body
    this.bodyString = ''
    this.body = { }

    // Whenever there's body info, read it
    this.requestStream.on('readable', () => {
      this.bodyString += this.requestStream.read()
    })

    // When ready, we'll parse the body and callback the ready function
    this.requestStream.on('end', () => {
      // Triggers callback
      ready()
    })
  }

  /**
   * Returns the response with an optional status code
   *
   * @param {Object} body The HTTP response (if provided as `Number`, will be considered a status code!)
   * @param {Number} status The HTTP status
   * @return {String} The current class name.
   */
  respond (body : any, status : number) {
    // If we don't have body and status, return the raw response stream
    if (!body && !status) {
      return this.responseStream
    }

    // If we don't have a status, assume it as 200
    if (!status) {
      status = 200

      // If our "body" is a number, use it as status
      if ('number' == typeof body) {
        status = body
        body = ''
      }
    }

    // Sets headers and statuses
    this.responseStream.setHeader('Status', status)

    // Finishes response
    this.responseStream.end(body)
  }
}

export default Request