const twilio = require('twilio');
require('dotenv').config();



async function sendSMSMiddleware(id,sifre) {

  const mesaj = `Üyeliğiniz Oluşturuldu Kullanıcı Adı = ${id}    Şifre : ${sifre}`;

  const client = new twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

  try {
    const message = await client.messages.create({
      body: mesaj,
      from: '+18149759524',
      to: process.env.TELEFON,
    });

    console.log('SMS gönderme başarılı:', message.sid);
  } catch (error) {
    console.error('SMS gönderme hatası:', error.message);
  }
}
  


module.exports = sendSMSMiddleware;
