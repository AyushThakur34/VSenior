import mongoose from "mongoose";

const AdditionalDataSchema = new mongoose.Schema({
    full_name: {
        type: String,
    },
    gender: {
        type: String,
    },
    handles: {
        linkedin: {
            type: String
        },
        leetcode: {
            type: String
        },
        github: {
            type: String
        },
        codeforces: {
            type: String
        },
        codechef: {
            type: String
        }
    }
});

const AdditionalData = mongoose.model("AdditionalData", AdditionalDataSchema);
export default AdditionalData;