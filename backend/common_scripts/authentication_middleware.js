import jwt from "jsonwebtoken";
import { MongoClientInstance } from "./mongo.js";
import { ObjectId } from "mongodb";

export const authenticate = async (req, res, next) => {
  const token = req.headers.authorization.replace("Bearer ", "");
  if (!token) {
    return res
      .status(401)
      .json({ error: "Missing or invalid Authorization header." });
  }

  const decoded = verify_token(token);
  if (!decoded) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }

  const user_result = await MongoClientInstance.db
    .collection("users")
    .findOne({ _id: new ObjectId(decoded.id) });
  if (!user_result) {
    throw res.status(401).json({ error: "Invalid or expired token." });
  }

  next();
};

export const SIGNER_ALGORITHM = "HS256";
export const SIGNER_EXPIRES_IN = "24h";

export const sign_token = (payload) => {
  return jwt.sign(payload, process.env.AUTHENTICATION_SECRET, {
    algorithm: SIGNER_ALGORITHM,
    expiresIn: SIGNER_EXPIRES_IN,
  });
};

export const verify_token = (token) => {
  try {
    return jwt.verify(token, process.env.AUTHENTICATION_SECRET, {
      algorithms: [SIGNER_ALGORITHM],
    });
  } catch (error) {
    return null;
  }
};
