import { question_schema, question_indexes } from "./questions.js";
import { users_schema, users_indexes } from "./users.js";
import {
  collaboration_sessions_schema,
  collaboration_sessions_indexes,
} from "./collaboration_sessions.js";

// Add your schemas here!
export const COLLECTIONS = {
  questions: {
    schema: question_schema,
    indexes: question_indexes,
  },
  users: {
    schema: users_schema,
    indexes: users_indexes,
  },
  collaboration_sessions: {
    schema: collaboration_sessions_schema,
    indexes: collaboration_sessions_indexes,
  },
};
