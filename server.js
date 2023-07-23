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
  slug: String, // unique post identifier
  likes: { type: Number, default: 0 },
  dislikes: { type: Number, default: 0 },
});

// Define the Model
const Blog = mongoose.model("Blog", blogSchema, "likes");

// Handle get votes requests
app.get("/vote/:slug", async (req, res) => {
  try {
    let post = await Blog.findOne({ slug: req.params.slug });

    if (!post) {
      return res.json({ likes: 0, dislikes: 0 });
    }

    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Handle like/dislike requests
app.post("/vote/:slug/:vote", async (req, res) => {
  try {
    let post = await Blog.findOne({ slug: req.params.slug });
    let update;

    if (req.params.vote === "like") {
      update = { $inc: { likes: 1 } };
    } else if (req.params.vote === "dislike") {
      update = { $inc: { dislikes: 1 } };
    } else {
      return res.status(400).json({ message: "Invalid vote" });
    }

    // If post was not found create a new one, otherwise update the existing one
    if (!post) {
      post = new Blog({
        slug: req.params.slug,
        likes: req.params.vote === "like" ? 1 : 0,
        dislikes: req.params.vote === "dislike" ? 1 : 0,
      });
    } else {
      await Blog.updateOne({ slug: req.params.slug }, update);
    }

    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.listen(3333, () => {
  console.log("Server started");
});
