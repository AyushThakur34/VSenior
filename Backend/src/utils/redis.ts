import Redis from "ioredis";

// redis for temporary data storage
const redis = new Redis(process.env.REDIS_URL!)

export default redis;