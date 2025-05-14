// server.js (or your main Express app file)
import express from "express";
const app = express();

// A simple health check endpoint
app.get("/api/system-status", (req, res) => {
  // You can insert real checks here (database ping, external API, etc.)
  res.json({ status: "online" });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}`));
