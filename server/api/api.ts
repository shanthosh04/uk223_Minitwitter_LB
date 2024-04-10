import { Request, Response, Express, Router, json } from 'express'
import { UserController } from './controllers/users'
import { TweetController } from './controllers/tweets'
import jwt from 'jsonwebtoken'

export class API {
  // Properties
  app: Express

  private apiRouter: Router
  
  // Constructor
  constructor(app: Express) {
    this.setupApiRoutes()
    this.app = app
    this.app.use(json())
    
    this.app.use('/api', this.apiRouter)
  }


  // Methods
  private setupApiRoutes(): void {
    this.apiRouter = Router()
    
    // setup routes
    this.apiRouter.use(this.authMiddleware)
    this.apiRouter.use('/users', new UserController().router)
    this.apiRouter.use('/tweets', new TweetController().router)
  }

  private authMiddleware(req: Request, res: Response, next: any) {
    const publicRoutes = ['POST /users', 'POST /users/login']
    const method = req.method
    const path = req.path

    const isPublicRoute = publicRoutes.includes(`${method} ${path}`)
    if (isPublicRoute) {
      next()
      return
    }

    let token = req.headers.authorization

    if (token) {
      token = token.split(' ')[1]
    }            
    
    if (!token) {
      res.status(401).json({ message: "Not logged in!"})
      return
    }

    try {
      jwt.verify(token, process.env.JWT_SECRET!)
      const user = jwt.decode(token) as JwtUser
      req.user = user
      next()
    } catch (error) {
      res.status(403).json({ message: "Invalid token" })
    }
  }}