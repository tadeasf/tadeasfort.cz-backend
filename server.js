/** @format */

const express = require("express");
require("dotenv").config();
const cors = require("cors");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20,
  keyGenerator: function (req) {
    return req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  },
});

app.use("/vote", limiter);

mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;

db.on("error", (error) => console.error("Database connection error:", error));
db.once("open", () => console.log("Connected to Database"));

const blogSchema = new mongoose.Schema({
  id: String,
  slug: String,
  likes: { type: Number, default: 0 },
  dislikes: { type: Number, default: 0 },
  identifiers: { type: Array, default: [] },
});

const Blog = mongoose.model("Blog", blogSchema, "likes");

app.get("/vote/:slug", async (req, res) => {
  try {
    let post = await Blog.findOne({ slug: req.params.slug });

    if (!post) {
      return res.json({ likes: 0, dislikes: 0 });
    }

    res.json(post);
    console.log("Vote data retrieved"); // Log successful vote data retrieval
  } catch (err) {
    res.status(500).json({ message: err.message });
    console.error("Vote data retrieval failed:", err.message); // Log error for vote data retrieval
  }
});

app.post("/vote/:slug/:vote", async (req, res) => {
  try {
    let identifier = req.ip || req.cookies.userIdentifier;

    if (!identifier) {
      identifier = Math.random().toString(36).substr(2, 9);
      console.log("No IP, generated identifier: " + identifier);
    }

    let post = await Blog.findOne({
      slug: req.params.slug,
      identifiers: identifier,
    });

    if (post) {
      return res.status(403).json({ message: "You've already voted" });
      console.warn("Multiple voting attempt"); // Log warning for multiple voting attempt
    }

    let update;
    if (req.params.vote === "like") {
      update = { $inc: { likes: 1 }, $push: { identifiers: identifier } };
    } else if (req.params.vote === "dislike") {
      update = { $inc: { dislikes: 1 }, $push: { identifiers: identifier } };
    } else {
      return res.status(400).json({ message: "Invalid vote" });
      console.error("Invalid vote"); // Log error for invalid vote
    }

    if (!post) {
      post = new Blog({
        slug: req.params.slug,
        likes: req.params.vote === "like" ? 1 : 0,
        dislikes: req.params.vote === "dislike" ? 1 : 0,
        identifiers: [identifier],
      });
      await post.save();
      console.log("New vote"); // Log successful new vote
    } else {
      post = await Blog.findOneAndUpdate({ slug: req.params.slug }, update, {
        new: true,
      });
      console.log("Update vote"); // Log successful vote update
    }

    res.cookie("userIdentifier", identifier, {
      maxAge: 900000,
      httpOnly: true,
      sameSite: "None",
      secure: true,
    });

    res.json(post);
    console.log("Vote success"); // Log successful vote response
  } catch (err) {
    res.status(500).json({ message: err.message });
    console.error("Vote failed:", err.message); // Log error for vote handling failure
  }
});

app.listen(3333, () => {
  console.log("Server started");
});
