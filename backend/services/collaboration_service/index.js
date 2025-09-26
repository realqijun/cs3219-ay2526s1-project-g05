import express from "express";

const app = express();

app.get("/status", (req, res) => {
  res.send("Collaboration service is up and running!");
});

app.listen(3000, () => {
  console.log("Collaboration service is running on port 3000");
});
