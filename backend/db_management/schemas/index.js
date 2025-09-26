import { question_schema, question_indexes } from "./questions.js";
import { user_schema, user_indexes } from "./users.js";

// Add your schemas here!
export const COLLECTIONS = {
  questions: {
    schema: question_schema,
    indexes: question_indexes,
  },
  users: {
    schema: user_schema,
    indexes: user_indexes,
  },
};
