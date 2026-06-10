const admin = (req, res, next) => {
  // auth 미들웨어가 넣어준 사용자 role로 관리자 권한을 확인합니다.
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      code: 'FORBIDDEN',
      message: 'Admin permission is required',
    });
  }

  next();
};

module.exports = admin;
