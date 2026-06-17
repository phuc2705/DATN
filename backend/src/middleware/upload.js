const multer = require('multer');
const path = require('path');
const fs = require('fs');

const avatarDir = path.join(__dirname, '../../public/uploads/avatars');
const kycDir    = path.join(__dirname, '../../public/uploads/kyc');
if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });
if (!fs.existsSync(kycDir))    fs.mkdirSync(kycDir,    { recursive: true });

const KYC_FIELDS = ['idCardFront', 'idCardBack'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, KYC_FIELDS.includes(file.fieldname) ? kycDir : avatarDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const prefix = KYC_FIELDS.includes(file.fieldname) ? file.fieldname : 'avatar';
    cb(null, `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Chỉ chấp nhận file ảnh (jpg, png, webp...)'), false);
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});
