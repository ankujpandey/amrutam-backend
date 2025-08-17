const IORedis = require("ioredis");
const url = process.env.REDIS_URL;

let redis = new IORedis(url);

redis.on("error", e => console.error("Redis error:", e));
redis.on("connect", () => console.log("Redis connected"));

module.exports = redis;
