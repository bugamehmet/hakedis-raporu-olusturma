const mysql = require('mysql');
const connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: '12345678',
	database: 'userDB',
});
connection.connect((error) => {
	if (error) throw error;
	else console.log('bağlanıldı!');
});
module.exports = connection;