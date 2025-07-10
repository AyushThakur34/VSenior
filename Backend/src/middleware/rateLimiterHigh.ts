import rateLimit from "express-rate-limit";

export const rateLimiterHigh = rateLimit({
    windowMs: 60 * 1000, // 1 minute window
    max: 20, // limit each IP to 20 comments per minute
    message: {
        success: false,
        message: "Too many requests, Please slow down"
    },
    standardHeaders: true,
    legacyHeaders: false,
});