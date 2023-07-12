const mysql = require('mysql');
const express = require('express');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const { table } = require('console');

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
	const doc = new PDFDocument({ size: 'A4', margin:30});

	const startY = 270; // Başlangıç y koordinatı
	const startX = 35;  // Başlangıç x kordinatı

	cerceve();
	generateHeader(doc);

	function cerceve(){
		const frameX = 15; // Çerçevenin sol kenarının X koordinatı
		const frameY = 30; // Çerçevenin üst kenarının Y koordinatı
		const frameWidth = 570; // Çerçevenin genişliği
		const frameHeight = 750; // Çerçevenin yüksekliği
		const frameThickness = 2; // Çerçevenin kalınlığı piksel cinsinden
		
		doc.rect(frameX, frameY, frameWidth, frameThickness) // Üst çerçeve
			 .fill('#000000');
		doc.rect(frameX, frameY + frameHeight - frameThickness, frameWidth, frameThickness) // Alt çerçeve
			 .fill('#000000');
		doc.rect(frameX, frameY + frameThickness, frameThickness, frameHeight - 2 * frameThickness) // Sol çerçeve
			 .fill('#000000');
		doc.rect(frameX + frameWidth - frameThickness, frameY + frameThickness, frameThickness, frameHeight - 2 * frameThickness) // Sağ çerçeve
			 .fill('#000000');
		
		}

	function row1(doc, heigth) {
		doc.lineJoin('miter')
			.rect(30, heigth, 550, 85)
			.stroke()
		return doc;
	}

	Number.prototype.para = function (fractionDigits, decimal, separator) {
		fractionDigits = isNaN(fractionDigits = Math.abs(fractionDigits)) ? 2 : fractionDigits;
		
		decimal = typeof (decimal) === "undefined" ? "." : decimal;
		
		separator = typeof (separator) === "undefined" ? "," : separator;
		
		var number = this;
		
		var neg = number < 0 ? "-" : "";
		
		var wholePart = parseInt(number = Math.abs(+number || 0).toFixed(fractionDigits)) + "";
		
		var separtorIndex = (separtorIndex = wholePart.length) > 3 ? separtorIndex % 3 : 0;
		
		return neg +
		
		(separtorIndex ? wholePart.substr(0, separtorIndex) + separator : "") +
		
		wholePart.substr(separtorIndex).replace(/(\d{3})(?=\d)/g, "$1" + separator) +
		
		(fractionDigits ? decimal + Math.abs(number - wholePart).toFixed(fractionDigits).slice(2) : "");
		
		};

	function para(tl) {
		return Number(tl).para(2, ',', '.')+" TL";
	}
	function generateHeader(doc) {
		const logoLeft = 'assets/gorseller/logo_left.png';
		const logoRight = 'assets/gorseller/logo_right.png';
		doc.image(logoLeft, 20, 50, { width: 60, height: 80 });
		doc.image(logoRight, 500, 50, { width: 60, height: 80 });
		doc.font('arial.ttf').fontSize(12).text('T.C', 100, 30, { align: 'center' });
		doc
			.font('arial.ttf')
			.fontSize(12)
			.text('SAMSUN BÜYÜK ŞEHİR BELEDİYESİ', 100, 50, { align: 'center' });
		doc
			.font('arial.ttf')
			.fontSize(12)
			.text('SAMSUN SU VE KANALİZASYON GENEL MÜDÜRLÜĞÜ', 100, 70, { align: 'center' });
		doc
			.font('arial.ttf')
			.fontSize(12)
			.text('BİLGİ İŞLEM DAİRESİ BAŞKANLIĞI', 100, 90, { align: 'center' });
		// Hakediş raporu başlığı
		doc.font('arial.ttf').fontSize(16).text('Hakediş Raporu', 100, 150, { align: 'center' });
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
		.font('arial.ttf')
		.fontSize(12)
		.text(`Tarihi: ${row.tarih}`, 100, 180, { align: 'center' })
		.text(`No su: ${row.no}`, 100, 200, { align: 'center' })
		.text(`Uygulama Yılı: ${row.uygulama_yili}`, 100, 220, { align: 'center' })

	doc
		.text('Yapılan işin / Hizmetin Adı :', startX, startY)
		.text(`${row.is_adi}`, startX+250, startY, { align: 'left' })

		.text('Yapılan İsin / Hizmetin Etüd / Proje No su :', startX, startY + 60)
		.text(`${row.proje_no}`, startX+250, startY + 60, { align: 'left' })

		.text('Yüklenicinin Adi / Ticari Unvanı :', startX, startY + 100)
		.text(`${row.yuklenici_adi}`, startX+250, startY + 100, { align: 'left' })

		.text('Sözleşme Bedeli :', startX, startY + 150)
		.text(`${para(row.sozlesme_bedeli)}`, startX+250, startY + 150, { align: 'left'})
		

		.text('İhale Tarihi :', startX, startY + 170)
		.text(`${row.ihale_tarihi}`, startX+250, startY + 170, { align: 'left' })

		.text('Kayıt no :', startX, startY + 190)
		.text(`${row.kayit_no}`, startX+250, startY + 190, { align: 'left' })

		.text('Sözleşme Tarihi :', startX, startY + 210)
		.text(`${row.sozlesme_tarih}`, startX+250, startY + 210, { align: 'left' })

		.text('İşyeri Teslim Tarihi :', startX, startY + 230)
		.text(`${row.isyeri_teslim_tarihi}`, startX+250, startY + 230, { align: 'left' })

		.text('Sözleşmeye Göre İşin Süresi :', startX, startY + 250)
		.text(`${row.isin_suresi}`, startX+250, startY + 250, { align: 'left' })

		.text('Sözleşmeye Göre İş Bitim Tarihi :', startX, startY + 270)
		.text(`${row.is_bitim_tarihi}`, startX+250, startY + 270, { align: 'left' });

		doc.moveDown();


	// --------------TABLLLOOOOOO-------------
	doc
			.lineCap('butt')
			.moveTo(startX+100, startY + 310)
			.lineTo(startX+100, startY + 395)
			.stroke()
			.lineCap('butt')
			.moveTo(startX+250, startY + 310)
			.lineTo(startX+250, startY + 395)
			.stroke()
			.lineCap('butt')
			.moveTo(startX+370, startY + 310)
			.lineTo(startX+370, startY + 395)
			.stroke()
			.lineCap('butt')
			.moveTo(startX-5, startY+345)
			.lineTo(startX+545, startY+345)
			.stroke()

			row1(doc, startY + 310);

			doc
			.text('Sözleşme Bedeli', startX,startY+320)
			.text(`${para(row.sozlesme_bedeli)}`, startX+5, startY + 360, { align: 'left' })
			.text('Sözleşme Artış', startX+140,startY+310)
			.text('Onayının Tarihi / No su', startX+120,startY+322)
			.text('Ek Sözleşme Bedeli', startX+260,startY+320)
			.text('Toplam Sözleşme Bedeli', startX+400,startY+310)
			.text(`${para(row.sozlesme_bedeli)}`, startX+400, startY + 360, { align: 'left'})
/*----------------------------------------------*/
			doc
			.lineCap('butt')
			.moveTo(startX+140, startY + 400)
			.lineTo(startX+140, startY + 485)
			.stroke()
			.lineCap('butt')
			.moveTo(startX+250, startY + 400)
			.lineTo(startX+250, startY + 485)
			.stroke()
			.lineCap('butt')
			.moveTo(startX+350, startY + 400)
			.lineTo(startX+350, startY + 485)
			.stroke()
			.lineCap('butt')
			.moveTo(startX-5, startY + 430)
			.lineTo(startX+545, startY + 430)
			.stroke()

			row1(doc, startY + 400);

			doc
			.text('Süre uzatım kararı Tarih', startX,startY+405)
			.text('Sayı', startX+170,startY+405)
			.text('Verilen Süre', startX+270, startY+405)
			.text('İş Bitim Tarihi',startX+400, startY+405)

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




app.get('/generate-pdf2', function(req,res){

	const doc = new PDFDocument({ size: 'A4', margin:30});

	const startY = 270; // Başlangıç y koordinatı
	const startX = 15;  // Başlangıç x kordinatı

	cerceve();
	function cerceve(){
		const frameX = 15; // Çerçevenin sol kenarının X koordinatı
		const frameY = 50; // Çerçevenin üst kenarının Y koordinatı
		const frameWidth = 570; // Çerçevenin genişliği
		const frameHeight = 750; // Çerçevenin yüksekliği
		const frameThickness = 2; // Çerçevenin kalınlığı piksel cinsinden
		
		doc.rect(frameX, frameY, frameWidth, frameThickness) // Üst çerçeve
			 .fill('#000000');
		doc.rect(frameX, frameY + frameHeight - frameThickness, frameWidth, frameThickness) // Alt çerçeve
			 .fill('#000000');
		doc.rect(frameX, frameY + frameThickness, frameThickness, frameHeight - 2 * frameThickness) // Sol çerçeve
			 .fill('#000000');
		doc.rect(frameX + frameWidth - frameThickness, frameY + frameThickness, frameThickness, frameHeight - 2 * frameThickness) // Sağ çerçeve
			 .fill('#000000');
		
		}

	function row1(doc, heigth) {
		doc.lineJoin('miter')
			.rect(17.2, heigth, 566.3, 20)
			.stroke()
		return doc;
	}

	Number.prototype.para = function (fractionDigits, decimal, separator) {
		fractionDigits = isNaN(fractionDigits = Math.abs(fractionDigits)) ? 2 : fractionDigits;
		
		decimal = typeof (decimal) === "undefined" ? "." : decimal;
		
		separator = typeof (separator) === "undefined" ? "," : separator;
		
		var number = this;
		
		var neg = number < 0 ? "-" : "";
		
		var wholePart = parseInt(number = Math.abs(+number || 0).toFixed(fractionDigits)) + "";
		
		var separtorIndex = (separtorIndex = wholePart.length) > 3 ? separtorIndex % 3 : 0;
		
		return neg +
		
		(separtorIndex ? wholePart.substr(0, separtorIndex) + separator : "") +
		
		wholePart.substr(separtorIndex).replace(/(\d{3})(?=\d)/g, "$1" + separator) +
		
		(fractionDigits ? decimal + Math.abs(number - wholePart).toFixed(fractionDigits).slice(2) : "");
		
		};

	function para(tl) {
		return Number(tl).para(2, ',', '.')+" TL";
	}


	connection.query('SELECT * FROM hakedis_raporu ORDER BY h_id DESC LIMIT 1 ', (error, results) => {
		if (error) {
			console.error('MySQL sorgu hatası: ', error);
			return;
		}
		doc
		.font('arial.ttf')
		.text('HAKEDİŞ RAPORU',{align:'center'}).fontSize('14')

		row1(doc, startY - 170);
		row1(doc, startY - 150);
		row1(doc, startY - 130);
		row1(doc, startY - 110);
		row1(doc, startY - 90);
		row1(doc, startY - 70);
		row1(doc, startY - 50);
		row1(doc, startY - 30);
		row1(doc, startY - 10);

		doc
		.lineCap('butt')
		.moveTo(startX+140, startY + 400)
		.lineTo(startX+140, startY + 485)
		.stroke()
		doc
		.lineCap('butt')
		.moveTo(startX+100, startY + 310)
		.lineTo(startX+100, startY + 395)
		.stroke()

	























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

