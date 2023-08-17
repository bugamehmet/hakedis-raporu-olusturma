const connection = require('../db');

function inserthakedisKapagi(
	userId,
	sirket_id,
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
	is_bitim_tarihi
) {
	return new Promise((resolve, reject) => {
		let query =
			'INSERT INTO hakedis_raporu (kullanici_id, s_id, uygulama_yili, tarih, is_adi, proje_no, yuklenici_adi, sozlesme_bedeli, ihale_tarihi, kayit_no, sozlesme_tarih, isyeri_teslim_tarihi, isin_suresi, is_bitim_tarihi) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
		let params = [
			userId,
			sirket_id,
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
		];
		connection.query(query, params, (err, results) => {
			if (err) {
				reject(err);
			} else {
				resolve();
			}
		});
	});
}
function inserthakedisRaporu(userId, sirket_id, is_adi, sozlesme_bedeli, isin_suresi) {
	return new Promise((resolve, reject) => {
		let query =
			'INSERT INTO hakedis_2 (kullanici_id, s_id, isin_adi, sozlesme_bedeli, is_sure) VALUES (?, ?, ?, ?, ?)';
		let params = [userId, sirket_id, is_adi, sozlesme_bedeli, isin_suresi];
		connection.query(query, params, (err, res) => {
			if (err) {
				reject(err);
			} else {
				resolve();
			}
		});
	});
}
function insertYapilanisler(userId, sirket_id, is_adi, sozlesme_bedeli, isin_suresi) {
	return new Promise((resolve, reject) => {
		let query =
			'INSERT INTO hakedis_3 (kullanici_id, s_id, isin_adi, sozlesme_bedeli, isin_suresi) VALUES (?, ?, ?, ?, ?)';
		let params = [userId, sirket_id, is_adi, sozlesme_bedeli, isin_suresi];

		connection.query(query, params, (err, res) => {
			if (err) {
				reject(err);
			} else {
				resolve();
			}
		});
	});
}
module.exports = {inserthakedisKapagi, inserthakedisRaporu, insertYapilanisler}