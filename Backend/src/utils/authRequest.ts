import { Request } from "express";

interface AuthRequest extends Request {
    user ?: {
        _id: string,
        email: string,
        username: string,
        private_member: boolean
    }
}

export default AuthRequest;