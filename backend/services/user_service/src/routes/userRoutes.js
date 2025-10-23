import { Router } from "express";
import { authenticate } from "../../../../common_scripts/authentication_middleware.js";

export const createUserRouter = (controller) => {
  const router = Router();

  router.post("/register", controller.register);
  router.post("/login", controller.login);
  router.get("/:id", [authenticate(true)], controller.getById);
  router.patch("/:id", [authenticate(true)], controller.update);
  router.delete("/:id", [authenticate(true)], controller.delete);
  router.post(
    "/password-reset/request",
    [authenticate(true)],
    controller.requestPasswordReset,
  );
  router.post(
    "/password-reset/confirm",
    [authenticate(true)],
    controller.resetPassword,
  );
  router.post(
    "/add-past-collaboration-session",
    [authenticate(true)],
    controller.addPastCollaborationSession,
  );
  router.post(
    "/update-current-collaboration-session",
    [authenticate(true)],
    controller.updateCurrentCollaborationSession,
  );

  return router;
};
