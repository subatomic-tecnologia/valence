import * as http from 'http'

class Request {
  // Initialize our private properties
  private requestStream : http.IncomingMessage
  private responseStream : http.ServerResponse

  // The body of our request
  bodyBuffer : Uint8Array
  body : { [key: string]: any }

  constructor({ req, res, ready } : { req: http.IncomingMessage, res: http.ServerResponse, ready: Function }) {
    this.requestStream = req
    this.responseStream = res

    // Initializes the body
    this.bodyBuffer = new Uint8Array()
    this.body = { }

    // Whenever there's body info, read it
    this.requestStream.on('readable', () => {
      // Extracts the data buffer
      let dataBuffer : Buffer = this.requestStream.read()

      // Should not be null
      if (null == dataBuffer) return

      // Create our new body buffer
      let newBodyBuffer = new Uint8Array(this.bodyBuffer.length + dataBuffer.length)
      
      // Sets both buffers to the new buffer
      newBodyBuffer.set(this.bodyBuffer, 0)
      newBodyBuffer.set(dataBuffer, this.bodyBuffer.length)

      // Replaces the buffer
      this.bodyBuffer = newBodyBuffer
    })

    // When ready, we'll parse the body and callback the ready function
    this.requestStream.on('end', async () => {
      // Converts into a Node.js binary buffer in case we need it later
      this.bodyBuffer = Buffer.from(this.bodyBuffer)

      // Parses the body
      await this.bodyParse()

      console.log(this.body)

      // Triggers callback if response wasn't sent yet
      if (!this.responseStream.finished)
        ready()
    })
  }

  /**
   * Triggers HTTP body processing
   */
  private async bodyParse () {
    // Extracts the current request Content-Type header
    let requestContentType = this.requestStream.headers['content-type'] || null

    // If null, skip.
    if (null == requestContentType) return

    // Custom processing here
    switch (requestContentType.toLowerCase()) {

      // JSON => application/json
      case 'application/json':
        try {
          // Processes as JSON
          this.body = JSON.parse(this.bodyBuffer.toString())
        } catch (e) {
          // Problem parsing the JSON, responds with a 400 Bad Request
          return this.respond('Bad Request', 400)
        }
        break

      // FORM => application/x-www-form-urlencoded
      case 'application/x-www-form-urlencoded':
        // Split all & as different parameters
        let bodyUrlParams = this.bodyBuffer.toString().split('&')

        // Processes them
        bodyUrlParams.map(param => {
          // Extracts key and value
          let key = decodeURI(param.split('=')[0])
          let value = decodeURI(param.split('=')[1])

          // Sets into the body
          this.body[key] = value
        })
        break
        
      // Defaults as a log message and 400 Bad Request
      default:
        console.log('Unknown request Content-Type:', requestContentType)
        console.log(this.bodyBuffer.toString())
        return this.respond('Bad Request', 400)
        break
    }
  }

  /**
   * Returns the response with an optional status code
   *
   * @param {Object} body The HTTP response body
   * @param {Number} status The HTTP status
   * @return {String} The current class name.
   */
  respond (body : any, status : number) {
    // If we don't have a status, assume it as 200
    if (!status)
      status = 200

    // Sends status code
    this.responseStream.statusCode = status

    // Finishes response
    this.responseStream.end(body)
  }
}

export default Request