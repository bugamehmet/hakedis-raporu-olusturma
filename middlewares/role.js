


module.exports = function checkUserRole(role) {
  return (req, res, next) => {
    if (req.session.role === role) {
      return next(); 
    } else {
      return res.status(403).send('Yetkisiz erişim');
    }
  };
};