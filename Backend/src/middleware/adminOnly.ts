import AuthRequest from "../utils/authRequest.ts";
import { NextFunction, Response } from "express";
import dotenv from "dotenv";
dotenv.config();

export const adminOnly = async(req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const role = req.user?.role;
        if(role == "admin" || role == "super_admin") {
            next();
            return ;
        }
        
        res.status(401).json({
            success: false,
            message: "Unauthorized"
        });

    } catch (err) {
        if(process.env.NODE_ENV !== "production") console.error(err);
        res.status(400).json({
            success: false,
            message: "Internal Server Error"
        })
    }
}