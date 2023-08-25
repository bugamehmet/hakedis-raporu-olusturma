module.exports = function checkUserRole(role) {
    // Middleware işlevi, belirtilen 'role' ile kullanıcının rolünü karşılaştırır.
  return (req, res, next) => {
        // Eğer kullanıcının rolü belirtilen role eşitse, bir sonraki middleware'e geçer.

    if (req.session.role === role) {
      return next(); 
    } else {
            // Kullanıcının rolü belirtilen role eşleşmezse, 403 (Forbidden) hata koduyla bir hata yanıtı gönderir.
      return res.status(403).send('Yetkisiz erişim');
    }
  };
};