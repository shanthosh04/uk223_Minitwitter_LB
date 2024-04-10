import { Router, Request, Response } from 'express'
import { Database } from '../../database'
import jwt from 'jsonwebtoken'

export class UserController {
    router: Router
    private database: Database

    constructor() {
        this.router = Router()
        this.database = new Database()
        this.setupRoutes()
    }

    // methods
    private setupRoutes(): void {
        this.router.get('/', this.getUsers)
        this.router.get('/:id', this.getUser)
        this.router.post('/', this.createUser)
        this.router.post('/login', this.loginUser)
    }

    private getUsers = async (req: Request, res: Response) => {
        const query = `SELECT id, username, role, is_active, created_at FROM users`
        const users = await this.database.executeSQL(query)
        res.json(users)
    }


    private getUser = async (req: Request, res: Response) => {
        const id = req.params.id
        const query = `SELECT id, username, role, is_active, created_at FROM users WHERE id = ${id}`
        const users = await this.database.executeSQL(query) // array
        if (users.length === 0) {
            res.status(404).json({ message: 'User not found!'})
            return // fertig
        }
        res.json(users[0])
    }

    private createUser = async (req: Request, res: Response) => {
        const { username, password } = req.body // users input
        if (!username || !password) {
            res.status(400).json({ message: 'missing required fields'})
            return 
        }
        const userExistsQuery = `SELECT id FROM users WHERE username = '${username}'`
        const userExists = await this.database.executeSQL(userExistsQuery)
        if (userExists.length > 0) {
            res.status(409).json({ message: 'User already exists' }) // 409 code conflict
            return
        }
        const query = `INSERT INTO users (username, password) VALUES ('${username}', '${password}')`
        await this.database.executeSQL(query)
        res.status(201).json({message: 'user created'})
    }
    
    private loginUser = async (req: Request, res: Response) => {
        const { username, password } = req.body // users input
        if (!username || !password) {
            res.status(400).json({ message: 'missing required fields'})
            return 
        }
        const query = `SELECT id, username, role, is_active, created_at FROM users WHERE username = '${username}' AND password = '${password}'`
        const users = await this.database.executeSQL(query) // array 
        if (users.length === 0) {
            res.status(401).json({ message: 'User or Password wrong!'})
            return // fertig
        }
        const user = users[0]

        if (!user.is_active) {
            res.status(401).json({ message: 'User is blocked' })
            return
        }

        const token = jwt.sign(user, process.env.JWT_SECRET!, { expiresIn: '1h' });
        // return token und user
        res.json({ jwt: token, user })
    }
}    