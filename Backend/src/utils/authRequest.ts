import { Request } from "express";

interface AuthRequest extends Request {
    user ?: {
        _id: string,
        email: string,
        username: string
    }
}

export default AuthRequest;