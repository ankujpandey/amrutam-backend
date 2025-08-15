const IORedis = require("ioredis");
const host = process.env.REDIS_HOST;
const port = Number(process.env.REDIS_PORT);

let redis = new IORedis(port, host);

redis.on("error", e => console.error("Redis error:", e));
redis.on("connect", () => console.log("Redis connected"));

module.exports = redis;
