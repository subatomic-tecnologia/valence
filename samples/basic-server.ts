import { Router } from '../'

Router.on('GET', '/', ({ response }: { response: any }) => {
  response({ hello: 'world' })
})

require('http').createServer(Router.handle).listen(8080)