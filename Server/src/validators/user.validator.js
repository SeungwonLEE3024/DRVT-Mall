const { body } = require('express-validator');

// 내 프로필 수정 시 이름, 전화번호, 마케팅 동의, 배송지 배열을 검증합니다.
const updateProfileRules = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Name must be between 1 and 50 characters'),
  body('phone')
    .optional()
    .trim()
    .matches(/^[0-9\-+() ]{7,20}$/)
    .withMessage('Invalid phone number format'),
  body('marketingOptIn')
    .optional()
    .isBoolean()
    .withMessage('marketingOptIn must be a boolean'),
  body('addresses')
    .optional()
    .isArray()
    .withMessage('addresses must be an array'),
  body('addresses.*.label')
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage('Address label must be at most 30 characters'),
  body('addresses.*.zipCode')
    .optional()
    .trim()
    .isLength({ max: 10 })
    .withMessage('zipCode must be at most 10 characters'),
  body('addresses.*.address1')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('address1 must be at most 200 characters'),
  body('addresses.*.address2')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('address2 must be at most 200 characters'),
  body('addresses.*.isDefault')
    .optional()
    .isBoolean()
    .withMessage('isDefault must be a boolean'),
];

module.exports = { updateProfileRules };
