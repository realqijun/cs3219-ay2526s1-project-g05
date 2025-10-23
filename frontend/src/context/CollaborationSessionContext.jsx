import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useUserContext } from "./UserContext";

const CollaborationSessionContext = createContext(null);

export const CollaborationSessionProvider = ({ children }) => {
  const navigate = useNavigate();
  const { user } = useUserContext();

  useEffect(() => {
    if (!user.collaborationSessionId) return;
    // If user has an active collaboration session, navigate to it
    navigate("/session");
  }, [user]);

  return (
    <CollaborationSessionContext.Provider value={{}}>
      {children}
    </CollaborationSessionContext.Provider>
  );
};

export const useCollaborationSession = () =>
  useContext(CollaborationSessionContext);
