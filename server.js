/** @format */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:8000",
      "https://localhost:8000",
      "https://tadeasfort.cz",
      "http://tadeasfort.cz",
      "https://www.tadeasfort.cz",
      "http://www.tadeasfort.cz",
      "https://tadeasfort.cz:8000",
      "http://tadeasfort.cz:8000",
      "http://localhost:3000", //standard react port
      "https://localhost:3000",
      "http://193.86.152.148:8000", //domaci ajpina
      "https://193.86.152.148:8000",
      "http://meek-rugelach-a2a7f4.netlify.app",
      "https://meek-rugelach-a2a7f4.netlify.app",
    ],
  })
);

app.use(express.json()); // parse JSON bodies

app.use(function (req, res, next) {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src https://*; child-src 'none';"
  );
  return next();
});

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
    console.log(err);
  }
});

// Handle like/dislike requests
app.post("/vote/:slug/:vote", async (req, res) => {
  try {
    let post = await Blog.findOne({ slug: req.params.slug });
    let update;

    if (req.body.action === "new") {
      if (req.params.vote === "like") {
        update = { $inc: { likes: 1 }, $push: { voters: voterIP } };
      } else {
        update = { $inc: { dislikes: 1 }, $push: { voters: voterIP } };
      }
    } else if (req.body.action === "switch") {
      if (req.params.vote === "like") {
        update = { $inc: { likes: 1, dislikes: -1 } };
      } else {
        update = { $inc: { likes: -1, dislikes: 1 } };
      }
    }

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

      // Save the new post
      await post.save();
    } else {
      await Blog.updateOne({ slug: req.params.slug }, update);
      post = await Blog.findOne({ slug: req.params.slug }); // find again after update
    }

    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
    console.log(err);
  }
});

app.listen(3333, () => {
  console.log("Server started");
});
