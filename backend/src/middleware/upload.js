const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const KYC_FIELDS = ['idCardFront', 'idCardBack'];

const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => ({
    folder: KYC_FIELDS.includes(file.fieldname) ? 'kyc' : 'avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    public_id: `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
  }),
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
