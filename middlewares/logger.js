// middleware/loggerMiddleware.js
const winston = require('winston');

const logConfiguration = {
	transports: [
		new winston.transports.File({ level: 'error', filename: 'logs/error.log' }),
		new winston.transports.File({ level: 'info', filename: 'logs/info.log' }),
		new winston.transports.File({ level: 'login', filename: 'logs/login.log' }),
		new winston.transports.File({ level: 'register', filename: 'logs/register.log' }),
	],
	format: winston.format.combine(
		winston.format.label({ label: 'Label' }),
		winston.format.timestamp({ format: 'MMM-DD-YYYY HH:mm:ss' }),
		winston.format.printf(
			(info) => `${info.level}: ${info.label}: ${[info.timestamp]}: ${info.message}`
		)
	),
};

const logger = winston.createLogger(logConfiguration);

// Loglama işlemini gerçekleştiren bir middleware
const loggerMiddleware = (req, res, next) => {
	// Loglama işlemi burada yapılır
	logger.info(`[${req.method}] ${req.url}`);
	next(); // Diğer middleware'e veya route'a geç
};

module.exports = loggerMiddleware;
