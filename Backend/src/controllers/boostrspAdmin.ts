import User from "../models/User.ts";
import dotenv from "dotenv";
import { Request, Response } from "express";
import bcrypt from "bcrypt";
dotenv.config();

export const boostrapAdmin = async(req: Request, res: Response): Promise<void> => {
    if(process.env.NODE_ENV === "production") {
        res.status(403).json({
            success: false,
            message: "Bootstrap Admin is disabled in production "
        });
        return ;
    }

    const { email, password } = req.body;
    if(!email || !password) {
        res.status(400).json({
            success: false,
            message: "Missing Fields"
        }); 
        return ;
    }

    const existing = await User.findOne({role: "SuperAdmin"}).lean(); // check for pre existing super admin 
    if(existing) {
        res.status(403).json({
            success: false,
            message: "Only One Super Admin is Allowed"
        });
        return ;
    }

    // check initial super admin email and password 
    if(email !== process.env.INITIAL_ADMIN_EMAIL || password !== process.env.INITIAL_ADMIN_PASS) {
        res.status(401).json({
            success: false,
            message: "Unauthorized"
        });
        return ;
    }
    
    // if passed store hash the password and store the super admin into db
    const hashed = await bcrypt.hash(password, 10);
    await User.create({
        username: "@SuperAdmin",
        email,
        password: hashed,
        role: "super_admin"
    });

    res.status(200).json({
        success: true,
        message: "Admin Boostraped Successfully"
    });
}