const express = require('express'); // Express.js framework'ünü içe aktarır.
const session = require('express-session'); // Kullanıcı oturumlarını yönetmek için modül.
const flash = require('connect-flash'); // flash mesajlar için 'connect-flash' modülü.
const loggerMiddleware = require('./middlewares/logger'); // winston-loggerı kullandık.

const app = express(); //  Express uygulamasını başlatır.
app.set('view engine', 'ejs'); // EJS, HTML içinde JavaScript kullanmak için.

app.use('/assets', express.static('assets')); // 'assets' klasöründeki statik dosyaları sunmak için Express'in express.static middleware'ini kullandık.

app.use(express.static('views')); // 'views' klasöründeki statik dosyaları sunmak için
app.use(express.urlencoded({ extended: true })); // URL kodlu veriyi işlemek için Express'in yerleşik bir middleware'ini kullanır. Bu, POST isteklerinden gelen form verilerini işlemenize yardımcı olur. 
app.use( // Oturum yönetimi için gerekli ayarları yapar.
	session({
		secret: 'GIZLI', // Bu gizli anahtarı değiştirin
		resave: false,
		saveUninitialized: true,
	})
);
app.use(loggerMiddleware); // GET-POST İSTEKLERİNİ LOGLUYORUZ .
app.use(flash({ unsafe: true })); // Flash mesajları için 'connect-flash' middleware'ini kullanır.


const router = require('./routers/routes'); // Rotaları yönetmek için bir router dosyasını içe aktarır.

app.use('/', router); //  Rotaları uygulamaya bağlar.

// Sunucuyu belirtilen portta dinlemeye başla
app.listen(5001, () => {
	console.log('Server http://localhost:5001 adresinde başladı');
});
