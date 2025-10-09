import {
  get_question_by_id,
  get_all_questions,
} from "../repositories/retrieve_questions.js";
import { TOPICS, DIFFICULTIES } from "../utils/constants.js";

export const retrieve_question = async (id) => {
  const question = await get_question_by_id(parseInt(id));

  if (!question) {
    return { success: false, error: "Question not found" };
  }

  return { success: true, question };
};

export const retrieve_all_questions = async (
  topic = null,
  difficulty = null,
) => {
  // Make them into arrays if they aren't (i.e we only get 1 topic/difficulty)
  if (topic && !Array.isArray(topic)) {
    topic = [topic];
  }
  if (difficulty && !Array.isArray(difficulty)) {
    difficulty = [difficulty];
  }

  // Search for invalid topics/difficulties
  if (topic) {
    topic.forEach(() => {
      if (!(topic in TOPICS)) {
        return { success: false, error: "Invalid topic" };
      }
    });
  }

  if (difficulty) {
    difficulty.forEach(() => {
      if (!(topic in DIFFICULTIES)) {
        return { success: false, error: "Invalid difficulty" };
      }
    });
  }

  const questions = await get_all_questions(topic, difficulty);

  return { success: true, questions };
};
