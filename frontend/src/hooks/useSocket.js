import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";

export const useSocket = (jobId) => {
  const socketRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!jobId) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    const socket = io(SOCKET_URL, { auth: { token }, transports: ["websocket"] });
    socketRef.current = socket;
    socket.on("connect", () => { setConnected(true); setError(null); socket.emit("join-room", { jobId }); });
    socket.on("connect_error", (err) => { setError(err.message); setConnected(false); });
    socket.on("new-message", (msg) => setMessages((prev) => [...prev, msg]));
    socket.on("error", (data) => setError(data.message));
    socket.on("disconnect", () => setConnected(false));
    return () => { socket.emit("leave-room", { jobId }); socket.disconnect(); };
  }, [jobId]);

  const sendMessage = (text) => {
    if (socketRef.current && connected) socketRef.current.emit("send-message", { jobId, text });
  };

  const sendFileMessage = (file) => {
    if (socketRef.current && connected) socketRef.current.emit("send-file-message", { jobId, file });
  };

  return { messages, setMessages, sendMessage, sendFileMessage, connected, error };
};

export const useNotificationSocket = (onNotification) => {
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const socket = io(SOCKET_URL, { auth: { token }, transports: ["websocket"] });
    socketRef.current = socket;
    socket.on("notification", (notification) => { if (onNotification) onNotification(notification); });
    return () => socket.disconnect();
  }, [onNotification]);
};