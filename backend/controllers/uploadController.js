const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const Job = require('../models/Job');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.uploadFile = async (req, res, next) => {
  try {
    const { jobId } = req.body;
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
    const isClient     = String(job.clientId) === String(req.user._id);
    const isFreelancer = String(job.assignedFreelancerId) === String(req.user._id);
    if (!isClient && !isFreelancer)
      return res.status(403).json({ success: false, message: 'Not authorized.' });

    const mime = req.file.mimetype;
    const isImage = ['image/jpeg','image/png','image/gif','image/webp'].includes(mime);
    const isDoc   = ['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(mime);

    if (!isImage && !isDoc)
      return res.status(400).json({ success: false, message: 'Only images and PDF/DOCX files are allowed.' });

    const folder       = `freelancehub/job_${jobId}`;
    const resourceType = isImage ? 'image' : 'raw';

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: resourceType, use_filename: true, unique_filename: true },
        (error, result) => error ? reject(error) : resolve(result)
      );
      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    });

    // Return the plain Cloudinary URL — download is handled on the frontend
    // using a blob fetch so the correct filename is always preserved
    res.json({
      success: true,
      file: {
        url:          result.secure_url,
        originalName: req.file.originalname,
        fileType:     isImage ? 'image' : 'document',
        size:         req.file.size,
      },
    });
  } catch (err) { next(err); }
};
