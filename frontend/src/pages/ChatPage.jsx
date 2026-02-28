import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import api from "../utils/api";

const ChatPage = () => {
  const { id: jobId } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roomError, setRoomError] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load job info and message history
  useEffect(() => {
    Promise.all([
      api.get(`/jobs/${jobId}`),
      api.get(`/messages/${jobId}`),
    ])
      .then(([jobRes, msgRes]) => {
        setJob(jobRes.data);
        setMessages(msgRes.data);
      })
      .catch((err) => {
        if (err.response?.status === 403) {
          setRoomError("You don't have access to this chat");
        } else {
          setRoomError("Failed to load chat");
        }
      })
      .finally(() => setLoading(false));
  }, [jobId]);

  // Join socket room and listen for messages
  useEffect(() => {
    if (!socket || !job) return;

    // Join the private room for this job
    socket.emit("join_room", { jobId }, (response) => {
      if (response?.error) {
        setRoomError(response.error);
      }
    });

    // Listen for incoming messages
    const handleNewMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };
    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [socket, job, jobId]);

  const sendMessage = useCallback(
    (e) => {
      e.preventDefault();
      if (!text.trim() || sending || !socket) return;

      setSending(true);
      socket.emit("send_message", { jobId, text: text.trim() }, (response) => {
        setSending(false);
        if (response?.error) {
          alert(response.error);
        } else {
          setText("");
        }
      });
    },
    [text, jobId, socket, sending]
  );

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (roomError)
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <div className="card">
          <p className="text-red-600 font-medium">{roomError}</p>
          <button className="btn-secondary mt-4" onClick={() => navigate(-1)}>
            Go Back
          </button>
        </div>
      </div>
    );

  const otherUser =
    user._id === job?.clientId?._id || user._id === job?.clientId
      ? job?.assignedFreelancerId
      : job?.clientId;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col h-[calc(100vh-80px)]">
      {/* Chat Header */}
      <div className="card mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-gray-900">{job?.title}</h1>
          <p className="text-sm text-gray-500">
            Chatting with {otherUser?.name || "the other party"}
          </p>
        </div>
        <button className="btn-secondary text-sm" onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-white rounded-xl border border-gray-100 p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-8">
            No messages yet. Start the conversation!
          </div>
        )}

        {messages.map((msg) => {
          const isMe =
            msg.senderId?._id === user._id || msg.senderId === user._id;

          return (
            <div
              key={msg._id}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-xs lg:max-w-md ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                {!isMe && (
                  <span className="text-xs text-gray-500 mb-1 ml-1">
                    {msg.senderId?.name}
                  </span>
                )}
                <div
                  className={`px-4 py-2 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? "bg-blue-600 text-white rounded-tr-sm"
                      : "bg-gray-100 text-gray-900 rounded-tl-sm"
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-xs text-gray-400 mt-1 mx-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="flex gap-2 mt-4">
        <input
          type="text"
          className="input flex-1"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={2000}
          autoFocus
        />
        <button type="submit" className="btn-primary px-6" disabled={!text.trim() || sending}>
          {sending ? "..." : "Send"}
        </button>
      </form>
    </div>
  );
};

export default ChatPage;
