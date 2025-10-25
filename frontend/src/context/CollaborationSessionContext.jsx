import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import { useUserContext } from "./UserContext";
import { SOCKET_IO_COLLABORATION_URL } from "@/lib/collaborationApi";
import { io } from "socket.io-client";
import { toast } from "sonner";

const CollaborationSessionContext = createContext(null);

export const CollaborationSessionProvider = ({ children }) => {
  const navigate = useNavigate();
  const { user } = useUserContext();
  const socket = useRef(null);

  useEffect(() => {
    if (!user || !user.collaborationSessionId) return;
    // If user has an active collaboration session, navigate to it
    connectToSessionSocket();
    navigate("/session");
  }, [user]);

  const connectToSessionSocket = useCallback(() => {
    if (socket.current) return; // Already connected

    socket.current = io(SOCKET_IO_COLLABORATION_URL, {
      auth: { token: localStorage.getItem("token") },
      reconnection: true,
    });

    socket.current.on("connect", () => {
      toast.success("Connected to collaboration session.");
      socket.current.emit("session:join", {
        sessionId: user.collaborationSessionId,
      });
    });
  }, []);

  return (
    <CollaborationSessionContext.Provider value={{}}>
      {children}
    </CollaborationSessionContext.Provider>
  );
};

export const useCollaborationSession = () =>
  useContext(CollaborationSessionContext);
