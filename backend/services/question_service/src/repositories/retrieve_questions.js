import { MongoClientInstance } from "../../../../common_scripts/mongo.js";

export const get_question_by_id = async (id) => {
  const collection = MongoClientInstance.db.collection("questions");
  return await collection.findOne({ QID: id }, { projection: { _id: 0 } });
};

export const get_all_questions = async (topic, difficulty) => {
  const collection = MongoClientInstance.db.collection("questions");
  const query = {};
  if (topic) {
    query.topics = { $in: topic };
  }
  if (difficulty) {
    query.difficulty = { $in: difficulty };
  }

  return await collection.find(query, { projection: { _id: 0 } }).toArray();
};
