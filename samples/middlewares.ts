import { Middleware, Request, Router } from '../'

// Creates our middleware
class MyMiddleware extends Middleware {
  public static async beforeHandle (request : Request, routeData : any) {
    console.log('Hi from my custom middleware!')
    return { thisUrlIs: `//${request.hostname}${request.path}`, hello: 'world' }
  }
}

// Registers into the router, the data will be made available under the variable internal.custom
Router.use(MyMiddleware, 'custom')

// Setup a basic route
Router.on('GET', '/*', async ({ internal, response } : { request : any, internal : any, response : any }) => {
  return response(internal)
})

// Starts server
require('http').createServer(Router.handle).listen(8080)