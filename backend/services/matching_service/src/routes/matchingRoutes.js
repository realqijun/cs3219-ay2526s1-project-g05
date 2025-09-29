import { Router } from "express";

export const createMatchingRouter = (controller) => {
    const router = Router();

    router.post("/find", controller.find);
    router.post("/cancel", controller.cancel);

    return router;
};
