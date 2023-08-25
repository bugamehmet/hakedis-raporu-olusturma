const twilio = require('twilio');
require('dotenv').config();


// Kullanıcıya SMS göndermek için async bir işlev tanımlanır.

async function sendSMSMiddleware(id,sifre) {

    // SMS içeriği oluşturulur
  const mesaj = `Üyeliğiniz Oluşturuldu Kullanıcı Adı = ${id}    Şifre : ${sifre}`;

    // Twilio istemcisini oluşturur ve konfigürasyon bilgilerini kullanır

  const client = new twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

  try {
    // Twilio üzerinden SMS gönderme işlemi yapılır
    const message = await client.messages.create({
      body: mesaj, // Gönderilecek SMS metni
      from: '+18149759524', // Gönderen telefon numarası (Twilio numaranız)
      to: process.env.TELEFON, // Alıcı telefon numarası (çevirmeniz gereken numara)
    });

    console.log('SMS gönderme başarılı:', message.sid);
  } catch (error) {
    console.error('SMS gönderme hatası:', error.message);
  }
}
  

// Bu işlevi dışa aktarır, böylece başka bir modül tarafından kullanılabilir hale gelir.
module.exports = sendSMSMiddleware;
