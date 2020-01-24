import { Router } from '../'

Router.on('GET', '/path/{subpath:*}', ({ request, response, params }: { request: any, response: any, params: any }) => {
  response(`You looked for subpath: '${params.subpath}'. The complete path is '${request.pathname}'. `)
})

Router.on('GET', '/{name:[A-z\-]+}', ({ response, params } : { response: any, params: any }) => {
  response('Hello, this is ' + params.name)
})

Router.on('GET', '/{id:[0-9]+}', ({ response, params } : { response: any, params: any }) => {
  response('Hello, this is ID ' + params.id)
})

Router.on('GET', '/404', ({ request, response, params }) => {
  response({ message: 'This is a JSON 404' }, 404)
})

require('http').createServer(Router.handle).listen(8080)