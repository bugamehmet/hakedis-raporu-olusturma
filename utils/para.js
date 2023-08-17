module.exports=function para(number, fractionDigits = 2) {
	const formattedNumber = parseFloat(number).toFixed(fractionDigits);
	return '₺ ' + formattedNumber.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
