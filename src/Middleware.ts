import { Request } from './'

abstract class Middleware {
  /**
   * Runs before the Router finds any routes
   */
  public static async beforeRoute (request : Request) : Promise<{}> { return { } }

  /**
   * Runs before the handle of a found route
   */
  public static async beforeHandle (request : Request, routeData : any) : Promise<{}> { return { } }
}

export default Middleware