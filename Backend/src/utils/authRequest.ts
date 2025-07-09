import { Request } from "express";
import { Types } from "mongoose";

interface AuthRequest extends Request {
    user ?: {
        _id: Types.ObjectId,
        email: string,
        username: string,
        private_member: boolean
    }
}

export default AuthRequest;