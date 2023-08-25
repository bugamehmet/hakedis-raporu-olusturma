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

const logger = winston.createLogger(logConfiguration);

const loggerMiddleware = (req, res, next) => {
	const kullanici = req.session.isim || 'BİLİNMEYEN KULLANICI';
	logger.info(`[${req.method}] URL : ${req.url} -- Kullanıcı: ${kullanici}`);
	next();
};

module.exports = loggerMiddleware;
