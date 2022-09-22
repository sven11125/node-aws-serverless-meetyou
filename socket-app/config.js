module.exports = {
    redis: {
        host: process.env.REDIS_HOST || "arifjaunpur.tk",
        port: process.env.REDIS_PORT || 6379
    },
    api: {
        url: process.env.API_URL || 'http://localhost:3000'
    }
};
