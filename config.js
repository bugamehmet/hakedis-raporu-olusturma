// Yapılandırma nesnesi oluşturuyoruz.
const config = {
  db: {
    host: 'localhost',     // Veritabanı sunucusunun adresi
    user: 'root',          // Veritabanı kullanıcısı adı
    password: '12345678',  // Veritabanı kullanıcısı şifresi
    database: 'userDB'     // Kullanılacak veritabanı adı
  }
}

// Yapılandırma nesnesini başka dosyalarda kullanılabilir hale getiriyoruz
module.exports = config;
