import { ApiError } from "../errors/ApiError.js";

export class MatchingController {
  constructor(matchService) {
    this.matchService = matchService;
  }

  find = async (req, res, next) => {
    try {
      const { user, criteria } = req.body;
      // TODO: validate user and criteria format
      // TOTHINK: use username or user_id?
      const result = await this.matchService.findMatch(user, criteria);
      
      if (result) {
        res.json({ message: "Match found!", match: result });
        return;
      }

      // TODO: async handling for no immediate match
      res.json({ message: "No matches found" });
    } catch (err) {
      next(err);
    }
  }

  cancel = async (req, res, next) => {
    try {
      const { user } = req.body;
      await this.matchService.cancelMatch(user);
      res.json({ message: "Match cancelled successfully." });
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
