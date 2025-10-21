import { Router } from "express";
import { authenticate } from "../../../../common_scripts/authentication_middleware.js";

export const createCollaborationRouter = (controller) => {
  const router = Router();

  /**
   * POST /sessions
   * @summary Create a new collaboration session
   */
  router.post("/sessions", [authenticate], controller.createSession);

  /**
   * GET /sessions/:sessionId
   * @summary Fetch a collaboration session by its identifier
   */
  router.get("/sessions/:sessionId", [authenticate], controller.getSession);

  /**
   * POST /sessions/:sessionId/terminate
   * @summary Administrative termination of a collaboration session
   */
  router.post("/sessions/:sessionId/terminate", controller.terminateSession);

  return router;
};
