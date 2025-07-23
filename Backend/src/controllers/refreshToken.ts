import RefreshToken from "../models/RefreshToken.ts";
import User from "../models/User.ts";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { Request, Response } from "express";
dotenv.config();

export const refreshToken = async(req: Request, res: Response): Promise<void>=> {
    try {
        const token = req.cookies.refreshToken;
        if(!token) { // handle the case where userID or Token is missing
            res.status(400).json({
                success: false,
                message: "Refresh Token Missing"
            });
            return ;
        }
        
        const oldToken = await RefreshToken.findOne({token: token}); // fetch old token from database assigned to that user
        if(!oldToken) { // handle the case if no such token is assigned 
            res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
            return ;
        }

        try {
            jwt.verify(oldToken.token, process.env.JWT_REFRESH_SECRET!); // verify the token stored in db
        } catch(err) {
            res.status(401).json({
                success: false,
                message: "Token Verification Failed"
            });
            return ;
        }

        const existingUser = await User.findById(token.userID);
        if(!existingUser) {
            res.status(404).json({
                success: false,
                message: "User Not Found"
            });
            return ;
        }

        const newToken = jwt.sign({_id: existingUser._id}, process.env.JWT_REFRESH_SECRET!, {expiresIn:"7d"}); // generate new refresh token
        await RefreshToken.findByIdAndUpdate(oldToken._id, {token: newToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)}); // replace the old in the db with new token

        res.cookie("refreshToken", newToken, { // send new refresh token in cookie
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        const newAccessToken = jwt.sign( // assign new access token
            {_id: existingUser._id, username: existingUser.username, email: existingUser.email, private_member: existingUser.private_member, role: existingUser.role},
            process.env.JWT_ACCESS_SECRET!, 
            {expiresIn:"15m"}
        );
        
        res.cookie("accessToken", newAccessToken, { // send the access token in cookie 
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 15 * 60 * 1000
        });

        const user = {
            _id: existingUser._id,
            username: existingUser.username,
            email: existingUser.email,
            private_member: existingUser.private_member,
            role: existingUser.role
        };

        res.status(200).json({
            success: true,
            message: "Token Cycle Completed",
            user
        });
    } catch(err) {
        console.log("[Token Refreshing Error]:", err);
        res.status(500).json({
            success: false,
            message: "Error While Refreshing Token",
            error: err
        });
    }
}