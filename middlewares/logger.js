const winston = require('winston');

const colors = {
	info: 'green',
	error: 'red',
};

//winston.addColors(colors);

const logConfiguration = {
	transports: [
		new winston.transports.File({ level: 'error', filename: 'logs/error.log' }),
		new winston.transports.File({ level: 'info', filename: 'logs/info.log' }),
	],
	 // Log kayıtlarının nasıl biçimlendirileceğini ve hangi bilgilerin içereceğini belirleyen yapılandırma.
	format: winston.format.combine(
		winston.format.json(),
		//winston.format.colorize({ all: false }),
		winston.format.label({ label: 'KAYITLAR --> ' }),
		winston.format.timestamp({ format: 'MMM-DD-YYYY HH:mm:ss' }),
		winston.format.printf(
			(info) =>
				`LOG SEVİYESİ : ${info.level} : ${info.label}: İŞLEM ZAMANI : ${[info.timestamp]}:  ${
					info.message
				}`
		)
	),
};

// Logların yönetildiği ana yapılandırma objesi
const logger = winston.createLogger(logConfiguration);

// Express uygulamasında kullanılacak olan log middleware'i
const loggerMiddleware = (req, res, next) => {
	const kullanici = req.session.isim || 'BİLİNMEYEN KULLANICI';

	  // HTTP istekleri hakkında bilgi kaydedilir.
	logger.info(`[${req.method}] URL : ${req.url} -- Kullanıcı: ${kullanici}`);
	next();
};

module.exports = loggerMiddleware;
