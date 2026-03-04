const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const ctrl    = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg','image/png','image/gif','image/webp','application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('File type not allowed'));
  },
});

router.post('/', protect, upload.single('file'), ctrl.uploadFile);

module.exports = router;
