const mysql = require("mysql");
const express = require("express");
const fs = require('fs');
const PDFDocument = require('pdfkit');

const app = express();
app.use("/assets", express.static("assets"));

const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "12345678",
    database: "userDB"
});

connection.connect(function(error){
    if (error) throw error;
    else console.log("bağlanıldı!");
});

app.use(express.urlencoded({ extended: true }));

app.get("/",function(req,res){
    res.sendFile(__dirname + "/index.html");
});

app.post("/", function(req,res){
    var username = req.body.username;
    var password = req.body.password;

    connection.query("select * from userTable where username = ? and password = ?",[username,password],function(error,results,fields){
        if (results.length > 0) {
            res.redirect("/welcome");
        } else {
            res.redirect("/");
        }
        res.end();
    });
});

// bağlantı başarılıysa yönlendirme
app.get("/welcome",function(req,res){
    res.sendFile(__dirname + "/welcome.html");
});

// KAYIT YAPMA
app.get("/register.html", function(req, res) {
    res.sendFile(__dirname + "/register.html");
});

app.post("/register", function(req, res) {
    var username = req.body.username;
    var password = req.body.password;

    // Veritabanına kullanıcıyı kaydetme işlemi
    connection.query("INSERT INTO userTable (username, password) VALUES (?, ?)", [username, password], function(error, results, fields) {
        if (error) {
            console.log("Kayıt olma hatası:", error);
            res.redirect("/");
        } else {
            res.redirect("/");
        }
        res.end();
    });
});

app.get("/welcome.html", function(req, res) {
    res.sendFile(__dirname + "/welcome.html");
});

app.post("/welcome", function(req, res) {
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


    connection.query("INSERT INTO hakedis_raporu (no, uygulama_yili, tarih, is_adi, proje_no, yuklenici_adi, sozlesme_bedeli, ihale_tarihi, kayit_no, sozlesme_tarih, isyeri_teslim_tarihi, isin_suresi, is_bitim_tarihi) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [no, uygulama_yili, tarih, is_adi, proje_no, yuklenici_adi, sozlesme_bedeli, ihale_tarihi, kayit_no, sozlesme_tarih, isyeri_teslim_tarihi, isin_suresi, is_bitim_tarihi], function(error, results, fields) {
        if (error) {
            console.log("Belge Kaydedilemedi");
            res.redirect("/welcome");
        } else {
            res.redirect("/welcome");
        }
        res.end();
    });
});

// -----------------PDF OLUŞTURMA---------------------
/*//const doc = new PDFDocument();
// PDF dosyasına yazdırma işlemi
//const outputStream = fs.createWriteStream('hakedis_raporu.pdf');
//doc.pipe(outputStream);

// Veritabanından verileri çekme
connection.query('SELECT * FROM hakedis_raporu ', (error, results) => {
  if (error) {
    console.error('MySQL query failed: ', error);
    return;
  }

  // Hakediş raporu başlığı
  doc.font('arial.ttf').fontSize(16).text('Hakediş Raporu', { align: 'center' });
  doc.moveDown();

  // Verileri PDF'e yazdırma
  results.forEach((row) => {
    doc.font('arial.ttf').fontSize(12)
      .text(`Tarihi: ${row.tarih}`)
      .text(`No su: ${row.no}`)
      .text(`Uygulama Yılı: ${row.uygulama_yili}`)
      .text(`Yapılan işin / Hizmetin Adı: ${row.is_adi}`)
      .text(`Yapılan İsin / Hizmetin Etüd / Proje No su: ${row.proje_no}`)
      .text(`Yüklenicinin Adi / Ticari Unvanı: ${row.yuklenici_adi}`)
      .text(`Sözleşme Bedeli: ${row.sozlesme_bedeli}`)
      .text(`İhale Tarihi: ${row.ihale_tarihi}`)
      .text(`Kayıt no: ${row.kayit_no}`)
      .text(`Sözleşme Tarihi: ${row.sozlesme_tarihi}`)
      .text(`İşyeri Teslim Tarihi: ${row.isyeri_teslim_tarihi}`)
      .text(`Sözleşmeye Göre İşin Süresi: ${row.isin_suresi}`)
      .text(`Sözleşmeye Göre İş Bitim Tarihi: ${row.is_bitim_tarihi}`);
    doc.moveDown();
  });

  // PDF dosyasına yazdırma işlemini tamamla
  doc.end();

  // PDF dosyasının oluşturulduğunu bildir
  outputStream.on('finish', () => {
    console.log('Hakediş raporu başarıyla oluşturuldu.');
  });

  // Hata durumunda işlemi bildir
  outputStream.on('error', (error) => {
    console.error('Hata oluştu:', error);
  });
});
*/


//--------------İNDİRME İNŞALLAH-------------//

app.get('/generate-pdf', (req, res) => {
    // PDF oluşturma işlemleri
    const doc = new PDFDocument();
  
    // PDF dosyasına yazdırma işlemi
    // Veritabanından verileri çekme
    connection.query('SELECT * FROM hakedis_raporu ORDER BY h_id DESC LIMIT 1 ', (error, results) => {
      if (error) {
        console.error('MySQL query failed: ', error);
        return;
      }
      // Üst kısım resimler ve yazılar
      const logoLeft = 'assets/gorseller/logo_left.png'; // Sol taraftaki logo resmi
      const logoRight = 'assets/gorseller/logo_right.png'; // Sağ taraftaki logo resmi
     
      // Sol taraftaki logo resmini ekleyelim
      doc.image(logoLeft, 20, 50, { width: 40, height: 60 });

      // Sağ taraftaki logo resmini ekleyelim
      doc.image(logoRight, 550, 50, { width: 40, height: 60 });
     // "T.C" yazısını ekleyelim
      doc.font('arial.ttf').fontSize(12).text('T.C', 100, 30, { align: 'center' });
      doc.font('arial.ttf').fontSize(12).text('SAMSUN BÜYÜK ŞEHİR BELEDİYESİ', 100, 50, { align: 'center' });

      // "SAMSUN SU VE KANALİZASYON GENEL MÜDÜRLÜĞÜ" yazısını ekleyelim
      doc.font('arial.ttf').fontSize(12).text('SAMSUN SU VE KANALİZASYON GENEL MÜDÜRLÜĞÜ', 100, 70, { align: 'center' });

      // "BİLGİ İŞLEM DAİRESİ BAŞKANLIĞI" yazısını ekleyelim
      doc.font('arial.ttf').fontSize(12).text('BİLGİ İŞLEM DAİRESİ BAŞKANLIĞI', 100, 90, { align: 'center' });




        // Hakediş raporu başlığı
        doc.font('arial.ttf').fontSize(16).text('Hakediş Raporu', 100, 150, { align: 'center' });
        doc.moveDown();
  
      // Verileri PDF'e yazdırma
      results.forEach((row) => {
        doc.font('arial.ttf').fontSize(12)
          .text(`Tarihi: ${row.tarih}`, {align:'center'})
          .text(`No su: ${row.no}`, {align:'center'})
          .text(`Uygulama Yılı: ${row.uygulama_yili}`,{align:'center'})

          .text('Yapılan işin / Hizmetin Adı:', 20,300,{continued: true })
          .text(` ${row.is_adi}`,90,300)

          .text(`Yapılan İsin / Hizmetin Etüd / Proje No su: ${row.proje_no}`, 20, 320)

          .text(`Yüklenicinin Adi / Ticari Unvanı: ${row.yuklenici_adi}`,20, 340)

          .text(`Sözleşme Bedeli: ${row.sozlesme_bedeli}`,20, 360)

          .text(`İhale Tarihi: ${row.ihale_tarihi}`,20, 380)

          .text(`Kayıt no: ${row.kayit_no}`,20, 400)

          .text(`Sözleşme Tarihi: ${row.sozlesme_tarihi}`,20, 420)

          .text(`İşyeri Teslim Tarihi: ${row.isyeri_teslim_tarihi}`,20, 440)

          .text(`Sözleşmeye Göre İşin Süresi: ${row.isin_suresi}`,20, 460)

          .text(`Sözleşmeye Göre İş Bitim Tarihi: ${row.is_bitim_tarihi}`,20, 480);

        doc.moveDown();
      });
  
      // PDF dosyasına yazdırma işlemini tamamla
      doc.end();
  
      // PDF dosyasının oluşturulduğunu bildir
      console.log('Hakediş raporu başarıyla ouşturuldu');
  
      // PDF dosyasını indirme
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=hakedis_raporu.pdf');
      doc.pipe(res);
    });
  });
  

// MySQL bağlantısını kapat
// connection.end();
app.listen(5001);