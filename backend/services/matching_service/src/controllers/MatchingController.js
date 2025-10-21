import { ApiError } from "../errors/ApiError.js";
import { createSession } from "better-sse"

export class MatchingController {
  constructor(matchService) {
    this.matchService = matchService;
    this.activeConnections = {}; // To track active SSE connections
  }

  // POST /queue
  queue = async (req, res, next) => {
    try {
      const { user, criteria } = req.body;
      // TODO: validate user and criteria format (use userservice?)
      // TODO: check if user is already in collab service (use collabservice?)
      const userId = await this.matchService.enterQueue(user, criteria);

      res.status(202).json({
        message: "Match request accepted. Check status for updates.",
        userId: userId
      });
    } catch (err) {
      next(err);
    }
  }

  // GET /status/:userId
  getStatus = async (req, res, next) => {
    try {
      // SSE setup
      const userId = req.params.userId;

      if (this.activeConnections[userId]) {
        throw new ApiError(400, "An active connection already exists for this session.");
      }

      const session = await createSession(req, res);

      await this.matchService.addActiveListener(userId);
      this.activeConnections[userId] = session;

      session.push(`message: Connection established for user ${userId}`, 'connected');

      const pendingMatch = await this.matchService.getPendingMatch(userId);
      if (pendingMatch) {
        this.notifyMatchFound(userId, pendingMatch);
      }

      session.on('close', () => {
        delete this.activeConnections[userId];
        this.matchService.removeActiveListener(userId);
      });
    } catch (err) {
      next(err);
    }
  }

  notifyMatchFound(userId, matchData) {
    const session = this.activeConnections[userId];
    if (session) {
      session.push(`message: ${JSON.stringify(matchData)}`, 'matchFound');
    }
  }

  notifySessionExpired(userId) {
    const session = this.activeConnections[userId];
    if (session) {
      const formattedData = `message: Session ${userId} has expired. You may cancel your participation in the queue, or rejoin with priority.`;
      session.push(formattedData, 'sessionExpired');
    }
  }

  notifyMatchCancelled(sessionId, data) {
    const session = this.activeConnections[sessionId];
    if (session) {
      const formattedData = `message: ${JSON.stringify(data)}`;
      session.push(formattedData, 'matchCancelled');
    }
  }

  // POST /confirm userId in body
  confirmMatch = async (req, res, next) => {
    try {
      const { userId } = req.body;

      const result = await this.matchService.confirmMatch(userId);

      if (result.status === 'finalized') {
        // Connection is closed in the notifyMatchFinalized
        res.json({ message: "Match confirmed and complete.", partnerId: result.partnerId });
      } else {
        res.json({ message: "Confirmation sent. Waiting for partner.", partnerId: result.partnerId });
      }
    } catch (err) {
      next(err);
    }
  }

  // internal method to send match finalized event and close connection
  notifyMatchFinalized(userId, matchData) {
    const session = this.activeConnections[userId];
    if (session) {
      const formattedData = `message: ${JSON.stringify(matchData)}`;
      delete this.activeConnections[userId];
      session.push(formattedData, 'matchFinalized');
      session.push(null, "disconnect");
    }
  }

  // POST /cancel sessionid in body
  cancel = async (req, res, next) => {
    try {
      const { userId } = req.body;
      await this.matchService.clearMatchAndSession(userId);
      // Close SSE connection from array if exists
      const session = this.activeConnections[userId];
      if (session) {
        delete this.activeConnections[userId];
        session.push(`message: You have exited the queue and cancelled any pending matches.`, 'cancelled');
        session.push(null, "disconnect");
      }

      res.json({ message: "Exited queue successfully." });
    } catch (err) {
      next(err);
    }
  }
}

export const errorMiddleware = (err, req, res, _next) => {
  if (err instanceof ApiError) {
    const payload = { message: err.message };
    if (Array.isArray(err.details)) {
      payload.errors = err.details;
    }
    res.status(err.status).json(payload);
    return;
  }

  console.error(err);
  res.status(500).json({ message: "An unexpected error occurred." });
};
