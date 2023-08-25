const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const winston = require('winston');
const loggerMiddleware = require('./middlewares/logger');
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


app.use(loggerMiddleware);
app.use(flash({ unsafe: true }));

const router = require('./routers/routes');



app.use('/', router);


// MySQL bağlantısını kapat
// connection.end();
app.listen(5001, () => {
	console.log('Server http://localhost:5001 adresinde başladı');
});
