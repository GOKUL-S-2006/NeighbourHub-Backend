const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const issueRoutes = require("./src/routes/issueRoutes");

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// test route
app.get("/", (req, res) => {
  res.send("NeighbourHub backend running 🚀");
});

// routes
app.use("/api/issues", issueRoutes);

// mongo connect
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected ✅"))
  .catch((err) => console.error("Mongo error ❌", err.message));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
