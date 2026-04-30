const cloudinary    = require('cloudinary').v2
const { CloudinaryStorage } = require('multer-storage-cloudinary')
const multer        = require('multer')

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:   'se-file-mgmt',
    resource_type: 'raw',
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB — NFR-02
})

module.exports = { cloudinary, upload }
