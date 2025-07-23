import { Request, Response } from "express";
import dotenv from "dotenv"
import jwt from "jsonwebtoken";
import AuthRequest from "../utils/authRequest.ts";
dotenv.config();

export const reload = async(req: Request, res:Response):Promise<void> => {
    try {
        const token = req.cookies.accessToken;
        if(!token) {
            res.status(401).json({
                success: false,
                message: "Access Token Missing"
            })
            return ;
        }

        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!);
        if(!decoded) {
            res.status(401).json({
                success: false,
                message: "Access Token Invalid"
            })
            return ;
        }

        const existingUser = decoded as AuthRequest["user"];
        const user = {
            _id: existingUser?._id,
            username: existingUser?.username,
            email: existingUser?.email,
            private_member: existingUser?.private_member,
            role: existingUser?.role
        };

        res.status(200).json({
            success: true,
            message: "Access Granted",
            user
        })

    } catch (err) {
        if(process.env.NODE_ENV !== "production") console.error("User Authentication Failed on Reload", err);
        res.status(500).json({
            success: false,
            message: "User Authentication Failed on Reload"
        });
    }
}