const mysql = require('mysql');
const express = require('express');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const session = require('express-session');
const app = express();
app.use('/assets', express.static('assets'));
app.use(express.urlencoded({ extended: true }));
app.use(
	session({
		secret: 'GIZLI', // Bu gizli anahtarı değiştirin
		resave: false,
		saveUninitialized: true,
	})
);

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

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/index.html');
});
app.get('/register', (req, res) => {
	res.sendFile(__dirname + '/register.html');
});
app.get('/welcome/:userId', (req, res) => {
	res.sendFile(__dirname + '/welcome.html');
});
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Oturum sonlandırma hatası:', err);
    }
    res.redirect('/'); 
  });
});

app.get('/generate-pdf/:userId', (req, res) => {
	const useridInfo = req.params.userId;
	generatePDF(res, useridInfo);
});
app.get('/generate-pdf2/:userId', (req, res) => {
	const useridInfo = req.params.userId;
	generatePDF2(res, useridInfo);
});
app.get('/generate-pdf3/:userId', (req, res) => {
	const useridInfo = req.params.userId;
	generatePDF3(res, useridInfo);
});

app.post('/', (req, res) => {
	var username = req.body.username;
	var password = req.body.password;

	connection.query(
		'select * from userTable where username = ? and password = ?',
		[username, password],
		function (error, results, fields) {
			if (results.length > 0) {
				// Kullanıcı adı ve şifre doğru, kullanıcı kimliğini alalım
				const userId = results[0].userId;
				req.session.userId = userId;
				res.redirect(`/welcome/${userId}`);
			} else {
				res.redirect('/');
			}
			res.end();
		}
	);
});
app.post('/register', (req, res) => {
	var username = req.body.username;
	var password = req.body.password;
	var isim = req.body.password;
	var soyisim = req.body.password;
	var eposta = req.body.password;
	var telefon = req.body.password;
	var adres = req.body.password;

	// Veritabanına kullanıcıyı kaydetme işlemi
	connection.query(
		'INSERT INTO userTable (username, password, isim, soyisim, eposta, telefon, adres) VALUES (?, ?, ?, ?, ?, ?, ?)',
		[username, password, isim, soyisim, eposta, telefon, adres],
		function (error, results, fields) {
			if (error) {
				console.log('Kayıt olma hatası:', error);
				res.redirect('/');
			} else {
				// Kayıt başarılıysa kullanıcı kimliğini alalım
				const userId = results.insertId;
				res.redirect('/welcome/' + userId);
			}
			res.end();
		}
	);
});

var date = new Date();
let gun = date.getDate();
let ay = date.getMonth() + 1; 
const yil = date.getFullYear();
function gunx(){
	if(gun<10){
		return "0"+gun;
	}
	else{return gun;}
}
function ayx(){
	if(ay<10){
		return "0"+ay;
	}else{return ay}
}

app.post('/welcome', async (req, res) => {
	const userId = req.session.userId;
	var uygulama_yili = yil;
	var tarih =`${gunx(gun)}.${ayx(ay)}.${yil}`;
	var is_adi = req.body.is_adi;
	var proje_no = req.body.proje_no;
	var yuklenici_adi = req.body.yuklenici_adi;
	var sozlesme_bedeli = req.body.sozlesme_bedeli;
	var ihale_tarihi = req.body.ihale_tarihi;
	var kayit_no = req.body.kayit_no;
	var sozlesme_tarih = req.body.sozlesme_tarih;
	var isyeri_teslim_tarihi = req.body.isyeri_teslim_tarihi;
	var isin_suresi = req.body.isin_suresi;
	var is_bitim_tarihi = req.body.is_bitim_tarihi;

	var Gas = sozlesme_bedeli / isin_suresi;
	var Cas = Gas;

	var E_hakedis_tutari = sozlesme_bedeli / isin_suresi;
	var F_kdv_20 = (E_hakedis_tutari * 20) / 100;
	var G_tahakkuk_tutari = E_hakedis_tutari + F_kdv_20;
	var c_kdv_tev = F_kdv_20 * 0.7;
	var A_soz_tutari = E_hakedis_tutari;
	var B_fiyat_farki = 0;
	var C_toplam = A_soz_tutari + B_fiyat_farki;
	var D_onceki_toplam = E_hakedis_tutari * 0;
	// var ı_para_cezasi = (sozlesme_bedeli*0.001)*(gecikme günü)
	var H_kesintiler = c_kdv_tev;
	var I_odenecek_tutar = G_tahakkuk_tutari - H_kesintiler;

	try {
		await insertHakedis_1(
			userId,
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

		await insertHakedis_2(
			userId,
			is_adi,
			sozlesme_bedeli,
			isin_suresi,
			A_soz_tutari,
			B_fiyat_farki,
			C_toplam,
			D_onceki_toplam,
			Gas,
			F_kdv_20,
			G_tahakkuk_tutari,
			c_kdv_tev,
			H_kesintiler,
			I_odenecek_tutar
		);

		await insertHakedis_3(userId, is_adi, sozlesme_bedeli, isin_suresi, Gas, Cas);

		console.log('Veriler başarıyla eklendi');
		res.redirect(`/welcome/${userId}`);
	} catch (error) {
		console.log('Veriler eklenirken bir hata oluştu');
		console.log(error);
		res.redirect(`/welcome/${userId}`);
	}
});

app.post('/generate-pdf', (req, res) => {
	const x = req.session.userId;
	connection.query(
		'select kullanici_id from hakedis_raporu where kullanici_id=?',
		[x],
		function (error, results) {
			if (results.length > 0) {
				const userId = results[0].kullanici_id;
				res.redirect(`/generate-pdf/${userId}`);
			} else {
				console.log(error);
			}
			res.end();
		}
	);
});
app.post('/generate-pdf2', (req, res) => {
	const x = req.session.userId;
	connection.query(
		'select kullanici_id from hakedis_2 where kullanici_id=?',
		[x],
		(error, results) => {
			if (results.length > 0) {
				const userId = results[0].kullanici_id;
				res.redirect(`/generate-pdf2/${userId}`);
			} else {
				console.log(error);
			}
			res.end();
		}
	);
});
app.post('/generate-pdf3', (req, res) => {
	const x = req.session.userId;
	connection.query(
		'select kullanici_id from hakedis_3 where kullanici_id=?',
		[x],
		(error, results) => {
			if (results.length > 0) {
				const userId = results[0].kullanici_id;
				res.redirect(`/generate-pdf3/${userId}`);
			} else {
				console.log(error);
			}
			res.end();
		}
	);
});

function insertHakedis_1(
	userId,
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
		connection.query(
			'INSERT INTO hakedis_raporu (kullanici_id, uygulama_yili, tarih, is_adi, proje_no, yuklenici_adi, sozlesme_bedeli, ihale_tarihi, kayit_no, sozlesme_tarih, isyeri_teslim_tarihi, isin_suresi, is_bitim_tarihi) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
			[
				userId,
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
			],
			function (error, results, fields) {
				if (error) {
					reject(error);
				} else {
					resolve();
				}
			}
		);
	});
}

function insertHakedis_2(
	userId,
	is_adi,
	sozlesme_bedeli,
	isin_suresi,
	A_soz_tutari,
	B_fiyat_farki,
	C_toplam,
	D_onceki_toplam,
	Gas,
	F_kdv_20,
	G_tahakkuk_tutari,
	c_kdv_tev,
	H_kesintiler,
	I_odenecek_tutar
) {
	return new Promise((resolve, reject) => {
		connection.query(
			'INSERT INTO hakedis_2 (kullanici_id, isin_adi, sozlesme_bedeli, is_sure, A_soz_tutari, B_fiyat_farki, C_toplam, D_onceki_toplam, E_hakedis_tutari, F_kdv_20, G_tahakkuk_tutari, c_kdv_tev, H_kesintiler, I_odenecek_tutar) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
			[
				userId,
				is_adi,
				sozlesme_bedeli,
				isin_suresi,
				A_soz_tutari,
				B_fiyat_farki,
				C_toplam,
				D_onceki_toplam,
				Gas,
				F_kdv_20,
				G_tahakkuk_tutari,
				c_kdv_tev,
				H_kesintiler,
				I_odenecek_tutar,
			],
			function (error, results, fields) {
				if (error) {
					reject(error);
				} else {
					resolve();
				}
			}
		);
	});
}

function insertHakedis_3(userId, is_adi, sozlesme_bedeli, isin_suresi, Gas, Cas) {
	return new Promise((resolve, reject) => {
		connection.query(
			'INSERT INTO hakedis_3 (kullanici_id, isin_adi, sozlesme_bedeli, isin_suresi, Gas, Cas) VALUES (?, ?, ?, ?, ?, ?)',
			[userId, is_adi, sozlesme_bedeli, isin_suresi, Gas, Cas],
			function (error, results, fields) {
				if (error) {
					reject(error);
				} else {
					resolve();
				}
			}
		);
	});
}

function generatePDF(res, useridInfo) {
	const sql = 'SELECT * FROM hakedis_raporu WHERE kullanici_id = ? ORDER BY h_id DESC LIMIT 1';
	const params = useridInfo;
	connection.query(sql, params, (error, results) => {
		if (error) {
			console.log('Veritabanı hatası:', error);
			res.status(500).send('Veritabanı hatası');
			return;
		}
		const doc = new PDFDocument({ size: 'A4', margin: 30, font: 'Roboto.ttf' });

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
		function para(number, fractionDigits = 2) {
			return number.toFixed(fractionDigits).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' ₺';
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
		function updateData(){
			const sqlInsert = `
			INSERT INTO hakedis_raporu 
			(kullanici_id,  uygulama_yili, tarih, is_adi, proje_no, yuklenici_adi, sozlesme_bedeli, ihale_tarihi, kayit_no, sozlesme_tarih, isyeri_teslim_tarihi, isin_suresi, is_bitim_tarihi) 
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`;
		const insertParams = [
			results[0].kullanici_id,
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
			results[0].is_bitim_tarihi
		];
		connection.query(sqlInsert, insertParams, (insertError, insertResults) => {
		});
		}

		doc.pipe(res);
		console.log('Hakediş raporu başarıyla oluşturuldu');
		res.setHeader('Content-Type', 'application/pdf');
		res.setHeader('Content-Disposition', 'attachment; filename=hakedis_kapagi.pdf');
		doc.end();
	});
}

function generatePDF2(res, useridInfo) {
	const sql = 'select * from hakedis_2 where kullanici_id=? order by h_id_2 desc limit 1';
	const params = useridInfo;
	connection.query(sql, params, (error, results) => {
		if (error) {
			console.log('Veritabanı hatası:', error);
			res.status(500).send('Veritabanı hatası');
			return;
		}
		const doc = new PDFDocument({ size: 'A4', margin: 30, font: 'Roboto.ttf' });
		// SINIR EKLENECEK !!
		progressFrame();
		progressHeader();
		progressMiddle();
		progressFooter();
		updateData2();

		function progressFrame() {
			const frameX = 15; // Çerçevenin sol kenarının X koordinatı
			const frameY = 50; // Çerçevenin üst kenarının Y koordinatı
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
			doc.lineJoin('miter').rect(17.2, heigth, 566.3, 20).stroke();
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
			progressRow(doc, 90);
			progressRow(doc, 110);
			progressRow(doc, 130);
			progressRow(doc, 150);
			progressRow(doc, 170);
			progressRow(doc, 190);
			progressRow(doc, 210);

			doc
				.font('Roboto-Bold.ttf')
				.text('HAKEDİŞ RAPORU', { align: 'center' })
				.fontSize('9')
				.text(`${results[0].isin_adi}`, 25, 65, { align: 'left' })

				.font('Roboto-Bold')
				.text(`${para(results[0].A_soz_tutari)}`, 455, 95, { align: 'left' })
				.text('C', 25, 135)
				.text('Toplam Tutar ( A + B )', 45, 135)
				.text(`${para(results[0].C_toplam)}`, 455, 135, { align: 'left' })
				.text(`${para(results[0].D_onceki_toplam)}`, 455, 155, { align: 'left' })
				.text(`${para(results[0].E_hakedis_tutari)}`, 455, 175, { align: 'left' })
				.text(`${para(results[0].F_kdv_20)}`, 455, 195, { align: 'left' })
				.text('G', 25, 215)
				.text('Tahakkuk Tutarı', 45, 215)
				.text(`${para(results[0].G_tahakkuk_tutari)}`, 455, 215, { align: 'left' })
				.font('Roboto.ttf')
				.fontSize('9')
				.text('Sayfa No :', 452, 55)
				.text('1', 562, 55)
				.text('Hakediş No :', 452, 77)
				.text(`${results[0].no}`, 562, 77,{width:'100'})
				.fontSize('11')
				.text('A', 25, 95)
				.text('Sözleşme Fiyatları ile Yapılan Hizmet Tutarı :', 45, 95)
				.text('B', 25, 115)
				.text('Fiyat Farkı Tutarı', 45, 115)
				.text(`${para(results[0].B_fiyat_farki)}`, 455, 115, { align: 'left' })
				.text('D', 25, 155)
				.text('Bir Önceki Hakedişin Toplam Tutarı', 45, 155)
				.text('E', 25, 175)
				.text('Bu Hakedişin Tutarı', 45, 175)
				.text('F', 25, 195)
				.text('KDV ( E x %20 )', 45, 195);

			doc // SOL DİK
				.lineCap('butt')
				.moveTo(40, 90)
				.lineTo(40, 230)
				.stroke();
			doc // SAĞ DİK
				.lineCap('butt')
				.moveTo(445, 50)
				.lineTo(445, 450)
				.stroke();
		}
		function progressMiddle() {
			progressRow2(doc, 230);
			progressRow2(doc, 250);
			progressRow2(doc, 270);
			progressRow2(doc, 290);
			progressRow2(doc, 310);
			progressRow2(doc, 330);
			progressRow2(doc, 350);
			progressRow2(doc, 370);
			progressRow2(doc, 390);

			doc
				.save() // Dökümanın mevcut durumunu kaydet
				.translate(25, 400) // Başlangıç noktasını ayarla
				.rotate(-90, { origin: [0, 0] }) // Metni belirli bir açıyla döndür
				.font('Roboto-Bold.ttf')
				.fontSize('12')
				.text('KESİNTİLER VE MAHPUSLAR', 0, 0)
				.restore() // Dökümanı önceki durumuna geri getir

				.font('Roboto-Bold.ttf')
				.fontSize('10')
				.text(`${para(results[0].c_kdv_tev)}`, 455, 275, { align: 'left' })
				.text(`${para(results[0].i_para_cezasi)}`, 455, 395, { align: 'left' })

				.font('Roboto.ttf')
				.fontSize('10')
				.text('a) Gelir/ Kurumlar Vergisi ( E x % .. )', 60, 235)
				.text(`${para(results[0].kullanilmayan)}`, 455, 235, { align: 'left' })
				.text('b) Damga Vergisi ( E - g x % ..)0,00825', 60, 255)
				.text(`${para(results[0].kullanilmayan)}`, 455, 255, { align: 'left' })
				.text('c) KDV Tevfikatı (7/10)', 60, 275)
				.text('d) Sosyal Sigortalar Kurumu Kesintisi', 60, 295)
				.text(`${para(results[0].kullanilmayan)}`, 455, 295, { align: 'left' })
				.text('e) İdare Makinesi Kiraları', 60, 315)
				.text(`${para(results[0].kullanilmayan)}`, 455, 315, { align: 'left' })
				.text('f) Gecikme Cezası', 60, 335)
				.text(`${para(results[0].kullanilmayan)}`, 455, 335, { align: 'left' })
				.text('g) Avans Mahsubu', 60, 355)
				.text(`${para(results[0].kullanilmayan)}`, 455, 355, { align: 'left' })
				.text('h) Bu Hakedişle Ödenen Fiyat Farkı Teminat Kesintisi (%6)', 60, 375)
				.text(`${para(results[0].kullanilmayan)}`, 455, 375, { align: 'left' })
				.text(
					'ı) İdari Para Cezası ( Ekteki 07/02/2023 Tarihli Tutanakta Belirtldiği Üzere )',
					60,
					395
				);

			doc // SOL DİK
				.lineCap('butt')
				.moveTo(55, 230)
				.lineTo(55, 410)
				.stroke();
		}
		function progressFooter() {
			progressRow(doc, 410);
			progressRow(doc, 430);

			doc // SOL DİK
				.lineCap('butt')
				.moveTo(40, 410)
				.lineTo(40, 450)

				.lineWidth('1.5')
				.lineCap('butt')
				.moveTo(15, 525)
				.lineTo(585, 525)
				.stroke()

				.font('Roboto-Bold.ttf')
				.fontSize('10')
				.text('YÜKLENİCİ', 275, 455, { underline: true })
				.text('KONTROL TEŞKİLATI', 260, 540, { underline: true, align: 'left' })
				.text('ŞUBE MÜDÜRÜ', 50, 650, { underline: true, align: 'left' })
				.text('DAİRE BAŞKANI', 460, 650, { underline: true, align: 'left' })
				.text('GENEL MÜDÜR YARDIMCISI', 235, 710, { underline: true, align: 'left' })

				.fontSize('11')
				.text('H', 25, 415)
				.text('Kesintiler ve Mahpuslar Toplamı', 45, 415)
				.text(`${para(results[0].H_kesintiler)}`, 455, 415, { align: 'rigth' })
				.text('I', 25, 435)
				.text('Yükleniciye Ödenecek Tutar ( G - H )', 45, 435)
				.text(`${para(results[0].I_odenecek_tutar)}`, 455, 435, { align: 'left' })

				.font('Roboto.ttf')
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
				.font('Roboto-Bold.ttf')
				.text('|makam3|', 60, 705)
				.text('|makam2|', 475, 705)
				.text('|makam1|', 265, 765);
		}
		function updateData2() {
			let kul_id1 = results[0].kullanici_id;
			let is_ad1 = results[0].isin_adi;
			let no1 = results[0].no;
			let soz_bed1 = results[0].sozlesme_bedeli;
			let is_sure1 = results[0].is_sure;
			let ceza = results[0].i_para_cezasi;

			let E_hakedis_tutari = soz_bed1 / is_sure1;
			let F_kdv_20 = (E_hakedis_tutari * 20) / 100;
			let G_tahakkuk_tutari = E_hakedis_tutari + F_kdv_20;
			let c_kdv_tev = F_kdv_20 * 0.7;
			let A_soz_tutari = E_hakedis_tutari * (no1+1);
			let B_fiyat_farki = results[0].B_fiyat_farki;
			let C_toplam = A_soz_tutari + B_fiyat_farki;
			let D_onceki_toplam = E_hakedis_tutari * (no1);
			let H_kesintiler = c_kdv_tev + ceza;
			let I_odenecek_tutar = G_tahakkuk_tutari - H_kesintiler;
	
			// var ı_para_cezasi = (sozlesme_bedeli*0.001)*(gecikme günü)

			let sql = `INSERT INTO haz_hakedis_2 (kullanici_id, isin_adi, sozlesme_bedeli, is_sure, A_soz_tutari, B_fiyat_farki, C_toplam, D_onceki_toplam, E_hakedis_tutari, F_kdv_20, G_tahakkuk_tutari, c_kdv_tev, H_kesintiler, I_odenecek_tutar)VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
			let values = [
				kul_id1,
				is_ad1,
				soz_bed1,
				is_sure1,
				A_soz_tutari,
				B_fiyat_farki,
				C_toplam,
				D_onceki_toplam,
				E_hakedis_tutari,
				F_kdv_20,
				G_tahakkuk_tutari,
				c_kdv_tev,
				H_kesintiler,
				I_odenecek_tutar,
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

function generatePDF3(res, useridInfo) {
	const sql = 'select * from hakedis_3 where kullanici_id=? order by h_id_3 desc';
	const params = useridInfo;
	connection.query(sql, params, (error, results) => {
		if (error) {
			console.log('Veritabanı hatası:', error);
			res.status(500).send('Veritabanı hatası');
			return;
		}
		const doc = new PDFDocument({ size: 'A4', margin: 30, font: 'Roboto.ttf' });
		doc.page.dictionary.data.Rotate = 90;

		generateFrame();
		header();
		Information();
		footer();
		updateData3();

		function para(number, fractionDigits = 2) {
			const formattedNumber = parseFloat(number).toFixed(fractionDigits);
			return  '₺ '+ formattedNumber.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
		}
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
				.font('Roboto-Bold.ttf')
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
				.font('Roboto.ttf')
				.fontSize('7')
				.text('(Teklif Birim Fiyatlı Hizmet İçin)', 225, 30)
				.fontSize('6')
				.text('Sayfa No: 1', 507, 44)
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
					.text(`${e.Bas}`, 300, 97 + x)
					.text(`${para(e.Cas)}`, 360, 97 + x)
					.text(`${e.Das}`, 425, 97 + x)
					.text(`${para(e.Eas)}`, 490, 97 + x)
					.text(`${e.Fas}`, 557, 97 + x, { width: 100 })
					.text(`${para(e.Gas)}`, 615, 97 + x);
				x = x + 11;
			});
		}
		function footer() {
			doc
				.font('Roboto.ttf')
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
				.font('Roboto-Bold.ttf')
				.text('|dismakamtarih1|', 245, 390);
		}
		function updateData3() {
			let lastIndex = results.length - 1;
			let kul_id = results[lastIndex].kullanici_id;
			let is_ad = results[lastIndex].isin_adi;
			let soz_bed = results[lastIndex].sozlesme_bedeli;
			let is_sure = results[lastIndex].isin_suresi;
			let Gas = soz_bed / is_sure;
			let Bas = results[lastIndex].Bas + 1;
			let Cas = Bas * Gas;
			let Das = results[lastIndex].Das + 1;
			let Eas = Gas * Das;
			let Fas = Bas - Das;

			let sql = `INSERT INTO haz_hakedis_3_update (kullanici_id, isin_adi, sozlesme_bedeli, isin_suresi, Gas, Bas, Cas, Das, Eas, Fas)
						 VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
			let values = [kul_id, is_ad, soz_bed, is_sure, Gas, Bas, Cas, Das, Eas, Fas];
			connection.query(sql, values, (err, result) => {
				if (err) throw err;
				console.log('Değerler başarıyla eklendi.');
			});
		}

		doc.pipe(res);
		console.log('Hakediş raporu-3 başarıyla oluşturuldu');
		res.setHeader('Content-Type', 'application/pdf');
		res.setHeader('Content-Disposition', 'attachment; filename=yapilan_isler_listesi.pdf');
		doc.end();
	});
}

// MySQL bağlantısını kapat
// connection.end();
app.listen(5001, () => {
	console.log('Server http://localhost:5001 adresinde başladı');
});
