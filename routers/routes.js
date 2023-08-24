const express = require('express');
const connection = require('../db');
const checkUserRole = require('../middlewares/role');
const { yilx, gunx, ayx } = require('../utils/date');
const { inserthakedisKapagi, inserthakedisRaporu, insertYapilanisler } = require('../utils/insert');
const {
	downloadinfoPDF,
	birlesmisPDF,
	hakediskapagiPDF,
	hakedisraporuPDF,
	yapilanislerPDF,
	userbirlesmisPDF,
} = require('../utils/generatePdf');
//const deleteHakedis = require('../utils/deleteHakedis');
const path = require('path');
const router = express.Router();

router.get('/', (req, res) => {
	res.render('login', { message: req.flash('message') });
	//res.sendFile(path.join(__dirname, '../views/html/login.html'));
});
router.post('/', (req, res) => {
	let username = req.body.username;
	let password = req.body.password;

	let query = 'select * from userTable where username = ? and password = ?';
	let params = [username, password];
	connection.query(query, params, (err, results) => {
		if (err) {
			console.error(err, 'hata');
			//req.flash('message', 'VERİ TABANI HATASI')
			res.redirect('/');
			return;
		} else if (results.length > 0) {
			const userId = results[0].userId;
			req.session.userId = userId;
			const role = results[0].role;
			req.session.role = role;
			if (role == 'admin') {
				res.redirect(`/ihale-bilgileri/${userId}`);
			} else if (role == 'user') {
				res.redirect(`/userHome/${userId}`);
			} else {
				req.flash('message', 'Henüz Rol Atanmamış');
				res.redirect('/');
			}
		} else {
			req.flash('message', 'Kullanıcı Bulunamadı');
			res.redirect('/');
		}
		res.end();
	});
});
router.get('/logout', (req, res) => {
	req.session.destroy((err) => {
		if (err) {
			console.error('Oturum sonlandırma hatası:', err);
		}
		res.redirect('/');
	});
});
router.get('/showPDF/:no/:s_id', (req, res) => {
	const no = req.params.no;
	const s_id = req.params.s_id;
	birlesmisPDF(res, no, s_id);
});
router.get('/downloadPDF/:no/:s_id', (req, res) => {
	const no = req.params.no;
	const s_id = req.params.s_id;
	downloadinfoPDF(res, no, s_id);
});
router.get('/info', checkUserRole('admin'), (req, res) => {
	const userId = req.session.userId;
	const query = 'SELECT * FROM haz_hakedis_2 WHERE kullanici_id=? order by isin_adi desc';
	connection.query(query, [userId], (err, data) => {
		if (err) throw err;
		res.render('info', { userId, data });
	});
});
/* ------ DELETE HAKEDİS KULLANILMIYOR-----------
router.get('/deletehakedis/:kullanici_id/:s_id/:no', (req, res) => {
	const k_id = req.params.kullanici_id;
	const s_id = req.params.s_id;
	const no = req.params.no;
	deleteHakedis(res, k_id, s_id, no);
});
*/

router.get('/ihale-bilgileri/:userId', (req, res) => {
	res.render('ihale-bilgileri', { message: req.flash('message') });
	//res.sendFile(path.join(__dirname, '../views/html/ihale-bilgileri.html'));
});
router.post('/ihale-bilgileri', async (req, res) => {
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

	let query = 'select s_id from hakedis_raporu where s_id=?';
	let params = [sirket_id];
	connection.query(query, params, async (err, results) => {
		if (err) {
			throw err;
		}
		if (results.length > 0) {
			console.log('bu sirket id kullanılıyor');
			req.flash('message', ['HATA!', 'Şirket İd Kullanılıyor']);
			res.redirect(`/ihale-bilgileri/${userId}`);
		} else {
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
				req.flash('message', ['BAŞARILI !', 'Veriler Başarıyla Eklendi']);
				res.redirect(`/ihale-bilgileri/${userId}`);
			} catch (error) {
				console.log('Veriler eklenirken bir hata oluştu');
				console.log(error);
				req.flash('message', ['HATA!', 'Veriler Eklenirken Hata Oluştu']);
				res.redirect(`/ihale-bilgileri/${userId}`);
			}
		}
	});
});
router.get('/register', (req, res) => {
	//res.sendFile(path.join(__dirname, '../views/html/register.html'));
	res.render('register', { message: req.flash('message') });
});
router.post('/register', (req, res) => {
	let userId = req.session.userId;

	let username = req.body.username;
	let password = req.body.password;
	let kurum_id = req.body.kurum_id;
	let isim = req.body.isim;
	let soyisim = req.body.soyisim;
	let eposta = req.body.eposta;
	let telefon = req.body.telefon;
	let adres = req.body.adres;

	let username_kullaniliyor_mu = 'select username from userTable where username=?';
	let username_params = [username];
	connection.query(username_kullaniliyor_mu, username_params, (err, results) => {
		if (err) {
			throw err;
		}
		if (results.length > 0) {
			console.log('BU USERNAME KULLANILIYOR');
			req.flash('message', ['HATA !', 'Bu Kullanıcı Adı Kayıtlı']);
			res.redirect(`/register`);
		} else {
			let eposta_kullaniliyor_mu = 'select eposta from userTable where eposta=?';
			let eposta_params = [eposta];
			connection.query(eposta_kullaniliyor_mu, eposta_params, (err, results) => {
				if (err) {
					throw err;
				}
				if (results.length > 0) {
					console.log('BU eposta KULLANILIYOR');
					req.flash('message', ['HATA !', 'Eposta Zaten Kayıtlı']);
					res.redirect(`/register`);
				} else {
					let telefon_kullaniliyor_mu = 'select telefon from userTable where telefon=?';
					let telefon_params = [telefon];
					connection.query(telefon_kullaniliyor_mu, telefon_params, (err, results) => {
						if (err) {
							throw err;
						}
						if (results.length > 0) {
							console.log('BU telefon KULLANILIYOR');
							req.flash('message', ['HATA !', 'Telefon Numarası Kayıtlı']);
							res.redirect(`/register`);
						} else {
							let query =
								'INSERT INTO userTable (username, password, userId, isim, soyisim, eposta, telefon, adres) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
							let params = [username, password, kurum_id, isim, soyisim, eposta, telefon, adres];
							connection.query(query, params, (err, results) => {
								if (err) {
									console.log('Kayıt olma hatası:', err);
									req.flash('message', ['HATA !', 'Kaydedilirken Bir Hata Oluştu']);
									res.redirect(`/register`);
								} else {
									console.log('Kayıt olma Başarılı');
									req.flash('message', ['BAŞARILI !', 'Kullanıcı Başarıyla Kaydedildi']);
									res.redirect(`/register`);
								}
								res.end();
							});
						}
					});
				}
			});
		}
	});
});
router.get('/hakedis-kapagi/:userId', (req, res) => {
	const useridInfo = req.params.userId;
	const sirket_id = req.session.sirket_id;
	hakediskapagiPDF(res, useridInfo, sirket_id);
	req.session.sirket_id = null;
});
router.post('/hakedis-kapagi', (req, res) => {
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
router.get('/hakedis-raporu/:userId', (req, res) => {
	const useridInfo = req.params.userId;
	const gecikme = req.session.gecikme;
	const fiyat_farki = req.session.fiyat_farki;
	const var_yok = req.session.var_yok;
	const hakedis_tutari = req.session.hakedis_tutari;
	const kesinti = req.session.kesinti;
	const sirket_id = req.session.sirket_id;
	hakedisraporuPDF(
		res,
		useridInfo,
		gecikme,
		fiyat_farki,
		var_yok,
		hakedis_tutari,
		kesinti,
		sirket_id
	);
	req.session.sirket_id = null;
});
router.post('/hakedis-raporu', (req, res) => {
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
router.get('/yapilan-isler/:userId', (req, res) => {
	const useridInfo = req.params.userId;
	const hakedis_tutari_2 = req.session.hakedis_tutari_2;
	const sirket_id = req.session.sirket_id;
	yapilanislerPDF(res, useridInfo, hakedis_tutari_2, sirket_id);
	req.session.sirket_id = null;
});
router.post('/yapilan-isler', (req, res) => {
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
router.get('/userinfo', checkUserRole('user'), (req, res) => {
	const userId = req.session.userId;
	const query = 'SELECT * FROM haz_hakedis_2 WHERE kullanici_id=? order by isin_adi desc';
	connection.query(query, [userId], (err, data) => {
		if (err) throw err;
		res.render('userinfo', { userId, data });
	});
});
router.get('/userHome/:userId', (req, res) => {
	const userId = req.session.userId;
	const query = 'SELECT * FROM haz_hakedis_2 WHERE kullanici_id=?';
	connection.query(query, [userId], (err, data) => {
		if (err) throw err;
		res.render('userHome', { data });
	});
});
router.get('/pdf-olustur/:userId', (req, res) => {
	const useridInfo = req.params.userId;
	const gecikme = req.session.gecikme;
	const fiyat_farki = req.session.fiyat_farki;
	const var_yok = req.session.var_yok;
	const hakedis_tutari = req.session.hakedis_tutari;
	const kesinti = req.session.kesinti;
	const sirket_id = req.session.sirket_id;

	userbirlesmisPDF(
		res,
		useridInfo,
		gecikme,
		fiyat_farki,
		var_yok,
		hakedis_tutari,
		kesinti,
		sirket_id
	);
	req.session.sirket_id = null;
});
router.post('/pdf-olustur', (req, res) => {
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
			res.redirect(`/pdf-olustur/${userId}`);
		} else {
			console.log(err);
		}
		res.end();
	});
});

module.exports = router;
