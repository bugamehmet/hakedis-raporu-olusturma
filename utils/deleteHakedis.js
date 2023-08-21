const connection = require('../db');

module.exports = function deleteHakedis(res, k_id, s_id, no ){
	let query = 'DELETE FROM haz_hakedis_2 WHERE kullanici_id = ? AND s_id = ? AND no = ?';
	let params = [k_id, s_id, no];
	connection.query(query, params, (err, results)=>{
		if (err) {
			console.log(err)
      res.status(500).json({ error: 'Veri silinemedi.' });
    } else {
      res.json({ success: 'Veri başarıyla silindi.' });
    }

	})
}