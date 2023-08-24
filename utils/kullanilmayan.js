
// USERHOME.EJS --- PDF LERİ AYRİ AYRİ OLUSTURMA // 
/*
				<form action="/hakedis-kapagi" method="post">
					<button type="submit">Hakediş Kapağı Oluştur</button>
					<br /><br />
					<select name="sirket_id" class="custom-select">
						<% if (data && data.length > 0) { %>
						<option value="" disabled selected>Bir şirket seçin</option>
						<% const uniqueCompanies = []; data.forEach(item => { if
						(!uniqueCompanies.includes(item.s_id)) { uniqueCompanies.push(item.s_id); %>
						<option value="<%= item.s_id %>"><%= item.isin_adi %></option>
						<% } }); %> <% } else { %>
						<option value="" disabled selected>Veri Yok</option>
						<% } %>
					</select>
				</form>

				<form action="/hakedis-raporu" method="post">
					<button type="submit">Hakediş Raporu Oluştur</button>
					<br /><br />
					<select name="sirket_id" class="custom-select">
						<option value="" disabled selected>Bir şirket seçin</option>
						<% const uniqueCompaniess = []; if (data && data.length > 0) { data.forEach(item => { if
						(!uniqueCompaniess.includes(item.s_id)) { uniqueCompaniess.push(item.s_id); %>
						<option value="<%= item.s_id %>"><%= item.isin_adi %></option>
						<% } }); } else { %>
						<option value="" disabled selected>Veri Yok</option>
						<% } %>
					</select>
					<br />
					<input
						type="text"
						id="hakedis_tutari"
						name="hakedis_tutari"
						value="20"
						placeholder="HAKEDİŞ TUTARI"
						required
					/>
					<br />
					<input
						type="text"
						id="fiyat_farki"
						name="fiyat_farki"
						value="20"
						placeholder="Fiyat Farkı"
						required
					/>
					<br />
					<input
						type="text"
						id="gecikme"
						name="gecikme"
						value="20"
						placeholder="Para Cezası"
						required
					/>
					<br />
					<input
						type="text"
						id="kesinti"
						name="kesinti"
						value="20"
						placeholder="Kesinti"
						required
					/>
					<br />
					<label for="">KDV TEVFİKATI</label>
					<br />
					<input type="radio" name="var_yok" value="var" checked /> Var
					<input type="radio" name="var_yok" value="yok" /> Yok
				</form>

				<form action="/yapilan-isler" method="post">
					<button type="submit">Yapılan İşler Listesi Oluştur</button>
					<br /><br />
					<select name="sirket_id" class="custom-select">
						<option value="" disabled selected>Bir şirket seçin</option>
						<% const uniqueCompaniesss = []; if (data && data.length > 0) { data.forEach(item => {
						if (!uniqueCompaniesss.includes(item.s_id)) { uniqueCompaniesss.push(item.s_id); %>
						<option value="<%= item.s_id %>"><%= item.isin_adi %></option>
						<% } }); } else { %>
						<option value="" disabled selected>Veri Yok</option>
						<% } %>
					</select>
					<br />
					<input
						type="text"
						id="hakedis_tutari_2"
						name="hakedis_tutari_2"
						placeholder="HAKEDİŞ TUTARI"
						required
					/>
				</form>
*/