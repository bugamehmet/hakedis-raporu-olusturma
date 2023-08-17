const express = require('express');
const session = require('express-session');
const connection = require('./db');
const login = require('./routes/login');
const checkUserRole = require('./middlewares/role');
const { yilx, gunx, ayx } = require('./utils/date');
const {inserthakedisKapagi, inserthakedisRaporu, insertYapilanisler} = require('./utils/insert'); 
const {hakediskapagiPDF, hakedisraporuPDF, yapilanislerPDF, infoPDF} = require('./utils/generatePdf');
const deleteHakedis = require('./utils/deleteHakedis');

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

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/views/html/login.html');
});
app.get('/register', (req, res) => {
	res.sendFile(__dirname + '/views/html/register.html');
});
app.get('/logout', (req, res) => {
	req.session.destroy((err) => {
		if (err) {
			console.error('Oturum sonlandırma hatası:', err);
		}
		res.redirect('/');
	});
});
app.get('/info', checkUserRole('admin'), (req, res) => {
	const userId = req.session.userId;
	const query = 'SELECT * FROM haz_hakedis_2 WHERE kullanici_id=? order by isin_adi desc';
	connection.query(query, userId, (err, data) => {
		if (err) throw err;
		res.render('info', { userId, data });
	});
});
app.get('/userinfo', checkUserRole('user'), (req, res) => {
	const userId = req.session.userId;
	const query = 'SELECT * FROM haz_hakedis_2 WHERE kullanici_id=? order by isin_adi desc';
	connection.query(query, userId, (err, data) => {
		if (err) throw err;
		res.render('userinfo', { userId, data });
	});
});
app.get('/downloadPDF/:no/:s_id', (req, res) => {
	const no = req.params.no;
	const s_id = req.params.s_id;
	infoPDF(res, no, s_id);
});
app.get('/deletehakedis/:kullanici_id/:s_id/:no', (req, res)=>{
	const k_id = req.params.kullanici_id;
	const s_id = req.params.s_id;
	const no = req.params.no;
	deleteHakedis(res, k_id, s_id, no);
});
app.get('/ihale-bilgileri/:userId', (req, res) => {
	res.sendFile(__dirname + '/views/html/ihale-bilgileri.html');
});
app.get('/user/:userId', (req,res)=>{
	res.sendFile(__dirname + '/views/html/user.html');
});
app.get('/hakedis-kapagi/:userId', (req, res) => {
	const useridInfo = req.params.userId;
	const sirket_id = req.session.sirket_id;
	hakediskapagiPDF(res, useridInfo, sirket_id);
	req.session.sirket_id = null;
});
app.get('/hakedis-raporu/:userId', (req, res) => {
	const useridInfo = req.params.userId;
	const gecikme = req.session.gecikme;
	const fiyat_farki = req.session.fiyat_farki;
	const var_yok = req.session.var_yok;
	const hakedis_tutari = req.session.hakedis_tutari;
	const kesinti = req.session.kesinti;
	const sirket_id = req.session.sirket_id;
	hakedisraporuPDF(res, useridInfo, gecikme, fiyat_farki, var_yok, hakedis_tutari, kesinti, sirket_id);
	req.session.sirket_id = null;
});
app.get('/yapilan-isler/:userId', (req, res) => {
	const useridInfo = req.params.userId;
	const hakedis_tutari_2 = req.session.hakedis_tutari_2;
	const sirket_id = req.session.sirket_id;
	yapilanislerPDF(res, useridInfo, hakedis_tutari_2, sirket_id);
	req.session.sirket_id = null;
});
app.post('/', (req, res) => {
	let username = req.body.username;
	let password = req.body.password;

	let query = 'select * from userTable where username = ? and password = ?';
	let params = [username, password];
	connection.query(query, params, (err, results) => {
		const userId = results[0].userId;
		req.session.userId = userId;
		const role = results[0].role;
		req.session.role = role;

		if (results.length > 0 && role == 'admin') {
			res.redirect(`/ihale-bilgileri/${userId}`);
		} 
		else if(results.length > 0 && role == 'user'){
			res.redirect(`/user/${userId}`);
		}
		else {
			res.redirect('/');
		}
		res.end();
	});
});
app.post('/register', (req, res) => {
	let username = req.body.username;
	let password = req.body.password;
	let isim = req.body.isim;
	let soyisim = req.body.soyisim;
	let eposta = req.body.eposta;
	let telefon = req.body.telefon;
	let adres = req.body.adres;

	let query =
		'INSERT INTO userTable (username, password, isim, soyisim, eposta, telefon, adres) VALUES (?, ?, ?, ?, ?, ?, ?)';
	let params = [username, password, isim, soyisim, eposta, telefon, adres];
	connection.query(query, params, (err, results) => {
		if (err) {
			console.log('Kayıt olma hatası:', err);
			res.redirect('/');
		} else {
			const userId = results.insertId;
			res.redirect('/ihale-bilgileri/' + userId);
		}
		res.end();
	});
});
app.post('/ihale-bilgileri', async (req, res) => {
	const userId = req.session.userId;

	let uygulama_yili = yilx();
	let tarih = `${gunx()}.${ayx()}.${yilx()}`;
	let is_adi = req.body.is_adi;
	let proje_no = req.body.proje_no;
	let yuklenici_adi = req.body.yuklenici_adi;
	let sozlesme_bedeli = req.body.sozlesme_bedeli;
	let ihale_tarihi = req.body.ihale_tarihi;
	let kayit_no = req.body.kayit_no;
	let sozlesme_tarih = req.body.sozlesme_tarih;
	let isyeri_teslim_tarihi = req.body.isyeri_teslim_tarihi;
	let isin_suresi = req.body.isin_suresi;
	let is_bitim_tarihi = req.body.is_bitim_tarihi;
	let sirket_id = req.body.sirket_id;

	try {
		await inserthakedisKapagi(
			userId,
			sirket_id,
			uygulama_yili,
			tarih,
			is_adi,
			proje_no,
			yuklenici_adi,
			sozlesme_bedeli,
			ihale_tarihi,
			kayit_no,
			sozlesme_tarih,
			isyeri_teslim_tarihi,
			isin_suresi,
			is_bitim_tarihi
		);

		await inserthakedisRaporu(userId, sirket_id, is_adi, sozlesme_bedeli, isin_suresi);

		await insertYapilanisler(userId, sirket_id, is_adi, sozlesme_bedeli, isin_suresi);

		console.log('Veriler başarıyla eklendi');
		res.redirect(`/ihale-bilgileri/${userId}`);
	} catch (error) {
		console.log('Veriler eklenirken bir hata oluştu');
		console.log(error);
		res.redirect(`/ihale-bilgileri/${userId}`);
	}
});
app.post('/hakedis-kapagi', (req, res) => {
	const userId = req.session.userId;
	const sirket_id = req.body.sirket_id;
	req.session.sirket_id = sirket_id;

	let query = 'select kullanici_id from hakedis_raporu where kullanici_id=?';
	let params = [userId];
	connection.query(query, params, (err, results) => {
		if (results.length > 0) {
			const userId = results[0].kullanici_id;
			res.redirect(`/hakedis-kapagi/${userId}`);
		} else {
			console.log(err);
		} 
		res.end();
	});
});
app.post('/hakedis-raporu', (req, res) => {
	const userId = req.session.userId;
	const gecikme = req.body.gecikme;
	const fiyat_farki = req.body.fiyat_farki;
	const var_yok = req.body.var_yok;
	const hakedis_tutari = req.body.hakedis_tutari;
	const kesinti = req.body.kesinti;
	const sirket_id = req.body.sirket_id;
	req.session.gecikme = gecikme;
	req.session.kesinti = kesinti;
	req.session.hakedis_tutari = hakedis_tutari;
	req.session.var_yok = var_yok;
	req.session.fiyat_farki = fiyat_farki;
	req.session.sirket_id = sirket_id;

	let query = 'select kullanici_id from hakedis_2 where kullanici_id=?';
	let params = [userId];
	connection.query(query, params, (err, results) => {
		if (results.length > 0) {
			const userId = results[0].kullanici_id;
			res.redirect(`/hakedis-raporu/${userId}`);
		} else {
			console.log(err);
		}
		res.end();
	});
});
app.post('/yapilan-isler', (req, res) => {
	const userId = req.session.userId;
	const hakedis_tutari_2 = req.body.hakedis_tutari_2;
	req.session.hakedis_tutari_2 = hakedis_tutari_2;
	const sirket_id = req.body.sirket_id;
	req.session.sirket_id = sirket_id;

	let query = 'select kullanici_id from hakedis_3 where kullanici_id=?';
	let params = [userId];
	connection.query(query, params, (err, results) => {
		if (results.length > 0) {
			const userId = results[0].kullanici_id;
			res.redirect(`/yapilan-isler/${userId}`);
		} else {
			console.log(err);
		}
		res.end();
	});
});

// MySQL bağlantısını kapat
// connection.end();
app.listen(5001, () => {
	console.log('Server http://localhost:5001 adresinde başladı');
});
