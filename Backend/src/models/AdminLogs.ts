import mongoose, { Types } from "mongoose";

const AdminLogsSchema = new mongoose.Schema({
    action: {
        type: "String",
        enum: ["PROMOTE", "DEMOTE"],
        required: true
    },
    performed_by: {
        type: Types.ObjectId,
        ref: "User",
        required: true
    },
    target: {
        type: Types.ObjectId,
        ref: "User",
        required: true
    }
},{timestamps: true});

const AdminLogs = mongoose.model("AdminLogs", AdminLogsSchema);
export default AdminLogs;