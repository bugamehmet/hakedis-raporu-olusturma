const mysql = require('mysql');   // mysql modülünü içe aktarır
const config = require("./config"); // Veritabanı yapılandırma ayarlarını içe aktarır
const connection = mysql.createConnection(config.db); // MySQL bağlantısını oluşturur

// MySQL sunucusuna bağlanmayı deneyin
connection.connect((error) => {
	if (error) throw error; // Hata oluşursa hatayı fırlatır
	else console.log('bağlanıldı!'); // Bağlantı başarılıysa konsola bağlandı mesajı yazdırır
});

// Bağlantıyı başka dosyalarda kullanılabilir hale getirir
module.exports = connection;
