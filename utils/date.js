let date = new Date();
let gun = date.getDate();
let ay = date.getMonth() + 1;
let yil = date.getFullYear();
function yilx(){
  return yil;
}
function gunx() {
	if (gun < 10) {
		return '0' + gun;
	} else {
		return gun;
	}
}
function ayx() {
	if (ay < 10) {
		return '0' + ay;
	} else {
		return ay;
	}
}
module.exports = {
  yilx, gunx, ayx
};