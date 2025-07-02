import mongoose, { Types } from "mongoose";

const ChannelSchema = new mongoose.Schema({
    channel_name: {
        type: String,
        required: true
    },
    members: [{
        type: Types.ObjectId,
        ref: "User"
    }],
    posts: [{
        type: Types.ObjectId,
        ref: "Post"
    }]
});

const Channel = mongoose.model("Channel", ChannelSchema);
export default Channel;