import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";

const SOCKET_URL =
  process.env.REACT_APP_SOCKET_URL ||
  process.env.REACT_APP_API_URL?.replace("/api", "") ||
  "http://localhost:5000";

// ─── Shared singleton socket ──────────────────────────────────────────────────
// One socket per browser session, shared by both hooks.
// This ensures user:XXX room is always joined on connect so notifications arrive.
let sharedSocket = null;

const getSharedSocket = () => {
  if (!sharedSocket || sharedSocket.disconnected) {
    const token = localStorage.getItem("token");
    if (!token) return null;
    sharedSocket = io(SOCKET_URL, {
      auth: { token },
      // DO NOT use websocket-only — Render requires polling handshake first
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return sharedSocket;
};

// ─── Chat hook ────────────────────────────────────────────────────────────────
export const useSocket = (jobId) => {
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!jobId) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = getSharedSocket();
    if (!socket) return;
    socketRef.current = socket;

    const onConnect = () => {
      setConnected(true);
      setError(null);
      socket.emit("join-room", { jobId });
    };
    const onDisconnect = () => setConnected(false);
    const onConnectError = (err) => { setError(err.message); setConnected(false); };
    const onMessage = (msg) => setMessages((prev) => [...prev, msg]);
    const onError = (data) => setError(data.message);

    // If already connected when this hook mounts, join room immediately
    if (socket.connected) {
      setConnected(true);
      socket.emit("join-room", { jobId });
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("new-message", onMessage);
    socket.on("error", onError);

    return () => {
      socket.emit("leave-room", { jobId });
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("new-message", onMessage);
      socket.off("error", onError);
    };
  }, [jobId]);

  const sendMessage = useCallback((text) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("send-message", { jobId, text });
    }
  }, [jobId]);

  const sendFileMessage = useCallback((file) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("send-file-message", { jobId, file });
    }
  }, [jobId]);

  return { messages, setMessages, sendMessage, sendFileMessage, connected, error };
};

// ─── Notification hook ────────────────────────────────────────────────────────
// Reuses the shared socket — server joins user:XXX room on connect automatically,
// so all notification emits reach this socket correctly.
export const useNotificationSocket = (onNotification) => {
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = getSharedSocket();
    if (!socket) return;

    const onNotif = (notification) => {
      if (onNotification) onNotification(notification);
    };

    socket.on("notification", onNotif);
    return () => socket.off("notification", onNotif);
  }, [onNotification]);
};