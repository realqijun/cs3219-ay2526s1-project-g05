import { Router } from "express";
import {
  retrieve_question,
  retrieve_all_questions,
} from "../services/retrieve_questions.js";

export const use_question_routes = () => {
  const router = Router();

  /**
   * GET /questions/{id}
   * @summary Gets the question by its Question ID
   * @param {string} id.path.required - Question ID (QID)
   * @return {object} 200 - Success
   * @return {string} 404 - Question not found
   */
  router.get("/:id", async (req, res) => {
    const { id } = req.params;
    const result = await retrieve_question(id);

    if (!result.success) {
      return res.status(404).json(result.error);
    }

    return res.json(result.question);
  });

  /**
   * GET /questions
   * @summary Gets list of questions, optionally filtered by topic and/or difficulty
   * @param {string[]} topic.query - List of topic names (e.g topic="Hash Table"&topic="String")
   * @param {string[]} difficulty.query - List of difficulties (e.g difficulty="Hard"&difficulty="Medium")
   * @return {object[]} 200 - Success
   * @return {string} 400 - Bad Request (e.g invalid topic or difficulty)
   */
  router.get("/", async (req, res) => {
    const { topic } = req.query;
    const { difficulty } = req.query;

    const result = await retrieve_all_questions(topic, difficulty);

    if (!result.success) {
      return res.status(400).json(result.error);
    }

    return res.json(result.questions);
  });

  return router;
};
