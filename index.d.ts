declare namespace Express {
    export interface Request {
        user?: JwtUser
    }
}
  
interface JwtUser {
    id: number
    username: string
    role: string
    is_active: boolean
    created_at: string
    iat: number
    exp: number
}