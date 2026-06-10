// 클라이언트에 노출할 사용자 프로필 필드만 정리합니다.
const formatUser = (user) => ({
  id: user._id,
  email: user.email,
  name: user.name,
  phone: user.phone,
  isVerified: user.isVerified,
  marketingOptIn: user.marketingOptIn,
  addresses: user.addresses,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

// 인증된 사용자의 내 프로필 정보를 조회합니다.
const getMe = async (req, res, next) => {
  try {
    res.json({
      success: true,
      user: formatUser(req.user),
    });
  } catch (error) {
    next(error);
  }
};

// 인증된 사용자의 이름, 전화번호, 마케팅 동의, 배송지 정보를 수정합니다.
const updateMe = async (req, res, next) => {
  try {
    const { name, phone, marketingOptIn, addresses } = req.body;
    const user = req.user;

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (marketingOptIn !== undefined) user.marketingOptIn = marketingOptIn;

    if (addresses !== undefined) {
      const hasDefault = addresses.some((addr) => addr.isDefault);

      // 기본 배송지가 지정되지 않았다면 첫 번째 배송지를 기본값으로 설정합니다.
      user.addresses = addresses.map((addr, index) => ({
        label: addr.label,
        zipCode: addr.zipCode,
        address1: addr.address1,
        address2: addr.address2,
        isDefault: hasDefault ? Boolean(addr.isDefault) : index === 0,
      }));
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: formatUser(user),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMe, updateMe };
