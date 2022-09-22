const mysql = require('mysql2/promise');

const query = 'INSERT IGNORE INTO user(id, first_name, last_name, username, pic) VALUES(?, ?, ?, ?, ?)';
const dbConfig = {
  host: process.env.MYSQL_HOST || 'meetyou.cruumxxoikxq.us-east-1.rds.amazonaws.com',
  port: process.env.MYSQL_PORT || '3306',
  user: process.env.DB_USER || 'dev',
  password: process.env.DB_PASSWORD || 'mak786mak7',
  database: process.env.DB_NAME || 'meetyou'
}

exports.handler = async (event, context) => {
  if(event.request && event.request.userAttributes) {
    const user = event.request.userAttributes;
    const options = [user.sub, user.given_name, user.family_name, event.userName, user.picture];
    try {
      const connection = await mysql.createConnection(dbConfig);
      const [results] = await connection.execute(query, options);
      console.log(results);
      await connection.destroy();
    } catch (err) {
      console.log(err);
    }
  }
  context.done(null, event);
};
