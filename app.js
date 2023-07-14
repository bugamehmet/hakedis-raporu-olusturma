const mysql = require('mysql');
const express = require('express');
const fs = require('fs');
const PDFDocument = require('pdfkit');


const app = express();
app.use('/assets', express.static('assets'));

//Veri tabanına bağlanmak için bir bağlantı nesnesi oluşturmak
const connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: '12345678',
	database: 'userDB',
});
//Sunucuya bağlanmak
connection.connect(function (error) {
	if (error) throw error;
	else console.log('bağlanıldı!');
});
// body-parser yerine kullandığımız middleware
// HTML form verilerini veri tabanına yollamadan önce işlemek için
app.use(express.urlencoded({ extended: true }));

// anadizine girildğinde index.html i tarayıcıya gönderir "GET"
app.get('/', function (req, res) {
	res.sendFile(__dirname + '/index.html');
});

//welcome a GET isteğini yönlendirmek için
app.get('/welcome', function (req, res) {
	res.sendFile(__dirname + '/welcome.html');
});

// Register a Get isteğini yönlendirme
app.get('/register', function (req, res) {
	res.sendFile(__dirname + '/register.html');
});

//POST isteğini aldığımızda kullanıcı bilgilerini kontrol ederek
// kullanıcıyı sayfaya yönlendiririz
app.post('/', function (req, res) {
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
app.post('/register', function (req, res) {
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
app.post('/welcome', function (req, res) {
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

//--------------İNDİRME İNŞALLAH-------------//

app.get('/generate-pdf', (req, res) => {
	// PDF oluşturma işlemleri
	const doc = new PDFDocument({ size: 'A4', margin: 30, font: 'Roboto.ttf' });

	generateFrame();
	generateHeader(doc);

	function generateFrame() {
		const frameX = 15; // Çerçevenin sol kenarının X koordinatı
		const frameY = 30; // Çerçevenin üst kenarının Y koordinatı
		const frameWidth = 570; // Çerçevenin genişliği
		const frameHeight = 750; // Çerçevenin yüksekliği
		const frameThickness = 2; // Çerçevenin kalınlığı piksel cinsinden

		const drawRect = (x, y, width, height, color) => {
			doc.rect(x, y, width, height).fill(color);
		};

		drawRect(frameX, frameY, frameWidth, frameThickness, '#000000'); // Üst çerçeve
		drawRect(frameX, frameY + frameHeight - frameThickness, frameWidth, frameThickness, '#000000'); // Alt çerçeve
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

	function row1(doc, heigth) {
		doc.lineJoin('miter').rect(30, heigth, 550, 85).stroke();
		return doc;
	}

	function para(number, fractionDigits = 2) {
		return number.toFixed(fractionDigits).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' ₺';
	}

	function generateHeader(doc) {
		const logoLeft = 'assets/gorseller/logo_left.png';
		const logoRight = 'assets/gorseller/logo_right.png';
		doc.image(logoLeft, 20, 50, { width: 60, height: 80 });
		doc.image(logoRight, 500, 50, { width: 60, height: 80 });
		doc.fontSize(12).text('T.C', 100, 30, { align: 'center' });
		doc.fontSize(12).text('SAMSUN BÜYÜK ŞEHİR BELEDİYESİ', 100, 50, { align: 'center' });
		doc
			.fontSize(12)
			.text('SAMSUN SU VE KANALİZASYON GENEL MÜDÜRLÜĞÜ', 100, 70, { align: 'center' });
		doc.fontSize(12).text('BİLGİ İŞLEM DAİRESİ BAŞKANLIĞI', 100, 90, { align: 'center' });
		// Hakediş raporu başlığı
		doc.fontSize(16).text('Hakediş Raporu', 100, 150, { align: 'center' });
		doc.moveDown();
	}
	// PDF dosyasına yazdırma işlemi
	// Veritabanından verileri çekme
	connection.query('SELECT * FROM hakedis_raporu ORDER BY h_id DESC LIMIT 1 ', (error, results) => {
		if (error) {
			console.error('MySQL sorgu hatası: ', error);
			return;
		}
		// Verileri PDF'e yazdırma
		results.forEach((row) => {
			doc
				.fontSize(12)
				.text(`Tarihi: ${row.tarih}`, 100, 180, { align: 'center' })
				.text(`No su: ${row.no}`, 100, 200, { align: 'center' })
				.text(`Uygulama Yılı: ${row.uygulama_yili}`, 100, 220, { align: 'center' });

			doc
				.text('Yapılan işin / Hizmetin Adı :', 35, 270)
				.text(`${row.is_adi}`, 275, 270, { align: 'left' })

				.text('Yapılan İsin / Hizmetin Etüd / Proje No su :', 35, 330)
				.text(`${row.proje_no}`, 275, 330, { align: 'left' })

				.text('Yüklenicinin Adi / Ticari Unvanı :', 35, 370)
				.text(`${row.yuklenici_adi}`, 275, 370, { align: 'left' })

				.text('Sözleşme Bedeli :', 35, 420)
				.text(`${para(row.sozlesme_bedeli)}`, 275, 420, { align: 'left' })

				.text('İhale Tarihi :', 35, 440)
				.text(`${row.ihale_tarihi}`, 275, 440, { align: 'left' })

				.text('Kayıt no :', 35, 460)
				.text(`${row.kayit_no}`, 275, 460, { align: 'left' })

				.text('Sözleşme Tarihi :', 35, 480)
				.text(`${row.sozlesme_tarih}`, 275, 480, { align: 'left' })

				.text('İşyeri Teslim Tarihi :', 35, 500)
				.text(`${row.isyeri_teslim_tarihi}`, 275, 500, { align: 'left' })

				.text('Sözleşmeye Göre İşin Süresi :', 35, 520)
				.text(`${row.isin_suresi}`, 275, 520, { align: 'left' })

				.text('Sözleşmeye Göre İş Bitim Tarihi :', 35, 540)
				.text(`${row.is_bitim_tarihi}`, 275, 540, { align: 'left' });

			doc.moveDown();

			// --------------TABLLLOOOOOO-------------
			doc
				.lineCap('butt')
				.moveTo(135, 580)
				.lineTo(135, 665)
				.stroke()
				.lineCap('butt')
				.moveTo(600, 580)
				.lineTo(600, 665)
				.stroke()
				.lineCap('butt')
				.moveTo(405, 580)
				.lineTo(405, 665)
				.stroke()
				.lineCap('butt')
				.moveTo(30, 615)
				.lineTo(580, 615)
				.stroke();

			row1(doc, 580);

			doc
				.text('Sözleşme Bedeli', 35, 590)
				.text(`${para(row.sozlesme_bedeli)}`, 40, 630, { align: 'left' })
				.text('Sözleşme Artış', 175, 580)
				.text('Onayının Tarihi / No su', 155, 592)
				.text('Ek Sözleşme Bedeli', 295, 590)
				.text('Toplam Sözleşme Bedeli', 435, 580)
				.text(`${para(row.sozlesme_bedeli)}`, 435, 630, { align: 'left' });
			/*----------------------------------------------*/
			doc
				.lineCap('butt')
				.moveTo(175, 670)
				.lineTo(175, 755)
				.stroke()
				.lineCap('butt')
				.moveTo(600, 670)
				.lineTo(600, 755)
				.stroke()
				.lineCap('butt')
				.moveTo(385, 670)
				.lineTo(385, 755)
				.stroke()
				.lineCap('butt')
				.moveTo(30, 700)
				.lineTo(580, 700)
				.stroke();

			row1(doc, 670);

			doc
				.text('Süre uzatım kararı Tarih', 35, 675)
				.text('Sayı', 205, 675)
				.text('Verilen Süre', 305, 675)
				.text('İş Bitim Tarihi', 435, 675);
		});

		// PDF dosyasına yazdırma işlemini tamamla
		doc.end();

		// PDF dosyasının oluşturulduğunu bildir
		console.log('Hakediş raporu başarıyla oluşturuldu');

		// PDF dosyasını indirme
		res.setHeader('Content-Type', 'application/pdf');
		res.setHeader('Content-Disposition', 'attachment; filename=hakedis_raporu.pdf');

		doc.pipe(res);
	});
});

app.get('/generate-pdf2', function (req, res) {
	const doc = new PDFDocument({ size: 'A4', margin: 30, font: 'Roboto.ttf' });

	generateFrame();
	function generateFrame() {
		const frameX = 15; // Çerçevenin sol kenarının X koordinatı
		const frameY = 50; // Çerçevenin üst kenarının Y koordinatı
		const frameWidth = 570; // Çerçevenin genişliği
		const frameHeight = 750; // Çerçevenin yüksekliği
		const frameThickness = 2; // Çerçevenin kalınlığı piksel cinsinden

		const drawRect = (x, y, width, height, color) => {
			doc.rect(x, y, width, height).fill(color);
		};

		drawRect(frameX, frameY, frameWidth, frameThickness, '#000000'); // Üst çerçeve
		drawRect(frameX, frameY + frameHeight - frameThickness, frameWidth, frameThickness, '#000000'); // Alt çerçeve
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

	function row1(doc, heigth) {
		doc.lineJoin('miter').rect(17.2, heigth, 566.3, 20).stroke();
		return doc;
	}
	function row2(doc, height) {
		doc.lineJoin('miter').rect(55, height, 528, 20).stroke();
		return doc;
	}

	function para(number, fractionDigits = 2) {
		return number.toFixed(fractionDigits).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' ₺';
	}

	connection.query('SELECT * FROM hakedis_raporu ORDER BY h_id DESC LIMIT 1 ', (error, results) => {
		if (error) {
			console.error('MySQL sorgu hatası: ', error);
			return;
		}
		doc.font('Roboto-Bold.ttf').text('HAKEDİŞ RAPORU', { align: 'center' }).fontSize('14');

		results.forEach((e) => {
			ust_bolum();
			orta_bolum();
			alt_bolum();

			function ust_bolum() {
				row1(doc, 90);
				row1(doc, 110);
				row1(doc, 130);
				row1(doc, 150);
				row1(doc, 170);
				row1(doc, 190);
				row1(doc, 210);

				doc // SINIR EKLENECEK !! -- KALINLIKLAR EKLENECEK
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

			function orta_bolum() {
				row2(doc, 230);
				row2(doc, 250);
				row2(doc, 270);
				row2(doc, 290);
				row2(doc, 310);
				row2(doc, 330);
				row2(doc, 350);
				row2(doc, 370);
				row2(doc, 390);

				doc
					.font('Roboto-Bold.ttf')
					.text(`${para(e.sozlesme_bedeli)}`, 455, 275, { align: 'left' })
					.text(`${para(e.sozlesme_bedeli)}`, 455, 395, { align: 'left' })
					.fontSize('11')
					.font('Roboto.ttf')
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
					.text('ı) İdari Para Cezası ( Ekteki 07/02/2023 Tarihli Tutanakta Belirtldiği Üzere )',60,395);

				doc // SOL DİK
					.lineCap('butt')
					.moveTo(55, 230)
					.lineTo(55, 410)
					.stroke();
			}

			function alt_bolum() {
				//underline- metnin altını çizip çizmeme
				row1(doc, 410);
				row1(doc, 430);

				doc
					.save() // Dökümanın mevcut durumunu kaydet
					.translate(25, 400) // Başlangıç noktasını ayarla
					.rotate(-90, { origin: [0, 0] }) // Metni belirli bir açıyla döndür
					.font('Roboto-Bold.ttf')
					.fontSize('12')
					.text('KESİNTİLER VE MAHPUSLAR', 0, 0)
					.restore(); // Dökümanı önceki durumuna geri getir
				doc // SOL DİK
					.lineCap('butt')
					.moveTo(40, 410)
					.lineTo(40, 450)
					.stroke();

				doc.lineWidth('2').lineCap('butt').moveTo(15, 525).lineTo(585, 525).stroke();
				doc
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

			doc
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
		doc.end();
		console.log('Hakediş raporu-2 başarıyla oluşturuldu');
		res.setHeader('Content-Type', 'application/pdf');
		res.setHeader('Content-Disposition', 'attachment; filename=hakedis_raporu2.pdf');
		doc.pipe(res);
	});
});

// MySQL bağlantısını kapat
// connection.end();
app.listen(5001);
