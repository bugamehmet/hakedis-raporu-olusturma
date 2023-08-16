const express = require('express');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const session = require('express-session');
const connection = require('./db');

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
	res.sendFile(__dirname + '/login.html');
});
app.get('/register', (req, res) => {
	res.sendFile(__dirname + '/register.html');
});
app.get('/logout', (req, res) => {
	req.session.destroy((err) => {
		if (err) {
			console.error('Oturum sonlandırma hatası:', err);
		}
		res.redirect('/');
	});
});
app.get('/info', (req, res) => {
	const userId = req.session.userId;
	const query = 'SELECT * FROM haz_hakedis_2 WHERE kullanici_id=? order by isin_adi desc';
	connection.query(query, userId, (err, data) => {
		if (err) throw err;
		res.render('info', { userId, data });
	});
});
app.get('/downloadPDF/:no/:s_id', (req, res) => {
	const no = req.params.no;
	const s_id = req.params.s_id;
	infoPDF(res, no, s_id);
});
app.get('/ihale-bilgileri/:userId', (req, res) => {
	res.sendFile(__dirname + '/ihale-bilgileri.html');
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
		if (results.length > 0) {
			const userId = results[0].userId;
			req.session.userId = userId;
			res.redirect(`/ihale-bilgileri/${userId}`);
		} else {
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
let date = new Date();
let gun = date.getDate();
let ay = date.getMonth() + 1;
let yil = date.getFullYear();
function gunx() {
	if (gun < 10) {
		return '0' + gun;
	} else {
		return gun;
	}
}
function ayx() {
	if (ay < 10) {
		return '0' + ay;
	} else {
		return ay;
	}
}

app.post('/ihale-bilgileri', async (req, res) => {
	const userId = req.session.userId;

	let uygulama_yili = yil;
	let tarih = `${gunx(gun)}.${ayx(ay)}.${yil}`;
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

function inserthakedisKapagi(
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
) {
	return new Promise((resolve, reject) => {
		let query =
			'INSERT INTO hakedis_raporu (kullanici_id, s_id, uygulama_yili, tarih, is_adi, proje_no, yuklenici_adi, sozlesme_bedeli, ihale_tarihi, kayit_no, sozlesme_tarih, isyeri_teslim_tarihi, isin_suresi, is_bitim_tarihi) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
		let params = [
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
			is_bitim_tarihi,
		];
		connection.query(query, params, (err, results) => {
			if (err) {
				reject(err);
			} else {
				resolve();
			}
		});
	});
}

function inserthakedisRaporu(userId, sirket_id, is_adi, sozlesme_bedeli, isin_suresi) {
	return new Promise((resolve, reject) => {
		let query =
			'INSERT INTO hakedis_2 (kullanici_id, s_id, isin_adi, sozlesme_bedeli, is_sure) VALUES (?, ?, ?, ?, ?)';
		let params = [userId, sirket_id, is_adi, sozlesme_bedeli, isin_suresi];
		connection.query(query, params, (err, res) => {
			if (err) {
				reject(err);
			} else {
				resolve();
			}
		});
	});
}

function insertYapilanisler(userId, sirket_id, is_adi, sozlesme_bedeli, isin_suresi) {
	return new Promise((resolve, reject) => {
		let query =
			'INSERT INTO hakedis_3 (kullanici_id, s_id, isin_adi, sozlesme_bedeli, isin_suresi) VALUES (?, ?, ?, ?, ?)';
		let params = [userId, sirket_id, is_adi, sozlesme_bedeli, isin_suresi];

		connection.query(query, params, (err, res) => {
			if (err) {
				reject(err);
			} else {
				resolve();
			}
		});
	});
}

function para(number, fractionDigits = 2) {
	const formattedNumber = parseFloat(number).toFixed(fractionDigits);
	return '₺ ' + formattedNumber.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function hakediskapagiPDF(res, useridInfo, sirket_id) {
	const query = 'SELECT * FROM hakedis_raporu WHERE kullanici_id = ? AND s_id = ? ORDER BY h_id DESC LIMIT 1';
	const params = [useridInfo, sirket_id];
	connection.query(query, params, (error, results) => {
		if (error) {
			console.log('Veritabanı hatası:', error);
			res.status(500).send('Veritabanı hatası');
			return;
		}
		const doc = new PDFDocument({ size: 'A4', margin: 30, font: 'assets/fonts/Roboto.ttf' });

		reportFrame();
		reportHeader();
		reportInformation();
		reportTable();
		reportFooter();
		updateData();

		function reportFrame() {
			const frameX = 15; // Çerçevenin sol kenarının X koordinatı
			const frameY = 30; // Çerçevenin üst kenarının Y koordinatı
			const frameWidth = 570; // Çerçevenin genişliği
			const frameHeight = 750; // Çerçevenin yüksekliği
			const frameThickness = 2; // Çerçevenin kalınlığı piksel cinsinden

			const drawRect = (x, y, width, height, color) => {
				doc.rect(x, y, width, height).fill(color);
			};

			drawRect(frameX, frameY, frameWidth, frameThickness, '#000000'); // Üst çerçeve
			drawRect(
				frameX,
				frameY + frameHeight - frameThickness,
				frameWidth,
				frameThickness,
				'#000000'
			); // Alt çerçeve
			drawRect(
				frameX,
				frameY + frameThickness,
				frameThickness,
				frameHeight - 2 * frameThickness,
				'#000000'
			); // Sol çerçeve
			drawRect(
				frameX + frameWidth - frameThickness,
				frameY + frameThickness,
				frameThickness,
				frameHeight - 2 * frameThickness,
				'#000000'
			); // Sağ çerçeve
		}
		function rowReport(doc, heigth) {
			doc.lineJoin('miter').rect(30, heigth, 550, 85).stroke();
			return doc;
		}
		function reportHeader() {
			const logoLeft = 'assets/gorseller/logo_left.png';
			const logoRight = 'assets/gorseller/logo_right.png';
			doc
				.image(logoLeft, 20, 50, { width: 60, height: 80 })
				.image(logoRight, 500, 50, { width: 60, height: 80 })
				.fontSize(12)
				.text('T.C', 100, 30, { align: 'center' })
				.text('SAMSUN BÜYÜK ŞEHİR BELEDİYESİ', 100, 50, { align: 'center' })
				.text('SAMSUN SU VE KANALİZASYON GENEL MÜDÜRLÜĞÜ', 100, 70, { align: 'center' })
				.text('BİLGİ İŞLEM DAİRESİ BAŞKANLIĞI', 100, 90, { align: 'center' })
				.fontSize(16)
				.text('Hakediş Raporu', 100, 150, { align: 'center' })
				.moveDown();
		}
		function reportInformation() {
			doc
				.fontSize(12)
				.text(`Tarihi: ${results[0].tarih}`, 100, 180, { align: 'center' })
				.text(`No su: ${results[0].no}`, 100, 200, { align: 'center' })
				.text(`Uygulama Yılı: ${results[0].uygulama_yili}`, 100, 220, { align: 'center' })
				.text('Yapılan işin / Hizmetin Adı :', 35, 270)
				.text(`${results[0].is_adi}`, 275, 270, { align: 'left' })
				.text('Yapılan İsin / Hizmetin Etüd / Proje No su :', 35, 330)
				.text(`${results[0].proje_no}`, 275, 330, { align: 'left' })
				.text('Yüklenicinin Adi / Ticari Unvanı :', 35, 370)
				.text(`${results[0].yuklenici_adi}`, 275, 370, { align: 'left' })
				.text('Sözleşme Bedeli :', 35, 420)
				.text(`${para(results[0].sozlesme_bedeli)}`, 275, 420, { align: 'left' })
				.text('İhale Tarihi :', 35, 440)
				.text(`${results[0].ihale_tarihi}`, 275, 440, { align: 'left' })
				.text('Kayıt no :', 35, 460)
				.text(`${results[0].kayit_no}`, 275, 460, { align: 'left' })
				.text('Sözleşme Tarihi :', 35, 480)
				.text(`${results[0].sozlesme_tarih}`, 275, 480, { align: 'left' })
				.text('İşyeri Teslim Tarihi :', 35, 500)
				.text(`${results[0].isyeri_teslim_tarihi}`, 275, 500, { align: 'left' })
				.text('Sözleşmeye Göre İşin Süresi :', 35, 520)
				.text(`${results[0].isin_suresi}`, 275, 520, { align: 'left' })
				.text('Sözleşmeye Göre İş Bitim Tarihi :', 35, 540)
				.text(`${results[0].is_bitim_tarihi}`, 275, 540, { align: 'left' })
				.moveDown();
		}
		function reportTable() {
			doc
				.lineCap('butt')
				.moveTo(135, 580)
				.lineTo(135, 665)
				.moveTo(290, 580)
				.lineTo(290, 665)
				.moveTo(600, 580)
				.lineTo(600, 665)
				.moveTo(405, 580)
				.lineTo(405, 665)
				.moveTo(30, 615)
				.lineTo(580, 615)
				.stroke();

			rowReport(doc, 580);

			doc
				.text('Sözleşme Bedeli', 35, 590)
				.text(`${para(results[0].sozlesme_bedeli)}`, 40, 630, { align: 'left' })
				.text('Sözleşme Artış', 175, 580)
				.text('Onayının Tarihi / No su', 155, 592)
				.text('Ek Sözleşme Bedeli', 295, 590)
				.text('Toplam Sözleşme Bedeli', 435, 580)
				.text(`${para(results[0].sozlesme_bedeli)}`, 435, 630, { align: 'left' });
		}
		function reportFooter() {
			doc
				.lineCap('butt')
				.moveTo(175, 670)
				.lineTo(175, 755)
				.moveTo(290, 670)
				.lineTo(290, 755)
				.moveTo(600, 670)
				.lineTo(600, 755)
				.moveTo(385, 670)
				.lineTo(385, 755)
				.moveTo(30, 700)
				.lineTo(580, 700)
				.stroke();

			rowReport(doc, 670);

			doc
				.text('Süre uzatım kararı Tarih', 35, 675)
				.text('Sayı', 205, 675)
				.text('Verilen Süre', 305, 675)
				.text('İş Bitim Tarihi', 435, 675);
		}
		function updateData() {
			const query = `
			INSERT INTO hakedis_raporu 
			(kullanici_id, s_id,  uygulama_yili, tarih, is_adi, proje_no, yuklenici_adi, sozlesme_bedeli, ihale_tarihi, kayit_no, sozlesme_tarih, isyeri_teslim_tarihi, isin_suresi, is_bitim_tarihi) 
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`;
			const values = [
				results[0].kullanici_id,
				results[0].s_id,
				results[0].uygulama_yili,
				results[0].tarih,
				results[0].is_adi,
				results[0].proje_no,
				results[0].yuklenici_adi,
				results[0].sozlesme_bedeli,
				results[0].ihale_tarihi,
				results[0].kayit_no,
				results[0].sozlesme_tarih,
				results[0].isyeri_teslim_tarihi,
				results[0].isin_suresi,
				results[0].is_bitim_tarihi,
			];
			connection.query(query, values, (insertError, insertResults) => {});
		}

		doc.pipe(res);
		console.log('Hakediş raporu başarıyla oluşturuldu');
		res.setHeader('Content-Type', 'application/pdf');
		res.setHeader('Content-Disposition', 'attachment; filename=hakedis_kapagi.pdf');
		doc.end();
	});
}

function hakedisraporuPDF(res, useridInfo, gecikme, fark, var_yok, hakedis_tutari, kesinti, sirket_id) {
	const query = 'select * from hakedis_2 where kullanici_id = ? AND s_id=? order by h_id_2 desc';
	const params = [useridInfo, sirket_id];
	connection.query(query, params, (error, results) => {
		if (error) {
			console.log('Veritabanı hatası:', error);
			res.status(500).send('Veritabanı hatası');
			return;
		}
		let x_h_fiyat_farki = parseInt(fark);
		let x_i_para_cezasi = parseInt(gecikme);
		let x_E_hakedis_tutari = parseInt(hakedis_tutari);
		let x_kesinti = parseInt(kesinti);
		let db_toplam = results
			.map((item) => item.E_hakedis_tutari)
			.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
		let toplam = parseInt(db_toplam) + parseInt(hakedis_tutari);

		let kul_id1 = results[0].kullanici_id;
		let sozlesme_bedeli = results[0].sozlesme_bedeli;
		let isin_suresi = results[0].is_sure;
		let is_adi = results[0].isin_adi;
		let x_F_kdv_20 = (x_E_hakedis_tutari * 20) / 100;
		let x_G_tahakkuk_tutari = x_E_hakedis_tutari + x_F_kdv_20;
		let x_A_soz_tutari = toplam;
		let x_C_toplam = x_A_soz_tutari;
		let x_D_onceki_toplam = db_toplam;

		let x_c_kdv_tev = 0;
		if (var_yok === 'var') {
			x_c_kdv_tev = x_F_kdv_20 * 0.7;
		}
		let x_H_kesintiler = x_c_kdv_tev + x_h_fiyat_farki + x_i_para_cezasi + x_kesinti;
		let x_I_odenecek_tutar = x_G_tahakkuk_tutari - x_H_kesintiler;

		const doc = new PDFDocument({ size: 'A4', margin: 30, font: 'assets/fonts/Roboto.ttf' });

		progressFrame();
		progressHeader();
		progressMiddle();
		progressFooter();
		updateData2();

		function progressFrame() {
			const frameX = 15; // Çerçevenin sol kenarının X koordinatı
			const frameY = 30; // Çerçevenin üst kenarının Y koordinatı
			const frameWidth = 570; // Çerçevenin genişliği
			const frameHeight = 750; // Çerçevenin yüksekliği
			const frameThickness = 1.3; // Çerçevenin kalınlığı piksel cinsinden

			const drawRect = (x, y, width, height, color) => {
				doc.rect(x, y, width, height).fill(color);
			};

			drawRect(frameX, frameY, frameWidth, frameThickness, '#000000'); // Üst çerçeve
			drawRect(
				frameX,
				frameY + frameHeight - frameThickness,
				frameWidth,
				frameThickness,
				'#000000'
			); // Alt çerçeve
			drawRect(
				frameX,
				frameY + frameThickness,
				frameThickness,
				frameHeight - 2 * frameThickness,
				'#000000'
			); // Sol çerçeve
			drawRect(
				frameX + frameWidth - frameThickness,
				frameY + frameThickness,
				frameThickness,
				frameHeight - 2 * frameThickness,
				'#000000'
			); // Sağ çerçeve
		}
		function progressRow(doc, heigth) {
			doc.lineJoin('miter').rect(16.9, heigth, 566.3, 20).stroke();
			return doc;
		}
		function progressRow2(doc, height) {
			doc.lineJoin('miter').rect(55, height, 528, 20).stroke();
			return doc;
		}

		function progressHeader() {
			progressRow(doc, 65);
			progressRow(doc, 85);
			progressRow(doc, 105);
			progressRow(doc, 130);
			progressRow(doc, 150);
			progressRow(doc, 170);
			progressRow(doc, 190);

			doc
				.font('assets/fonts/Roboto-Bold.ttf')
				.text('HAKEDİŞ RAPORU', 65, 10, { align: 'center' })
				.fontSize('9')
				.text(`${results[0].isin_adi}`, 25, 40, { align: 'left' })

				.font('assets/fonts/Roboto-Bold.ttf')
				.text(`${para(x_A_soz_tutari)}`, 455, 70, { align: 'left' })
				.text('C', 25, 110)
				.text('Toplam Tutar ( A + B )', 45, 110)
				.text(`${para(x_C_toplam)}`, 455, 110, { align: 'left' })
				.text(`${para(x_D_onceki_toplam)}`, 455, 135, { align: 'left' })
				.text(`${para(x_E_hakedis_tutari)}`, 455, 155, { align: 'left' })
				.text(`${para(x_F_kdv_20)}`, 455, 175, { align: 'left' })
				.text('G', 25, 195)
				.text('Tahakkuk Tutarı', 45, 195)
				.text(`${para(x_G_tahakkuk_tutari)}`, 455, 195, { align: 'left' })
				.font('assets/fonts/Roboto.ttf')
				.fontSize('9')
				.text('Sayfa No :', 452, 35)
				.text('1', 562, 35)
				.text('Hakediş No :', 452, 50)
				.text(`${results[0].no}`, 562, 50, { width: '100' })
				.fontSize('9')
				.text('A', 25, 70)
				.text('Sözleşme Fiyatları ile Yapılan Hizmet Tutarı', 45, 70)
				.text('B', 25, 90)
				.text('Fiyat Farkı Tutarı', 45, 90)
				.text(`${para(results[0].B_fiyat_farki)}`, 455, 90, { align: 'left' })
				.text('D', 25, 135)
				.text('Bir Önceki Hakedişin Toplam Tutarı', 45, 135)
				.text('E', 25, 155)
				.text('Bu Hakedişin Tutarı', 45, 155)
				.text('F', 25, 175)
				.text('KDV ( E x %20 )', 45, 175);

			doc // SOL DİK
				.lineCap('butt')
				.moveTo(40, 65)
				.lineTo(40, 210)
				.lineCap('butt') // SAĞ DİK
				.moveTo(445, 30)
				.lineTo(445, 450)
				.stroke();
		}
		function progressMiddle() {
			progressRow2(doc, 210);
			progressRow2(doc, 230);
			progressRow2(doc, 250);
			progressRow2(doc, 270);
			progressRow2(doc, 290);
			progressRow2(doc, 310);
			progressRow2(doc, 330);
			progressRow2(doc, 350);
			progressRow2(doc, 370);
			progressRow2(doc, 390); // YENİ KESİNTİ

			doc
				.save() // Dökümanın mevcut durumunu kaydet
				.translate(30, 370) // Başlangıç noktasını ayarla
				.rotate(-90, { origin: [0, 0] }) // Metni belirli bir açıyla döndür
				.font('assets/fonts/Roboto-Bold.ttf')
				.fontSize('9')
				.text('KESİNTİLER VE MAHPUSLAR', 0, 0)
				.restore() // Dökümanı önceki durumuna geri getir

				.font('assets/fonts/Roboto-Bold.ttf')
				.fontSize('9')
				.text(`${para(x_c_kdv_tev)}`, 455, 255, { align: 'left' })
				.text(`${para(x_i_para_cezasi)}`, 455, 375, { align: 'left' })
				.text(`${para(x_h_fiyat_farki)}`, 455, 355, { align: 'left' })

				.font('assets/fonts/Roboto.ttf')
				.fontSize('9')
				.text('a) Gelir/ Kurumlar Vergisi ( E x % .. )', 60, 215)
				.text(`${para(results[0].kullanilmayan)}`, 455, 215, { align: 'left' })
				.text('b) Damga Vergisi ( E - g x % ..)0,00825', 60, 235)
				.text(`${para(results[0].kullanilmayan)}`, 455, 235, { align: 'left' })
				.text('c) KDV Tevfikatı (7/10)', 60, 255)
				.text('d) Sosyal Sigortalar Kurumu Kesintisi', 60, 275)
				.text(`${para(results[0].kullanilmayan)}`, 455, 275, { align: 'left' })
				.text('e) İdare Makinesi Kiraları', 60, 295)
				.text(`${para(results[0].kullanilmayan)}`, 455, 295, { align: 'left' })
				.text('f) Gecikme Cezası', 60, 315)
				.text(`${para(results[0].kullanilmayan)}`, 455, 315, { align: 'left' })
				.text('g) Avans Mahsubu', 60, 335)
				.text(`${para(results[0].kullanilmayan)}`, 455, 335, { align: 'left' })
				.text('h) Bu Hakedişle Ödenen Fiyat Farkı Teminat Kesintisi (%6)', 60, 355)
				.text(
					'ı) İdari Para Cezası ( Ekteki 07/02/2023 Tarihli Tutanakta Belirtldiği Üzere )',
					60,
					375
				)
				.text('k) Kesintiler', 60, 395)
				.text(`${para(x_kesinti)}`, 455, 395, { align: 'left' });

			doc // SOL DİK
				.lineCap('butt')
				.moveTo(55, 230)
				.lineTo(55, 390)
				.stroke();
		}
		function progressFooter() {
			progressRow(doc, 410);
			progressRow(doc, 430);

			doc // SOL DİK
				.lineWidth('1')
				.lineCap('butt')
				.moveTo(40, 410)
				.lineTo(40, 450)
				.stroke();
			doc
				.lineWidth('1.5')
				.lineCap('butt')
				.moveTo(15, 525)
				.lineTo(585, 525)
				.stroke()

				.font('assets/fonts/Roboto-Bold.ttf')
				.fontSize('10')
				.text('YÜKLENİCİ', 275, 455, { underline: true })
				.text('KONTROL TEŞKİLATI', 260, 540, { underline: true, align: 'left' })
				.text('ŞUBE MÜDÜRÜ', 50, 650, { underline: true, align: 'left' })
				.text('DAİRE BAŞKANI', 460, 650, { underline: true, align: 'left' })
				.text('GENEL MÜDÜR YARDIMCISI', 235, 710, { underline: true, align: 'left' })

				.fontSize('9')
				.text('H', 25, 415)
				.text('Kesintiler ve Mahpuslar Toplamı', 45, 415)
				.text(`${para(x_H_kesintiler)}`, 455, 415, { align: 'rigth' })
				.text('I', 25, 435)
				.text('Yükleniciye Ödenecek Tutar ( G - H )', 45, 435)
				.text(`${para(x_I_odenecek_tutar)}`, 455, 435, { align: 'left' })

				.font('assets/fonts/Roboto.ttf')
				.fontSize('8')
				.text('|dismakamtarih1|', 270, 480)
				.text('|dismakamunvanad1|', 265, 510)
				.text('|makamtarih6|', 50, 560)
				.text('|makam6|', 55, 590)
				.text('|makamtarih5|', 270, 565)
				.text('|makam5|', 275, 595)
				.text('|makamtarih4|', 460, 565)
				.text('|makam4|', 470, 595)
				.text('|makamtarih3|', 55, 675)
				.text('|makamtarih2|', 470, 675)
				.text('|makamtarih1|', 260, 735)
				.font('assets/fonts/Roboto-Bold.ttf')
				.text('|makam3|', 60, 705)
				.text('|makam2|', 475, 705)
				.text('|makam1|', 265, 765);
		}
		function updateData2() {
			let sql = `INSERT INTO haz_hakedis_2 (kullanici_id, s_id, isin_adi, sozlesme_bedeli, is_sure, A_soz_tutari, C_toplam, D_onceki_toplam, E_hakedis_tutari, F_kdv_20, G_tahakkuk_tutari, c_kdv_tev, H_kesintiler, I_odenecek_tutar, h_fiyat_farki, i_para_cezasi, k_kesintiler)VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
			let values = [
				kul_id1,
				sirket_id,
				is_adi,
				sozlesme_bedeli,
				isin_suresi,
				x_A_soz_tutari,
				x_C_toplam,
				x_D_onceki_toplam,
				x_E_hakedis_tutari,
				x_F_kdv_20,
				x_G_tahakkuk_tutari,
				x_c_kdv_tev,
				x_H_kesintiler,
				x_I_odenecek_tutar,
				x_h_fiyat_farki,
				x_i_para_cezasi,
				x_kesinti,
			];
			connection.query(sql, values, (err, result) => {
				if (err) throw err;
				console.log('Değerler başarıyla eklendi.');
			});
		}

		doc.pipe(res);
		console.log('Hakediş raporu-2 başarıyla oluşturuldu');
		res.setHeader('Content-Type', 'application/pdf');
		res.setHeader('Content-Disposition', 'attachment; filename=hakedis_raporu.pdf');
		doc.end();
	});
}

function yapilanislerPDF(res, useridInfo, hakedis_tutari_2, sirket_id) {
	const query = 'select * from hakedis_3 where kullanici_id=? AND s_id=? order by h_id_3 desc';
	const params = [useridInfo, sirket_id];
	connection.query(query, params, (error, results) => {
		if (error) {
			console.log('Veritabanı hatası:', error);
			res.status(500).send('Veritabanı hatası');
			return;
		}
		let x_hakedis_tutari_2 = parseInt(hakedis_tutari_2);
		let db_toplam = results
			.map((item) => item.Gas)
			.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
		let toplam = parseInt(db_toplam) + x_hakedis_tutari_2;

		let kul_id = results[0].kullanici_id;
		let is_ad = results[0].isin_adi;
		let soz_bed = results[0].sozlesme_bedeli;
		let is_sure = results[0].isin_suresi;

		let Gas = x_hakedis_tutari_2;
		let Bas = results[0].Bas + 1;
		let Cas = toplam;
		let Das = results[0].Das + 1;
		let Eas = db_toplam;
		let Fas = Bas - Das;

		updateData3();
		pdf3_generate();

		function updateData3() {
			let sql = `INSERT INTO haz_hakedis_3_update (kullanici_id, s_id, isin_adi, sozlesme_bedeli, isin_suresi, Gas, Bas, Cas, Das, Eas, Fas) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
			let values = [kul_id, sirket_id, is_ad, soz_bed, is_sure, Gas, Bas, Cas, Das, Eas, Fas];
			connection.query(sql, values, (err, result) => {
				if (err) throw err;
				console.log('Değerler başarıyla eklendi.');
			});
		}
	});

	function pdf3_generate() {
		const sql =
			'select * from asil_hakedis_3 where kullanici_id=? AND s_id=? order by a_h_id_3 desc';
		const params = [useridInfo, sirket_id];
		connection.query(sql, params, (error, results) => {
			if (error) {
				console.log('Veritabanı hatası:', error);
				res.status(500).send('Veritabanı hatası');
				return;
			}
			const doc = new PDFDocument({ size: 'A4', margin: 30, font: 'assets/fonts/Roboto.ttf' });
			doc.page.dictionary.data.Rotate = 90;

			generateFrame();
			header();
			Information();
			footer();
			function rowInformation(heigth) {
				doc.lineJoin('miter').rect(-128, heigth, 805.5, 11).stroke();
			}
			function lineInformation(x1, y1, x2, y2) {
				doc.lineCap('butt').moveTo(y1, x1).lineTo(y2, x2).stroke();
			}
			function generateFrame() {
				const frameX = 15; // Çerçevenin sol kenarının X koordinatı
				const frameY = 20; // Çerçevenin üst kenarının Y koordinatı
				const frameWidth = 450; // Çerçevenin genişliği 50
				const frameHeight = 810; // Çerçevenin yüksekliği
				const frameThickness = 2; // Çerçevenin kalınlığı piksel cinsinden

				const drawRect = (x, y, width, height, color) => {
					doc.rect(x, y, width, height).fill(color);
				};

				drawRect(frameX, frameY, frameWidth, frameThickness, '#000000'); // Üst çerçeve
				drawRect(
					frameX,
					frameY + frameHeight - frameThickness,
					frameWidth,
					frameThickness,
					'#000000'
				); // Alt çerçeve
				drawRect(
					frameX,
					frameY + frameThickness,
					frameThickness,
					frameHeight - 2 * frameThickness,
					'#000000'
				); // Sol çerçeve
				drawRect(
					frameX + frameWidth - frameThickness,
					frameY + frameThickness,
					frameThickness,
					frameHeight - 2 * frameThickness,
					'#000000'
				); // Sağ çerçeve
			}
			function header() {
				doc
					.lineCap('butt')
					.moveTo(40, 830)
					.lineTo(40, 20)
					.moveTo(55, 830)
					.lineTo(55, 20)
					.moveTo(95, 830)
					.lineTo(95, 20)
					.moveTo(65, 500)
					.lineTo(65, 20)
					.moveTo(40, 200)
					.lineTo(55, 200)
					.moveTo(55, 810) // sıra no R
					.lineTo(95, 810)
					.moveTo(55, 500) // işin tanımı R
					.lineTo(95, 500)
					.moveTo(55, 415) // sözleşme bedeli R
					.lineTo(95, 415)
					.moveTo(55, 355) //Gerçekleşen toplam imalat R
					.lineTo(95, 355)
					.moveTo(55, 280) //toplam İmalat Tutarı R
					.lineTo(95, 280)
					.moveTo(55, 215) //Önceki Hakediş Toplam İmalat R
					.lineTo(95, 215)
					.moveTo(55, 150) //önceki hakediş toplam imalat tutarı R
					.lineTo(95, 150)
					.moveTo(55, 100) // bu hakediş imalat R
					.lineTo(95, 100)
					.stroke()
					.rotate(-90, { origin: [350, 350] })
					.font('assets/fonts/Roboto-Bold.ttf')
					.fontSize('6')
					.text(`${results[0].isin_adi}`, -125, 45)
					.text('A', 240, 57)
					.text('B', 315, 57)
					.text('C=(AxB)', 365, 57)
					.text('D', 445, 57)
					.text('E=(AxD)', 505, 57)
					.text('F=(B-D)', 565, 57, { width: 100 })
					.text('G=(AxF)', 615, 57)
					.fontSize('8')
					.text('YAPILAN İŞLER LİSTESİ', 230, 20)
					.font('assets/fonts/Roboto.ttf')
					.fontSize('7')
					.text('(Teklif Birim Fiyatlı Hizmet İçin)', 225, 30)
					.fontSize('6')
					.text('Sayfa No: 3', 507, 44)
					.text('Hakediş No:', 575, 44)
					.text(`${results[0].no}`, 612, 44)
					.text('Sıra No', -125, 67, { width: 15, align: 'left' })
					.text('İşin Tanımı', 33, 72)
					.text('Sözleşme Bedeli', 220, 72)
					.text('Gerçekleşen Toplam İmalat', 300, 69, { width: 40, align: 'center' })
					.text('Toplam İmalat Tutarı', 360, 69, { width: 40, align: 'center' })
					.text('Önceki Hakediş Toplam İmalat', 425, 69, { width: 50, align: 'center' })
					.text('Önceki Hakediş Toplam İmalat Tutarı', 490, 69, { width: 50, align: 'center' })
					.text('Bu Hakediş İmalat', 557, 69, { width: 40, align: 'center' })
					.text('Bu Hakediş Tutarı', 615, 72, { width: 100 });
			}
			function Information() {
				let x = 0;
				results.reverse().forEach((e) => {
					rowInformation(95 + x);
					lineInformation(93 + x, -110, 106 + x, -110);
					lineInformation(93 + x, 200, 106 + x, 200);
					lineInformation(93 + x, 285, 106 + x, 285);
					lineInformation(93 + x, 345, 106 + x, 345);
					lineInformation(93 + x, 420, 106 + x, 420);
					lineInformation(93 + x, 485, 106 + x, 485);
					lineInformation(93 + x, 550, 106 + x, 550);
					lineInformation(93 + x, 600, 106 + x, 600);
					doc
						.text(`${e.no}`, -125, 97 + x)
						.text(`${e.isin_adi}`, -107, 97 + x)
						.text(`${para(e.sozlesme_bedeli)}`, 220, 97 + x)
						.text(`${e.Bas - 1}`, 300, 97 + x)
						.text(`${para(e.Cas)}`, 360, 97 + x)
						.text(`${e.Das - 1}`, 425, 97 + x)
						.text(`${para(e.Eas)}`, 490, 97 + x)
						.text(`${e.Fas}`, 557, 97 + x, { width: 100 })
						.text(`${para(e.Gas)}`, 615, 97 + x);
					x = x + 11;
				});
			}
			function footer() {
				doc
					.font('assets/fonts/Roboto.ttf')
					.fontSize('8')
					.text('|dismakamunvanad1|', 240, 420)

					.text('|makamtarih6|', -70, 490)
					.text('|makam6|', -65, 520)
					.text('|makamtarih5|', 70, 490)
					.text('|makam5|', 75, 520)
					.text('|makamtarih4|', 255, 490)
					.text('|makam4|', 260, 520)
					.text('|makamtarih3|', 395, 490)
					.text('|makam3|', 400, 520)
					.text('|makamtarih2|', 520, 490, { width: 100 })
					.text('|makam2|', 525, 520)
					.font('assets/fonts/Roboto-Bold.ttf')
					.text('|dismakamtarih1|', 245, 390);
			}

			doc.pipe(res);
			console.log('Hakediş raporu-3 başarıyla oluşturuldu');
			res.setHeader('Content-Type', 'application/pdf');
			res.setHeader('Content-Disposition', 'attachment; filename=yapilan_isler_listesi.pdf');
			doc.end();
		});
	}
}

function infoPDF(res, no, s_id) {
	let query = 'select * from haz_hakedis_2 where no=? and s_id=?';
	let params = [no, s_id];
	connection.query(query, params, (err, results) => {
		if (err) {
			console.log('Veritabanı hatası:', err);
			res.status(500).send('Veritabanı hatası');
			return;
		}
		const doc = new PDFDocument({ size: 'A4', margin: 30, font: 'assets/fonts/Roboto.ttf' });
		progressFrame();
		progressHeader();
		progressMiddle();
		progressFooter();
		function progressFrame() {
			const frameX = 15; // Çerçevenin sol kenarının X koordinatı
			const frameY = 30; // Çerçevenin üst kenarının Y koordinatı
			const frameWidth = 570; // Çerçevenin genişliği
			const frameHeight = 750; // Çerçevenin yüksekliği
			const frameThickness = 1.3; // Çerçevenin kalınlığı piksel cinsinden

			const drawRect = (x, y, width, height, color) => {
				doc.rect(x, y, width, height).fill(color);
			};

			drawRect(frameX, frameY, frameWidth, frameThickness, '#000000'); // Üst çerçeve
			drawRect(
				frameX,
				frameY + frameHeight - frameThickness,
				frameWidth,
				frameThickness,
				'#000000'
			); // Alt çerçeve
			drawRect(
				frameX,
				frameY + frameThickness,
				frameThickness,
				frameHeight - 2 * frameThickness,
				'#000000'
			); // Sol çerçeve
			drawRect(
				frameX + frameWidth - frameThickness,
				frameY + frameThickness,
				frameThickness,
				frameHeight - 2 * frameThickness,
				'#000000'
			); // Sağ çerçeve
		}
		function progressRow(doc, heigth) {
			doc.lineJoin('miter').rect(16.9, heigth, 566.3, 20).stroke();
			return doc;
		}
		function progressRow2(doc, height) {
			doc.lineJoin('miter').rect(55, height, 528, 20).stroke();
			return doc;
		}
		function para(number, fractionDigits = 2) {
			const formattedNumber = parseFloat(number).toFixed(fractionDigits);
			return formattedNumber.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' ₺';
		}
		function progressHeader() {
			progressRow(doc, 65);
			progressRow(doc, 85);
			progressRow(doc, 105);
			progressRow(doc, 130);
			progressRow(doc, 150);
			progressRow(doc, 170);
			progressRow(doc, 190);

			doc
				.font('assets/fonts/Roboto-Bold.ttf')
				.text('HAKEDİŞ RAPORU', 65, 10, { align: 'center' })
				.fontSize('9')
				.text(`${results[0].isin_adi}`, 25, 40, { align: 'left' })

				.font('assets/fonts/Roboto-Bold')
				.text(`${para(results[0].A_soz_tutari)}`, 455, 70, { align: 'left' })
				.text('C', 25, 110)
				.text('Toplam Tutar ( A + B )', 45, 110)
				.text(`${para(results[0].C_toplam)}`, 455, 110, { align: 'left' })
				.text(`${para(results[0].D_onceki_toplam)}`, 455, 135, { align: 'left' })
				.text(`${para(results[0].E_hakedis_tutari)}`, 455, 155, { align: 'left' })
				.text(`${para(results[0].F_kdv_20)}`, 455, 175, { align: 'left' })
				.text('G', 25, 195)
				.text('Tahakkuk Tutarı', 45, 195)
				.text(`${para(results[0].G_tahakkuk_tutari)}`, 455, 195, { align: 'left' })
				.font('assets/fonts/Roboto.ttf')
				.fontSize('9')
				.text('Sayfa No :', 452, 35)
				.text('1', 562, 35)
				.text('Hakediş No :', 452, 50)
				.text(`${results[0].no}`, 562, 50, { width: '100' })
				.fontSize('9')
				.text('A', 25, 70)
				.text('Sözleşme Fiyatları ile Yapılan Hizmet Tutarı', 45, 70)
				.text('B', 25, 90)
				.text('Fiyat Farkı Tutarı', 45, 90)
				.text(`${para(results[0].B_fiyat_farki)}`, 455, 90, { align: 'left' })
				.text('D', 25, 135)
				.text('Bir Önceki Hakedişin Toplam Tutarı', 45, 135)
				.text('E', 25, 155)
				.text('Bu Hakedişin Tutarı', 45, 155)
				.text('F', 25, 175)
				.text('KDV ( E x %20 )', 45, 175);

			doc // SOL DİK
				.lineCap('butt')
				.moveTo(40, 65)
				.lineTo(40, 210)
				.lineCap('butt') // SAĞ DİK
				.moveTo(445, 30)
				.lineTo(445, 450)
				.stroke();
		}
		function progressMiddle() {
			progressRow2(doc, 210);
			progressRow2(doc, 230);
			progressRow2(doc, 250);
			progressRow2(doc, 270);
			progressRow2(doc, 290);
			progressRow2(doc, 310);
			progressRow2(doc, 330);
			progressRow2(doc, 350);
			progressRow2(doc, 370);
			progressRow2(doc, 390); // YENİ KESİNTİ

			doc
				.save() // Dökümanın mevcut durumunu kaydet
				.translate(30, 370) // Başlangıç noktasını ayarla
				.rotate(-90, { origin: [0, 0] }) // Metni belirli bir açıyla döndür
				.font('assets/fonts/Roboto-Bold.ttf')
				.fontSize('9')
				.text('KESİNTİLER VE MAHPUSLAR', 0, 0)
				.restore() // Dökümanı önceki durumuna geri getir

				.font('assets/fonts/Roboto-Bold.ttf')
				.fontSize('9')
				.text(`${para(results[0].c_kdv_tev)}`, 455, 255, { align: 'left' })
				.text(`${para(results[0].i_para_cezasi)}`, 455, 375, { align: 'left' })
				.text(`${para(results[0].h_fiyat_farki)}`, 455, 355, { align: 'left' })

				.font('assets/fonts/Roboto.ttf')
				.fontSize('9')
				.text('a) Gelir/ Kurumlar Vergisi ( E x % .. )', 60, 215)
				.text(`${para(results[0].kullanilmayan)}`, 455, 215, { align: 'left' })
				.text('b) Damga Vergisi ( E - g x % ..)0,00825', 60, 235)
				.text(`${para(results[0].kullanilmayan)}`, 455, 235, { align: 'left' })
				.text('c) KDV Tevfikatı (7/10)', 60, 255)
				.text('d) Sosyal Sigortalar Kurumu Kesintisi', 60, 275)
				.text(`${para(results[0].kullanilmayan)}`, 455, 275, { align: 'left' })
				.text('e) İdare Makinesi Kiraları', 60, 295)
				.text(`${para(results[0].kullanilmayan)}`, 455, 295, { align: 'left' })
				.text('f) Gecikme Cezası', 60, 315)
				.text(`${para(results[0].kullanilmayan)}`, 455, 315, { align: 'left' })
				.text('g) Avans Mahsubu', 60, 335)
				.text(`${para(results[0].kullanilmayan)}`, 455, 335, { align: 'left' })
				.text('h) Bu Hakedişle Ödenen Fiyat Farkı Teminat Kesintisi (%6)', 60, 355)
				.text(
					'ı) İdari Para Cezası ( Ekteki 07/02/2023 Tarihli Tutanakta Belirtldiği Üzere )',
					60,
					375
				)
				.text('k) Kesintiler', 60, 395)
				.text(`${para(results[0].k_kesintiler)}`, 455, 395, { align: 'left' });

			doc // SOL DİK
				.lineCap('butt')
				.moveTo(55, 230)
				.lineTo(55, 390)
				.stroke();
		}
		function progressFooter() {
			progressRow(doc, 410);
			progressRow(doc, 430);

			doc // SOL DİK
				.lineWidth('1')
				.lineCap('butt')
				.moveTo(40, 410)
				.lineTo(40, 450)
				.stroke();
			doc
				.lineWidth('1.5')
				.lineCap('butt')
				.moveTo(15, 525)
				.lineTo(585, 525)
				.stroke()

				.font('assets/fonts/Roboto-Bold.ttf')
				.fontSize('10')
				.text('YÜKLENİCİ', 275, 455, { underline: true })
				.text('KONTROL TEŞKİLATI', 260, 540, { underline: true, align: 'left' })
				.text('ŞUBE MÜDÜRÜ', 50, 650, { underline: true, align: 'left' })
				.text('DAİRE BAŞKANI', 460, 650, { underline: true, align: 'left' })
				.text('GENEL MÜDÜR YARDIMCISI', 235, 710, { underline: true, align: 'left' })

				.fontSize('9')
				.text('H', 25, 415)
				.text('Kesintiler ve Mahpuslar Toplamı', 45, 415)
				.text(`${para(results[0].H_kesintiler)}`, 455, 415, { align: 'rigth' })
				.text('I', 25, 435)
				.text('Yükleniciye Ödenecek Tutar ( G - H )', 45, 435)
				.text(`${para(results[0].I_odenecek_tutar)}`, 455, 435, { align: 'left' })

				.font('assets/fonts/Roboto.ttf')
				.fontSize('8')
				.text('|dismakamtarih1|', 270, 480)
				.text('|dismakamunvanad1|', 265, 510)
				.text('|makamtarih6|', 50, 560)
				.text('|makam6|', 55, 590)
				.text('|makamtarih5|', 270, 565)
				.text('|makam5|', 275, 595)
				.text('|makamtarih4|', 460, 565)
				.text('|makam4|', 470, 595)
				.text('|makamtarih3|', 55, 675)
				.text('|makamtarih2|', 470, 675)
				.text('|makamtarih1|', 260, 735)
				.font('assets/fonts/Roboto-Bold.ttf')
				.text('|makam3|', 60, 705)
				.text('|makam2|', 475, 705)
				.text('|makam1|', 265, 765);
		}
		doc.pipe(res);
		console.log('Hakediş raporu-2 başarıyla oluşturuldu');
		res.setHeader('Content-Type', 'application/pdf');
		res.setHeader(
			'Content-Disposition',
			`attachment; filename=${results[0].isin_adi}_hakedis_raporu.pdf`
		);
		doc.end();
	});
}

// MySQL bağlantısını kapat
// connection.end();
app.listen(5001, () => {
	console.log('Server http://localhost:5001 adresinde başladı');
});
