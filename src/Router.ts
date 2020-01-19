import Request from './Request'
import * as http from 'http'

class Router {
  private static routingTable : { [key: string ]: Array<Object> } = { }

  /**
   * Creates keyed regex that can be processed by the request handler during runtime
   * @param markup The markup-based path string for the route
   */
  private static createRegexFromRouteMarkup (markup : string) {
    // The main regex for finding markups
    const markupRegexMain = /\{(.*?)\}/gi

    // Processes the markup with a few basic replaces
    let finalRegex = markup.replace(/\//g, '\\/')

    // Creates the mapping of our regex and our keys
    let mapping : Array<string> = []

    // Gets all the markups present in our path
    let markupEntry = null
    while (markupEntry = markupRegexMain.exec(markup)) {
      // Extracts only the contents of the entry
      let markupEntryData = markupEntry[1]

      // Initialize all properties
      let entryKey = markupEntryData
      let entryRegex = '.*'

      // Checks if we're using an advanced key:regex pattern
      if (~markupEntryData.indexOf(':')) {
        // Splits the data of the pattern
        const markupEntryDataSplitted = markupEntryData.split(':')

        // Checks if we have two parameters
        if (markupEntryDataSplitted.length < 2) throw `Invalid format for expression: ${markupEntryData}`

        // Applies new parameters
        entryKey = markupEntryDataSplitted[0]
        entryRegex = markupEntryDataSplitted[1]
      }

      // Finishes off the expression
      mapping.push(entryKey)

      // Replace in the source
      finalRegex = finalRegex.replace(markupEntry[0], `(${entryRegex})`) + '.*'
    }

    // Returns our finished regex with the keys
    return {
      regex: new RegExp(finalRegex),
      regexString: finalRegex,
      keys: mapping
    }
  }

  /**
   * Fetches the correct route and processes the URL parameters for it
   * @param method The HTTP method in use
   * @param path The HTTP path we're using
   */
  private static fetchRequestRoute (method: string, path: string) {
    // Makes method lowercase
    method = method.toLowerCase()

    // Extracts the routing table for the selected method
    let routingTable = Router.routingTable[method]

    // If it's invalid, return null
    if (null == routingTable) return null

    // Sorts the routing table from the largest entry to smallest one
    routingTable = routingTable.sort((a : any, b: any) => {
      if (a.regexString.length > b.regexString.length) return -1
      if (a.regexString.length < b.regexString.length) return 1
      return 0
    })

    // Loops through the entries on the routing table trying to match them against the 
    let route : any = null
    for (let iEntry = 0; iEntry < routingTable.length; iEntry++) {
      // Extracts the route for current entry
      route = routingTable[iEntry]

      // Runs the regex
      let routeParamsRaw = route.regex.exec(path)

      // Did it match?
      if (null != routeParamsRaw) {
        // Checks the lengths (they MUST match)
        if (route.keys.length != routeParamsRaw.length - 1) continue

        // Let's key them!
        let routeParams : { [key: string]: string } = { }
        
        // For each of our new parameters...
        for (let iKey = 0; iKey < route.keys.length; iKey++) {
          // Set them to the parameters object
          routeParams[route.keys[iKey]] = routeParamsRaw[iKey + 1]
        }

        // Returns the processed URL
        return {
          ...route,
          params: routeParams
        }
      }
    }

    // Returns null if everything fails
    return null
  }

  /**
   * Registers an event handler for a combination of HTTP method and path
   * @param method The HTTP method
   * @param path  The path
   * @param callback The function that should be called
   */
  public static on (method : string, path : string, callback : Function) {
    // Makes method lowercase
    method = method.toLowerCase()

    // Initializes the routing table method entry if required
    if (!Router.routingTable[method]) Router.routingTable[method] = []

    // Pushes our new object there
    Router.routingTable[method].push({
      ...Router.createRegexFromRouteMarkup(path),
      callback: callback
    })

    // Returns self for chaining
    return this
  }

  // Handles the Node.js native request
  public static handle (req : http.IncomingMessage, res : http.ServerResponse) {
    // Creates a new internal request object
    const request = new Request({
      req, res, ready: async () => {
        // Finds the correct endpoint
        let route = Router.fetchRequestRoute(req.method || 'GET', req.url || '/')

        // If route is null, throw a 404
        if (null == route) return request.respond('Invalid endpoint.', 404)

        // Invokes the callback
        let altResponse = await route.callback({
          request: request,
          params: route.params
        })

        // In case the response wasn't sent, force send the value returned by callback
        if (!res.finished) return request.respond(altResponse, 404)
    } })
  }
}

export default Router