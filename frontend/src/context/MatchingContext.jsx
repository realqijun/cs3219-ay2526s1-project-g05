import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { toast } from "sonner";
import { MATCHING_API_URL, matchingApi } from "@/lib/matchingApi";
import { useNavigate } from "react-router-dom";
import { useUserContext } from "./UserContext";

const MatchingContext = createContext(null);

export const MatchingProvider = ({ children }) => {
  const navigate = useNavigate();
  const es = useRef(null);
  const [matchInfo, setMatchInfo] = useState(null);
  const [isConnected, setConnected] = useState(false);
  const { refreshUserData } = useUserContext();

  useEffect(() => {
    checkIsInQueue();

    return () => {
      closeEventSource();
    };
  }, []);

  const handleEnterQueue = async (matchingCriteria) => {
    try {
      const response = await matchingApi.enterQueue(matchingCriteria);
      startStatusSubscriber();
      const { matchDetails } = response;
      if (matchDetails) {
        // A match was already found, switch to matched page directly
        setMatchInfo(matchDetails);
        navigate("/matched");
        return;
      }
      navigate("/matching");
    } catch (e) {
      toast.error("Failed to enter queue:", e);
    }
  };

  const closeEventSource = () => {
    if (!es.value) return;

    es.value.close();
    es.value.removeEventListener("connected", handleConnected);
    es.value.removeEventListener("matchFound", handleMatchFound);
    es.value.removeEventListener("matchCancelled", handleMatchCancelled);
    es.value.removeEventListener("matchFinalized", handleMatchFinalized);
    es.value = null;
    setConnected(false);
  };

  const checkIsInQueue = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const isInQueue = await matchingApi.checkIsInQueue();
      if (isInQueue.inQueue) {
        navigate("/matching");
        startStatusSubscriber();
      }
    } catch (e) {
      toast.error("Failed to check if in queue:", e);
    }
  }, []);

  const cancelMatching = useCallback(async () => {
    try {
      closeEventSource();
      await matchingApi.cancelQueue();
      navigate("/matchmaking");
      toast.success("Successfully exited the queue.");
      return true;
    } catch (e) {
      toast.error("Failed to cancel queue:", e);
      return false;
    }
  });

  const confirmMatch = useCallback(async () => {
    try {
      const response = await matchingApi.confirmMatch();
      return response;
    } catch (e) {
      toast.error("Failed to confirm match:", e);
    }
  });

  // ============= EventSource Handlers =============
  const handleConnected = () => {
    setConnected(true);
  };
  const handleMatchFound = (data) => {
    const parsedData = JSON.parse(data.data);
    setMatchInfo(parsedData);
    navigate("/matched");
  };
  const handleMatchCancelled = () => {
    // When we have a pending match but the partner cancels
    toast.error("Your coding partner has exited the match.");
    closeEventSource();
    navigate("/matchmaking");
  };
  const handleMatchFinalized = async () => {
    // Let's refresh the user data to get the updated session info
    closeEventSource();
    await refreshUserData();
    navigate("/session");
  };

  const startStatusSubscriber = useCallback(async () => {
    if (es.value) {
      return;
    }

    const newSource = new EventSource(
      `${MATCHING_API_URL}/status/?token=${localStorage.getItem("token")}`,
    );
    es.value = newSource;

    newSource.addEventListener("connected", handleConnected);
    newSource.addEventListener("matchFound", handleMatchFound);
    newSource.addEventListener("matchCancelled", handleMatchCancelled);
    newSource.addEventListener("matchFinalized", handleMatchFinalized);

    // newSource.onmessage = (event) => {
    //   console.log(event);
    //   const data = JSON.parse(event.data);
    //   setStatus(data);
    // };

    newSource.onerror = (error) => {
      console.error("EventSource failed:", error);
      console.log(error);
      es.value.close();
      es.value = null;
      toast.error("Lost connection to matchmaking server.");
    };
  }, []);

  return (
    <MatchingContext.Provider
      value={{
        isConnected,
        matchInfo,
        cancelMatching,
        startStatusSubscriber,
        handleEnterQueue,
        confirmMatch,
      }}
    >
      {children}
    </MatchingContext.Provider>
  );
};

export const useMatching = () => useContext(MatchingContext);
