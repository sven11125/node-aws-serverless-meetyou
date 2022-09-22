module.exports = {
    database: {
        name: process.env.DB_NAME || 'meetyou',
        username: process.env.DB_USER || 'root',//'dev',
        password: process.env.DB_PASSWORD || 'root',//'mak786mak7',
        options: {
            host: process.env.MYSQL_HOST || 'localhost',//'meetyou.cruumxxoikxq.us-east-1.rds.amazonaws.com',
            port: process.env.MYSQL_PORT || '3306',
            dialect: 'mysql',
            logging: process.env.NODE_ENV !== 'production' ? true : false,
            define: {
                paranoid: true,
                timestamps: false,
                freezeTableName: true,
                underscored: true
            },
            pool: {
                max: 10,
                min: 0,
                idle: 10000
            }
        }
    },
    redis: {
        host: process.env.REDIS_HOST || "arifjaunpur.tk",
        port: process.env.REDIS_PORT || 6379
    },
    socketio: {
        url: process.env.SOCKETIO_URL || 'http://ec2-54-146-185-68.compute-1.amazonaws.com'
    }
};
