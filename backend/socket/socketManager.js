const jwt          = require('jsonwebtoken');
const User         = require('../models/User');
const Job          = require('../models/Job');
const Message      = require('../models/Message');
const Notification = require('../models/Notification');

const initSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Auth required'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch (err) { next(new Error('Invalid token')); }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 ${socket.user.name} connected`);

    socket.join(`user:${socket.user._id}`);

    socket.on('join-room', async ({ jobId }) => {
      try {
        if (!jobId) return socket.emit('error', { message: 'jobId required' });
        const job = await Job.findById(jobId);
        if (!job) return socket.emit('error', { message: 'Job not found' });
        const isClient     = String(job.clientId) === String(socket.user._id);
        const isFreelancer = String(job.assignedFreelancerId) === String(socket.user._id);
        if (!isClient && !isFreelancer) return socket.emit('error', { message: 'Not authorized' });
        if (job.status !== 'in-progress') return socket.emit('error', { message: 'Messaging only available for in-progress jobs' });
        socket.join(jobId);
        socket.emit('room-joined', { jobId });
      } catch (err) { socket.emit('error', { message: 'Failed to join room' }); }
    });

    // Text message
    socket.on('send-message', async ({ jobId, text }) => {
      try {
        if (!jobId || !text?.trim()) return socket.emit('error', { message: 'jobId and text required' });
        const job = await Job.findById(jobId);
        if (!job || job.status !== 'in-progress') return socket.emit('error', { message: 'Not available' });
        const isClient     = String(job.clientId) === String(socket.user._id);
        const isFreelancer = String(job.assignedFreelancerId) === String(socket.user._id);
        if (!isClient && !isFreelancer) return socket.emit('error', { message: 'Not authorized' });

        const message = await Message.create({ jobId, senderId: socket.user._id, text: text.trim().substring(0, 1000) });

        const payload = {
          _id: message._id, jobId,
          sender: { _id: socket.user._id, name: socket.user.name, role: socket.user.role },
          text: message.text, timestamp: message.timestamp, file: null,
        };

        io.to(jobId).emit('new-message', payload);

        const notifyUserId = isClient ? job.assignedFreelancerId : job.clientId;
        const notification = await Notification.create({
          userId: notifyUserId, type: 'new_message',
          message: `${socket.user.name} sent you a message`, jobId,
        });
        io.to(`user:${notifyUserId}`).emit('notification', notification);
      } catch (err) { socket.emit('error', { message: 'Failed to send message' }); }
    });

    // File message — file already uploaded to Cloudinary, just save and broadcast
    socket.on('send-file-message', async ({ jobId, file }) => {
      try {
        if (!jobId || !file?.url) return socket.emit('error', { message: 'jobId and file required' });
        const job = await Job.findById(jobId);
        if (!job || job.status !== 'in-progress') return socket.emit('error', { message: 'Not available' });
        const isClient     = String(job.clientId) === String(socket.user._id);
        const isFreelancer = String(job.assignedFreelancerId) === String(socket.user._id);
        if (!isClient && !isFreelancer) return socket.emit('error', { message: 'Not authorized' });

        const message = await Message.create({
          jobId,
          senderId: socket.user._id,
          text: '',
          file: {
            url:          file.url,
            originalName: file.originalName,
            fileType:     file.fileType,
            size:         file.size,
          },
        });

        const payload = {
          _id: message._id, jobId,
          sender: { _id: socket.user._id, name: socket.user.name, role: socket.user.role },
          text: '', file: message.file, timestamp: message.timestamp,
        };

        io.to(jobId).emit('new-message', payload);

        const notifyUserId = isClient ? job.assignedFreelancerId : job.clientId;
        const notification = await Notification.create({
          userId: notifyUserId, type: 'new_message',
          message: `${socket.user.name} sent you a file`, jobId,
        });
        io.to(`user:${notifyUserId}`).emit('notification', notification);
      } catch (err) { socket.emit('error', { message: 'Failed to send file message' }); }
    });

    socket.on('leave-room', ({ jobId }) => { socket.leave(jobId); });
    socket.on('disconnect', () => { console.log(`🔌 ${socket.user?.name} disconnected`); });
  });
};

module.exports = initSocket;
