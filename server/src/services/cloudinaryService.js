const { cloudinary } = require('../config/cloudinary')

exports.deleteResource = async (publicId) => {
  return cloudinary.uploader.destroy(publicId, { resource_type: 'raw' })
}
