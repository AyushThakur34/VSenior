import jwt from "jsonwebtoken";
import { Response, NextFunction } from "express";
import AuthRequest from "../utils/authRequest.ts";
import dotenv from "dotenv";
dotenv.config();

export const verifyAccessToken = async(req: AuthRequest, res: Response, next: NextFunction): Promise<void>=> {
    try{
        const token = req.cookies.accessToken;
        if(!token) { // handle the case where token is missing
            res.status(401).json({
                success: false,
                message: "Access Token Missing"
            });
            return ;
        }

        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!); // decode the payload from token
        req.user = decoded as AuthRequest["user"]; // and add that into req before sending it to next route
        next();
    } catch(err) {
        console.error(err);
        res.status(401).json({
            success: false,
            message: "Invalid or Expired Token",
            error: err
        }); 
    }
}