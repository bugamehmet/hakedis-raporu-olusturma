const mysql = require('mysql');
const express = require('express');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const e = require('express');
const app = express();
app.use('/assets', express.static('assets'));
app.use(express.urlencoded({ extended: true }));

//Veri tabanına bağlanmak için bir bağlantı nesnesi oluşturmak
const connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: '12345678',
	database: 'userDB',
});

//Sunucuya bağlanmak
connection.connect((error) => {
	if (error) throw error;
	else console.log('bağlanıldı!');
});
// body-parser yerine kullandığımız middleware
// HTML form verilerini veri tabanına yollamadan önce işlemek için

// anadizine girildğinde index.html i tarayıcıya gönderir "GET"
app.get('/', (req, res) => {
	res.sendFile(__dirname + '/index.html');
});

//welcome a GET isteğini yönlendirmek için
app.get('/welcome', (req, res) => {
	res.sendFile(__dirname + '/welcome.html');
});

// Register a Get isteğini yönlendirme
app.get('/register', (req, res) => {
	res.sendFile(__dirname + '/register.html');
});

//POST isteğini aldığımızda kullanıcı bilgilerini kontrol ederek
// kullanıcıyı sayfaya yönlendiririz
app.post('/', (req, res) => {
	var username = req.body.username;
	var password = req.body.password;

	connection.query(
		'select * from userTable where username = ? and password = ?',
		[username, password],
		function (error, results, fields) {
			if (results.length > 0) {
				res.redirect('/welcome');
			} else {
				res.redirect('/');
			}
			res.end();
		}
	);
});

//VERİTABANINA KULLANICIYI KAYDETME
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
				res.redirect('/');
			}
			res.end();
		}
	);
});

//RAPOR BİLGİLERİNİ VERİTABANINA KAYDETME
app.post('/welcome', (req, res) => {
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
		'INSERT INTO hakedis_raporu (no, uygulama_yili, tarih, is_adi, proje_no, yuklenici_adi, sozlesme_bedeli, ihale_tarihi, kayit_no, sozlesme_tarih, isyeri_teslim_tarihi, isin_suresi, is_bitim_tarihi) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
		[
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
				res.redirect('/welcome');
			} else {
				res.redirect('/welcome');
			}
			res.end();
		}
	);
});

connection.query('SELECT * FROM hakedis_raporu ORDER BY h_id DESC LIMIT 1 ', (error, results) => {
	results.forEach((e) => {
		app.get('/generate-pdf', (req, res) => {
			const doc = new PDFDocument({ size: 'A4', margin: 30, font: 'Roboto.ttf' });
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
			doc.end();
			console.log('Hakediş raporu başarıyla oluşturuldu');
			res.setHeader('Content-Type', 'application/pdf');
			res.setHeader('Content-Disposition', 'attachment; filename=hakedis_raporu.pdf');
			doc.pipe(res);
		});

		app.get('/generate-pdf2', (req, res) => {
			const doc = new PDFDocument({ size: 'A4', margin: 30, font: 'Roboto.ttf' });

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

			doc.end();
			console.log('Hakediş raporu-2 başarıyla oluşturuldu');
			res.setHeader('Content-Type', 'application/pdf');
			res.setHeader('Content-Disposition', 'attachment; filename=hakedis_raporu2.pdf');
			doc.pipe(res);
		});

		app.get('/generate-pdf3', (req, res) => {
			const doc = new PDFDocument({ size: 'A4', margin: 30, font: 'Roboto.ttf' });
			doc.page.dictionary.data.Rotate = 90;
			// doc.save(); BİR ŞEY OLURSA cons doc ekle

			function rowLine(doc, x1, y1, x2, y2) {
				doc.lineCap('butt').moveTo(x1, y1).lineTo(x2, y2).stroke();
			}
			function rowInformation(doc, heigth) {
				doc.lineJoin('miter').rect(-99, heigth, 747, 13).stroke();
				return doc;
			}
			function generateFrame() {
				const frameX = 15; // Çerçevenin sol kenarının X koordinatı
				const frameY = 50; // Çerçevenin üst kenarının Y koordinatı
				const frameWidth = 450; // Çerçevenin genişliği
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
			function header() {
				doc
					.lineCap('butt')
					.moveTo(40, 800)
					.lineTo(40, 50)
					.moveTo(55, 800)
					.lineTo(55, 50)
					.moveTo(95, 800)
					.lineTo(95, 50)
					.moveTo(65, 550)
					.lineTo(65, 50)
					.moveTo(40, 200)
					.lineTo(55, 200)
					.moveTo(55, 770) // sıra no R
					.lineTo(95, 770)
					.moveTo(55, 550) // işin tanımı R
					.lineTo(95, 550)
					.moveTo(55, 465) // sözleşme bedeli R
					.lineTo(95, 465)
					.moveTo(55, 405) //Gerçekleşen toplam imalat R
					.lineTo(95, 405)
					.moveTo(55, 345) //toplam İmalat Tutarı R
					.lineTo(95, 345)
					.moveTo(55, 265) //Önceki Hakediş Toplam İmalat R
					.lineTo(95, 265)
					.moveTo(55, 200) //önceki hakediş toplam imalat tutarı R
					.lineTo(95, 200)
					.moveTo(55, 150) // bu hakediş imalat R
					.lineTo(95, 150)
					.stroke();

				doc
					.rotate(-90, { origin: [350, 350] })
					.font('Roboto-Bold.ttf')
					.fontSize('6')
					.text(`${e.is_adi}`, -95, 45)
					.text('A', 190, 57)
					.text('B', 265, 57)
					.text('C=(AxB)', 315, 57)
					.text('D', 395, 57)
					.text('E=(AxD)', 455, 57)
					.text('F=(B-D)', 515, 57)
					.text('G=(AxF)', 585, 57)
					.fontSize('8')
					.text('YAPILAN İŞLER LİSTESİ', 230, 20)
					.font('Roboto.ttf')
					.fontSize('7')
					.text('(Teklif Birim Fiyatlı Hizmet İçin)', 225, 30)
					.fontSize('6')
					.text('Sayfa No:', 507, 44)
					.text('Hakediş No:', 575, 44)
					.text('Sıra No', -95, 72)
					.text('İşin Tanımı', 33, 72)
					.text('Sözleşme Bedeli', 170, 72)
					.text('Gerçekleşen Toplam İmalat', 250, 69, { width: 40, align: 'center' })
					.text('Toplam İmalat Tutarı', 310, 69, { width: 40, align: 'center' })
					.text('Önceki Hakediş Toplam İmalat', 375, 69, { width: 50, align: 'center' })
					.text('Önceki Hakediş Toplam İmalat Tutarı', 440, 69, { width: 50, align: 'center' })
					.text('Bu Hakediş İmalat', 507, 69, { width: 40, align: 'center' })
					.text('Bu Hakediş Tutarı', 575, 72, { width: 100 });
			}

			function Information() {
				try {
					let x = 0;
					for (let i = 0; i < 5; i++) {
						rowLine(doc, 95 + x, 670, 108 + x, 670);
						rowInformation(doc, 95 + x);
						x = x + 13;
					}
				} catch (error) {
					console.log(error);
				}
			}

			generateFrame(); // FONKSİYONLARI ÇAĞIRIŞ SIRASINA GÖRE DEĞİŞİYOR
			Information();
			header();

			doc.pipe(res);
			console.log('Hakediş raporu-3 başarıyla oluşturuldu');
			res.setHeader('Content-Type', 'application/pdf');
			res.setHeader('Content-Disposition', 'attachment; filename=hakedis_raporu3.pdf');
			doc.end();
		});
	});
});

// MySQL bağlantısını kapat
// connection.end();
app.listen(5001);
