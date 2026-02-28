const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Job = require("../models/Job");
const Message = require("../models/Message");

/**
 * SOCKET AUTHENTICATION MIDDLEWARE
 *
 * How it works:
 * 1. Client sends JWT in socket handshake: `{ auth: { token: "..." } }`
 * 2. Before the "connection" event fires, this middleware:
 *    a. Extracts the token from socket.handshake.auth.token
 *    b. Verifies the JWT signature and expiry using jwt.verify()
 *    c. Fetches the user from DB and attaches to socket.user
 *    d. Calls next() only if valid — otherwise calls next(new Error(...))
 * 3. If authentication fails, the socket connection is rejected immediately
 *    and no events can be received/emitted by the client
 *
 * This ensures EVERY connected socket represents an authenticated user.
 */
const socketAuthMiddleware = async (socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error("Authentication error: No token provided"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return next(new Error("Authentication error: User not found"));

    socket.user = user; // Attach user to socket for use in event handlers
    next();
  } catch (err) {
    next(new Error("Authentication error: Invalid or expired token"));
  }
};

const initSocket = (io) => {
  // Apply auth middleware to ALL socket connections
  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.user.name} (${socket.user._id})`);

    /**
     * JOIN_ROOM event
     * Client emits: { jobId }
     * Checks:
     * - Job exists
     * - Job is "in-progress"
     * - User is client or assigned freelancer for this job
     *
     * SECURITY: We re-verify authorization server-side on every join attempt.
     * The client cannot simply send any jobId and join.
     */
    socket.on("join_room", async ({ jobId }, callback) => {
      try {
        const job = await Job.findById(jobId);
        if (!job) return callback?.({ error: "Job not found" });

        if (job.status !== "in-progress") {
          return callback?.({ error: "Messaging only available for in-progress jobs" });
        }

        const isClient = job.clientId.toString() === socket.user._id.toString();
        const isFreelancer =
          job.assignedFreelancerId?.toString() === socket.user._id.toString();

        if (!isClient && !isFreelancer) {
          return callback?.({ error: "Not authorized to join this room" });
        }

        // Room ID is the jobId — private per contract
        socket.join(jobId);
        console.log(`${socket.user.name} joined room: ${jobId}`);
        callback?.({ success: true });
      } catch (err) {
        callback?.({ error: "Server error joining room" });
      }
    });

    /**
     * SEND_MESSAGE event
     * Client emits: { jobId, text }
     * - Re-verifies authorization (defense in depth)
     * - Sanitizes input
     * - Persists to MongoDB
     * - Broadcasts to all users in the room
     */
    socket.on("send_message", async ({ jobId, text }, callback) => {
      try {
        if (!text?.trim()) return callback?.({ error: "Empty message" });
        if (text.length > 2000) return callback?.({ error: "Message too long" });

        const job = await Job.findById(jobId);
        if (!job || job.status !== "in-progress") {
          return callback?.({ error: "Cannot send message to this job" });
        }

        const isClient = job.clientId.toString() === socket.user._id.toString();
        const isFreelancer =
          job.assignedFreelancerId?.toString() === socket.user._id.toString();

        if (!isClient && !isFreelancer) {
          return callback?.({ error: "Not authorized" });
        }

        // Persist message to DB
        const message = await Message.create({
          jobId,
          senderId: socket.user._id,
          text: text.trim(),
        });

        const payload = {
          _id: message._id,
          jobId,
          senderId: {
            _id: socket.user._id,
            name: socket.user.name,
            role: socket.user.role,
          },
          text: message.text,
          timestamp: message.timestamp,
        };

        // Broadcast to room (including sender)
        io.to(jobId).emit("new_message", payload);
        callback?.({ success: true });
      } catch (err) {
        console.error("Socket message error:", err);
        callback?.({ error: "Failed to send message" });
      }
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.user?.name}`);
    });
  });
};

module.exports = initSocket;
