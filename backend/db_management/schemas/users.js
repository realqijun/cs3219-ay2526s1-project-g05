export const user_schema = {
  $jsonSchema: {
    bsonType: "object",
    required: ["username", "email", "password"],
    properties: {
      username: {
        bsonType: "string",
        minLength: 3,
        maxLength: 20,
        pattern: "^[a-zA-Z0-9_-]+$",
        description: "Username must be 3-20 characters, alphanumeric with underscore/dash only and is required"
      },
      email: {
        bsonType: "string",
        pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
        description: "Email must be a valid email format and is required"
      },
      password: {
        bsonType: "string",
        minLength: 8,
        maxLength: 30,
        description: "Password must be 8-30 character and is required"
      },
      createdAt: {
        bsonType: "date",
        description: "Creation timestamp"
      },
      updatedAt: {
        bsonType: "date",
        description: "Last update timestamp"
      }
    }
  }
};

export const user_indexes = [
  { key: { username: 1 }, unique: true },
  { key: { email: 1 }, unique: true }
];