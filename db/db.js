const pgp = require('pg-promise')();


const connection = {
  host: 'localhost',
  port: 5432,
  database: 'luna-db',
  user: 'postgres',
  password: 'Ntobar99!'
};
const db = pgp(connection);
module.exports = db;
