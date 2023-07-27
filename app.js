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

	// Veritabanına kullanıcıyı kaydetme işlemi
	connection.query(
		'INSERT INTO userTable (username, password) VALUES (?, ?)',
		[username, password],
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
app.post('/welcome', (req, res) => {
	const userId = req.session.userId;
	var no = req.body.no;
	var uygulama_yili = req.body.uygulama_yili;
	var tarih = req.body.tarih;
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

	connection.query(
		'INSERT INTO hakedis_raporu (kullanici_id, no, uygulama_yili, tarih, is_adi, proje_no, yuklenici_adi, sozlesme_bedeli, ihale_tarihi, kayit_no, sozlesme_tarih, isyeri_teslim_tarihi, isin_suresi, is_bitim_tarihi) VALUES (?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
		[
			userId,
			no,
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
				console.log('Belge Kaydedilemedi');
				console.log(error);
				const userId = req.session.userId;
				res.redirect(`/welcome/${userId}`);
			} else {
				console.log('Belge Kaydedildi');
				const userId = req.session.userId;
				res.redirect(`/welcome/${userId}`);
			}
			res.end();
		}
	);
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
		'select kullanici_id from hakedis_raporu where kullanici_id=?',
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

function generatePDF(res, useridInfo) {
	const sql = 'SELECT * FROM hakedis_raporu WHERE kullanici_id = ? ORDER BY h_id DESC LIMIT 1';
	const params = useridInfo;
	connection.query(sql, params, (error, results) => {
		const doc = new PDFDocument({ size: 'A4', margin: 30, font: 'Roboto.ttf' });

		results.forEach((e) => {
			reportFrame();
			reportHeader();
			reportInformation();
			reportTable();
			reportFooter();

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
					.text(`Tarihi: ${e.tarih}`, 100, 180, { align: 'center' })
					.text(`No su: ${e.no}`, 100, 200, { align: 'center' })
					.text(`Uygulama Yılı: ${e.uygulama_yili}`, 100, 220, { align: 'center' })
					.text('Yapılan işin / Hizmetin Adı :', 35, 270)
					.text(`${e.is_adi}`, 275, 270, { align: 'left' })
					.text('Yapılan İsin / Hizmetin Etüd / Proje No su :', 35, 330)
					.text(`${e.proje_no}`, 275, 330, { align: 'left' })
					.text('Yüklenicinin Adi / Ticari Unvanı :', 35, 370)
					.text(`${e.yuklenici_adi}`, 275, 370, { align: 'left' })
					.text('Sözleşme Bedeli :', 35, 420)
					.text(`${para(e.sozlesme_bedeli)}`, 275, 420, { align: 'left' })
					.text('İhale Tarihi :', 35, 440)
					.text(`${e.ihale_tarihi}`, 275, 440, { align: 'left' })
					.text('Kayıt no :', 35, 460)
					.text(`${e.kayit_no}`, 275, 460, { align: 'left' })
					.text('Sözleşme Tarihi :', 35, 480)
					.text(`${e.sozlesme_tarih}`, 275, 480, { align: 'left' })
					.text('İşyeri Teslim Tarihi :', 35, 500)
					.text(`${e.isyeri_teslim_tarihi}`, 275, 500, { align: 'left' })
					.text('Sözleşmeye Göre İşin Süresi :', 35, 520)
					.text(`${e.isin_suresi}`, 275, 520, { align: 'left' })
					.text('Sözleşmeye Göre İş Bitim Tarihi :', 35, 540)
					.text(`${e.is_bitim_tarihi}`, 275, 540, { align: 'left' })
					.moveDown();
			}
			function reportTable() {
				doc
					.lineCap('butt')
					.moveTo(135, 580)
					.lineTo(135, 665)
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
					.text(`${para(e.sozlesme_bedeli)}`, 40, 630, { align: 'left' })
					.text('Sözleşme Artış', 175, 580)
					.text('Onayının Tarihi / No su', 155, 592)
					.text('Ek Sözleşme Bedeli', 295, 590)
					.text('Toplam Sözleşme Bedeli', 435, 580)
					.text(`${para(e.sozlesme_bedeli)}`, 435, 630, { align: 'left' });
			}
			function reportFooter() {
				doc
					.lineCap('butt')
					.moveTo(175, 670)
					.lineTo(175, 755)
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
		});
		doc.pipe(res);
		console.log('Hakediş raporu başarıyla oluşturuldu');
		res.setHeader('Content-Type', 'application/pdf');
		res.setHeader('Content-Disposition', 'attachment; filename=hakedis_raporu.pdf');
		doc.end();
	});
}

function generatePDF2(res, useridInfo) {
	const params = useridInfo;
	connection.query(
		'SELECT * FROM hakedis_raporu WHERE kullanici_id=? ORDER BY h_id DESC LIMIT 1 ',
		[params],
		(error, results) => {
			if (error) {
				console.log(error);
			}
			const doc = new PDFDocument({ size: 'A4', margin: 30, font: 'Roboto.ttf' });

			results.forEach((e) => {
				function progressFrame() {
					const frameX = 15; // Çerçevenin sol kenarının X koordinatı
					const frameY = 50; // Çerçevenin üst kenarının Y koordinatı
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
				function progressRow(doc, heigth) {
					doc.lineJoin('miter').rect(17.2, heigth, 566.3, 20).stroke();
					return doc;
				}
				function progressRow2(doc, height) {
					doc.lineJoin('miter').rect(55, height, 528, 20).stroke();
					return doc;
				}
				function para(number, fractionDigits = 2) {
					return number.toFixed(fractionDigits).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' ₺';
				}
				// SINIR EKLENECEK !!

				progressFrame();
				progressHeader();
				progressMiddle();
				progressFooter();

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
						.fontSize('14')
						.fontSize('10')
						.text(`${e.is_adi}`, 25, 65, { align: 'left' })

						.font('Roboto-Bold')
						.text(`${para(e.sozlesme_bedeli)}`, 455, 95, { align: 'left' })
						.text('C', 25, 135)
						.text('Toplam Tutar ( A + B )', 45, 135)
						.text(`${para(e.sozlesme_bedeli)}`, 455, 135, { align: 'left' })
						.text(`${para(e.sozlesme_bedeli)}`, 455, 155, { align: 'left' })
						.text(`${para(e.sozlesme_bedeli)}`, 455, 175, { align: 'left' })
						.text(`${para(e.sozlesme_bedeli)}`, 455, 195, { align: 'left' })
						.text('G', 25, 215)
						.text('Tahakkuk Tutarı', 45, 215)
						.text(`${para(e.sozlesme_bedeli)}`, 455, 215, { align: 'left' })
						.font('Roboto.ttf')
						.fontSize('11')
						.text('A', 25, 95)
						.text('Sözleşme Fiyatları ile Yapılan Hizmet Tutarı :', 45, 95)
						.text('B', 25, 115)
						.text('Fiyat Farkı Tutarı', 45, 115)
						.text(`${para(e.sozlesme_bedeli)}`, 455, 115, { align: 'left' })
						.text('D', 25, 155)
						.text('Bir Önceki Hakedişin Toplam Tutarı', 45, 155)
						.text('E', 25, 175)
						.text('Bu Hakedişin Tutarı', 45, 175)
						.text('F', 25, 195)
						.text('KDV ( E x %18 )', 45, 195);

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
						.text(`${para(e.sozlesme_bedeli)}`, 455, 275, { align: 'left' })
						.text(`${para(e.sozlesme_bedeli)}`, 455, 395, { align: 'left' })

						.font('Roboto.ttf')
						.fontSize('11')
						.text('a) Gelir/ Kurumlar Vergisi ( E x % .. )', 60, 235)
						.text(`${para(e.sozlesme_bedeli)}`, 455, 235, { align: 'left' })
						.text('b) Damga Vergisi ( E - g x % ..)0,00825', 60, 255)
						.text(`${para(e.sozlesme_bedeli)}`, 455, 255, { align: 'left' })
						.text('c) KDV Tevfikatı (7/10)', 60, 275)
						.text('d) Sosyal Sigortalar Kurumu Kesintisi', 60, 295)
						.text(`${para(e.sozlesme_bedeli)}`, 455, 295, { align: 'left' })
						.text('e) İdare Makinesi Kiraları', 60, 315)
						.text(`${para(e.sozlesme_bedeli)}`, 455, 315, { align: 'left' })
						.text('f) Gecikme Cezası', 60, 335)
						.text(`${para(e.sozlesme_bedeli)}`, 455, 335, { align: 'left' })
						.text('g) Avans Mahsubu', 60, 355)
						.text(`${para(e.sozlesme_bedeli)}`, 455, 355, { align: 'left' })
						.text('h) Bu Hakedişle Ödenen Fiyat Farkı Teminat Kesintisi (%6)', 60, 375)
						.text(`${para(e.sozlesme_bedeli)}`, 455, 375, { align: 'left' })
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

						.lineWidth('2')
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
						.text(`${para(e.sozlesme_bedeli)}`, 455, 415, { align: 'rigth' })
						.text('I', 25, 435)
						.text('Yükleniciye Ödenecek Tutar ( G - H )', 45, 435)
						.text(`${para(e.sozlesme_bedeli)}`, 455, 435, { align: 'left' })

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
			});
			doc.pipe(res);
			console.log('Hakediş raporu-2 başarıyla oluşturuldu');
			res.setHeader('Content-Type', 'application/pdf');
			res.setHeader('Content-Disposition', 'attachment; filename=hakedis_raporu2.pdf');
			doc.end();
		}
	);
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
		console.log(results);
		const doc = new PDFDocument({ size: 'A4', margin: 30, font: 'Roboto.ttf' });
		doc.page.dictionary.data.Rotate = 90;

		generateFrame();
		header(results);
		Information(results);
		footer();
		updateData(results);
		
		function para(number, fractionDigits = 2) {
			return number.toFixed(fractionDigits).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' ₺';
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
		function header(results) {
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
				.text('Sayfa No:', 507, 44)
				.text('Hakediş No:', 575, 44)
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
		function Information(results) {
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
					.text(`${e.h_id_3}`, -125, 97 + x)
					.text(`${e.isin_adi}`, -107, 97 + x)
					.text(`${e.sozlesme_bedeli}`, 220, 97 + x)
					.text(`${e.Bas}`, 300, 97 + x)
					.text(`${e.Cas}`, 360, 97 + x)
					.text(`${e.Das}`, 425, 97 + x)
					.text(`${e.Eas}`, 490, 97 + x)
					.text(`${e.Fas}`, 557, 97 + x, { width: 100 })
					.text(`${e.Gas}`, 615, 97 + x);
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
		function updateData(results){
			let lastIndex = results.length - 1;
			let kul_id = results[lastIndex].kullanici_id;
			let is_ad = results[lastIndex].isin_adi;
			let soz_bed = results[lastIndex].sozlesme_bedeli;
			let is_sure = results[lastIndex].isin_suresi;
			let no = results[lastIndex].no + 1;
			let Gas = soz_bed / is_sure;
			let Bas = results[lastIndex].Bas + 1;
			let Cas = Bas * Gas;
			let Das = results[lastIndex].Das + 1;
			let Eas = Gas * Das;
			let Fas = Bas - Das;
	
			let sql = `INSERT INTO haz_hakedis_3_update (kullanici_id, isin_adi, sozlesme_bedeli, isin_suresi, no, Gas, Bas, Cas, Das, Eas, Fas)
						 VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
			let values = [ kul_id, is_ad, soz_bed, is_sure, no, Gas, Bas, Cas, Das, Eas, Fas];
			connection.query(sql, values, (err, result) => {
				if (err) throw err;
				console.log("Değerler başarıyla eklendi.");
			});
		}

		doc.pipe(res);
		console.log('Hakediş raporu-3 başarıyla oluşturuldu');
		res.setHeader('Content-Type', 'application/pdf');
		res.setHeader('Content-Disposition', 'attachment; filename=hakedis_raporu3.pdf');
		doc.end();

		
		
	});
}

// MySQL bağlantısını kapat
// connection.end();
app.listen(5001, () => {
	console.log('Server http://localhost:5001 adresinde başladı');
});
