import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUserContext } from "./UserContext";
import { COLLABORATION_API_URL } from "@/lib/collaborationApi";
import { io } from "socket.io-client";
import { toast } from "sonner";

const CollaborationSessionContext = createContext(null);

export const CollaborationSessionProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUserContext();
  const socket = useRef(null);
  const [messages, setMessages] = useState([]);
  const sentClientMessageIds = useRef(new Set());

  useEffect(() => {
    if (!user || !user.collaborationSessionId) return;
    // Always connect when a session exists; navigate only if needed
    connectToSessionSocket();
    if (location.pathname !== "/session") {
      navigate("/session");
    }
  }, [user, location]);

  const connectToSessionSocket = useCallback(() => {
    if (socket.current) return; // Already connected

    socket.current = io(COLLABORATION_API_URL, {
      auth: { token: localStorage.getItem("token") },
      reconnection: true,
    });

    socket.current.on("connect", () => {
      toast.success("Connected to collaboration session.");
      socket.current.emit("session:join", {
        sessionId: user.collaborationSessionId,
      });
    });

    socket.current.on("session:chat:message", ({ message }) => {
      // Ignore server echo for messages we already optimistically added
      if (message?.clientMessageId && sentClientMessageIds.current.has(message.clientMessageId)) {
        sentClientMessageIds.current.delete(message.clientMessageId);
        return;
      }
      setMessages((prev) => [
        ...prev,
        {
          ...message,
          isCurrentUser: message?.sender?.id === user?.id,
        },
      ]);
    });

    socket.current.on("disconnect", () => {
      toast.error("Disconnected from collaboration session.");
    });
  }, []);

  const sendChatMessage = useCallback((content) => {
    if (!socket.current) return;
    if (!content || !content.trim()) return;

    const clientMessageId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const optimistic = {
      id: clientMessageId,
      content,
      timestamp: new Date().toISOString(),
      sender: { id: user?.id, name: user?.username || user?.name || "You" },
      isCurrentUser: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    sentClientMessageIds.current.add(clientMessageId);

    socket.current.emit(
      "session:chat:message",
      { content, clientMessageId },
      (ack) => {
        if (!ack?.ok) {
          toast.error(ack?.error?.message || "Failed to send message");
        }
      }
    );
  }, [user]);

  return (
    <CollaborationSessionContext.Provider value={{
      messages,
      sendChatMessage,
    }}>
      {children}
    </CollaborationSessionContext.Provider>
  );
};

export const useCollaborationSession = () =>
  useContext(CollaborationSessionContext);
