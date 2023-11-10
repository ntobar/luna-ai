const pgp = require('pg-promise')();


const connection = {
  host: 'localhost',
  port: 5432,
  database: 'luna-db',
  user: 'postgres',
  password: 'Ntobar99!'
};

// const connection = {
//   host: '167.99.228.69', // Change this to the IP address shown in the image
//   port: 5432, // The port is correct as per the image
//   database: 'luna-db', // The database name matches the one in the image
//   user: 'postgres', // This matches the user shown in the image
//   password: 'Ntobar99!' // Replace 'your_password_here' with the actual password
// };
const db = pgp(connection);
module.exports = db;
