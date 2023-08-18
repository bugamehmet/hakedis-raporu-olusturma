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
app.use('/register', router);
app.use('/logout', router);
app.use('/info', router);
app.use('/userinfo', router);
app.use('/downloadPDF/:no/:s_id', router);
app.use('/deletehakedis/:kullanici_id/:s_id/:no', router);
app.use('/ihale-bilgileri/:userId', router);
app.use('/user/:userId', router);
app.use('/hakedis-kapagi', router);
app.use('/hakedis-raporu', router);
app.use('/yapilan-isler', router);
app.use('/hakedis-kapagi/:userId', router);
app.use('/hakedis-raporu/:userId', router);
app.use('/yapilan-isler/:userId', router);

// MySQL bağlantısını kapat
// connection.end();
app.listen(5001, () => {
	console.log('Server http://localhost:5001 adresinde başladı');
});
