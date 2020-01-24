import { Request, Middleware } from './'

import * as http from 'http'

class Router {
  // The routing table for every HTTP method
  private static routingTable : { [key: string ]: Array<Object> } = { }

  // For use with middlewares
  private static middlewares : Array<{ key : string, class: typeof Middleware }> = []

  // Prefix of the router. Will be *excluded* from the front of URLs
  public static prefix : string = ''

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
   * Removes the prefix from the route path
   * @param path The current path
   */
  public static getNonPrefixedRoute (path : string) {
    // Checks if the prefix matches first
    if (path.substr(0, Router.prefix.length) != Router.prefix) return false

    // Returns the non-prefixed route
    let newPath = path.substr(Router.prefix.length)
    return (newPath[0] == '/') ? newPath : '/' + newPath
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
      req, res, ready: async (request : Request) => {
        // The data output by any middleware
        let middlewareData : any = { }

        // Router.middlewares.beforeRoute
        middlewareData = await Router.handleMiddlewares(middlewareData, async mw => await mw.beforeRoute(request))

        // Finds the correct endpoint
        let routePath = Router.getNonPrefixedRoute(request.path)

        // If false (prefix didn't match) return 404
        if (false == routePath) return request.response('Invalid endpoint.', 404)

        // Fetches the correct route
        let route = Router.fetchRequestRoute(request.method, routePath)

        // If route is null, throw a 404
        if (null == route) return request.response('Invalid endpoint.', 404)

        // Creates the route data being passed
        let routeData : {
          request: Request,
          internal: any,
          response: Function,
          params: any
        } = {
          request: request,
          internal: middlewareData,
          response: function Response(data: any, status?: number) { return request.response.call(request, data, status) },
          params: route.params,
        }

        // Router.middlewares.beforeHandle
        middlewareData = await Router.handleMiddlewares(middlewareData, async mw => await mw.beforeHandle(request, routeData))

        // Update internal with correct middleware data
        routeData.internal = middlewareData

        // Invokes the callback
        let altResponse = await route.callback(routeData)

        // In case the response wasn't sent, force send the value returned by callback
        if (!res.finished) return request.response(altResponse)
    } })
  }

  /**
   * Adds a middleware to the processing stack
   * @param middleware The middleware class being used
   * @param id The key that will be used for any data generated by the middleware
   */
  public static use (middleware : typeof Middleware, id? : string) {
    // Adds to middleware stack
    Router.middlewares.push({
      key: id || '',
      class: middleware
    })
  }

  /**
   * Handles a middleware stack
   * @param mwData The data being passed from middlewares
   * @param handler The function to which the middleware will be passed
   */
  private static async handleMiddlewares (mwData : any, handler : (mw : typeof Middleware) => { }) {
    // Loops through every middleware
    for (let iMiddleware in Router.middlewares) {
      // Runs the main function
      let mwKey: string = Router.middlewares[iMiddleware].key
      let mwOutput = await handler(Router.middlewares[iMiddleware].class)

      // Saves the data if an key/ID was provided
      if (mwKey.length > 0) mwData[mwKey] = Object.assign(mwData[mwKey] || { }, mwOutput)
    }

    // Finished, returns the new data
    return mwData
  }
}

export default Router