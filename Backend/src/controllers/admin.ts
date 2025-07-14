import User from "../models/User.ts";
import { Response } from "express";
import AuthRequest from "../utils/authRequest.ts";
import AdminLogs from "../models/AdminLogs.ts";
import dotenv from "dotenv";
dotenv.config();

export const promoteUser = async(req: AuthRequest, res: Response): Promise<void> => {
    try {
        const studentID = req.body.student_id;
        const adminID = req.user?._id;
        const role = req.user?.role;

        if(!studentID) { // check for missing field
            res.status(400).json({
                success: false,
                message: "Missing Field"
            });
            return ;
        }

        if(role !== "super_admin") { // only admin can promote user to admin
            res.status(403).json({
                success: false,
                message: "Access Denied"
            });
            return ;
        }

        const user = await User.findById(studentID);
        if(!user) {
            res.status(404).json({
                success: false,
                message: "User Not Found"
            });
            return ;
        }

        if(user.role != "student") {
            res.status(400).json({
                success: false,
                message: "User already has elevated privileges"
            })
            return ;
        }

        user.role = "admin";
        await user.save();

        await AdminLogs.create({
            action: "PROMOTE",
            performed_by: adminID,
            target: user._id
        });

        res.status(200).json({
            success: true,
            message: "User Promoted To Admin"
        });

    } catch(err) {
        if(process.env.NODE_ENV !== "production") console.error(err);
        res.status(500).json({
            success: false,
            message: "Something went wrong while promoting user"
        });
    }
}

export const demoteAdmin = async(req: AuthRequest, res: Response): Promise<void> => {
    try {
        const adminID = req.body.admin_id;
        const superAdminID = req.user?._id;
        const role = req.user?.role;

        if(!adminID) {
            res.status(400).json({
                success: false,
                message: "Missing Field"
            })
            return ;
        } 

        if(role !== "super_admin") {
            res.status(403).json({
                success: false,
                message: "Access Denied"
            });
            return ;
        }

        const admin = await User.findOne({_id: adminID, role: "admin"});
        if(!admin) {
            res.status(404).json({
                success: false,
                message: "Admin Not Found"
            });
            return ;
        }

        admin.role = "student";
        await admin.save();

        await AdminLogs.create({
            action: "DEMOTE",
            performed_by: superAdminID,
            target: admin._id
        });

        res.status(200).json({
            success: true,
            message: "Admin Demoted To User"
        })
    } catch(err) {
        if(process.env.NODE_ENV !== "production") console.error(err);
        res.status(500).json({
            success: false,
            message: "Something went wrong while demoting admin"
        });
    }
}

export const getAllAdmins = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if(req.user?.role !== "super_admin") {
            res.status(403).json({
                success: false,
                message: "Access Denied"
            });
            return ;
        }

        const admins = await User.find({
            role: {$in: ["admin", "super_admin"]}
        }).select("_id username email role");

        res.status(200).json({
            success: true,
            admins
        })

    } catch(err) {
        if(process.env.NODE_ENV !== "production") console.error(err);
        res.status(500).json({
            success: false,
            message: "Something went wrong while fetching admin list"
        });
    }
}