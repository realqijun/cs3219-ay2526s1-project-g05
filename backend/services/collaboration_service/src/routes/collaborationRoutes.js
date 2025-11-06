import { Router } from "express";
import { authenticate } from "../../../../common_scripts/authentication_middleware.js";

export const createCollaborationRouter = (controller) => {
  const router = Router();

  /**
   * POST /sessions
   * @summary Create a new collaboration session
   */
  router.post("/sessions", [authenticate(false)], controller.createSession);

  /**
   * GET /sessions/:sessionId
   * @summary Fetch a collaboration session by its identifier
   */
  router.get(
    "/sessions/:sessionId",
    [authenticate(false)],
    controller.getSession,
  );

  /**
   * POST /sessions/:sessionId/explain-code
   * @summary Generate a new explanation for the code in the collaboration session
   */
  router.post(
    "/sessions/:sessionId/explain-code",
    [authenticate(false)],
    controller.explainCode,
  );

  /**
   * GET /sessions/:sessionId/conversation
   * @summary Fetch the conversation for this collaboration session
   */
  router.get(
    "/sessions/:sessionId/conversation",
    [authenticate(false)],
    controller.getConversation,
  );

  /**
   * GET /sessions/:sessionId/message
   * @summary Fetch the conversation for this collaboration session
   */
  router.post(
    "/sessions/:sessionId/message",
    [authenticate(false)],
    controller.sendCustomMessage,
  );

  /**
   * POST /sessions/:sessionId/terminate
   * @summary [Unused for now] Administrative termination of a collaboration session
   */
  // router.post("/sessions/:sessionId/terminate", controller.terminateSession);

  return router;
};
