import mongoose, { Types } from "mongoose";

const ChannelSchema = new mongoose.Schema({
    channel_name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ["open", "college"],
        required: true
    },
    post_count: {
        type: Number,
        default: 0
    }
    
});

const Channel = mongoose.model("Channel", ChannelSchema);
export default Channel;