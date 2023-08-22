const express = require('express');
const session = require('express-session');
const app = express();
app.set('view engine', 'ejs');
app.use('/assets', express.static('assets'));
app.use(express.static('views'));
app.use(express.urlencoded({ extended: true }));
app.use(
	session({
		secret: 'GIZLI', // Bu gizli anahtarı değiştirin
		resave: false,
		saveUninitialized: true,
	})
);



const router = require('./routers/routes');
app.use('/', router);


// MySQL bağlantısını kapat
// connection.end();
app.listen(5001, () => {
	console.log('Server http://localhost:5001 adresinde başladı');
});
