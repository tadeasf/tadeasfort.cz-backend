/** @format */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const app = express();

app.use(cors());
app.use(express.json()); // parse JSON bodies

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;

db.on("error", (error) => console.error(error));
db.once("open", () => console.log("Connected to Database"));

// Define schema for your documents
const blogSchema = new mongoose.Schema({
  id: String,
  likes: { type: Number, default: 0 },
  dislikes: { type: Number, default: 0 },
  voters: { type: Array, default: [] },
});

// Define the Model
const Blog = mongoose.model("Blog", blogSchema, "likes");

// Handle like/dislike requests
app.post("/vote/:id/:vote", async (req, res) => {
  try {
    const post = await Blog.findOne({ id: req.params.id });
    const ip = req.ip;

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.voters.includes(ip)) {
      return res.status(403).json({ message: "You've already voted" });
    }

    if (req.params.vote === "like") {
      post.likes += 1;
    } else if (req.params.vote === "dislike") {
      post.dislikes += 1;
    } else {
      return res.status(400).json({ message: "Invalid vote" });
    }

    post.voters.push(ip);
    await post.save();

    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.listen(3333, () => {
  console.log("Server started");
});
