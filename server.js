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
  voters: [String], // Add this line to store IP addresses
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
    const voterIP = req.ip; // Always retrieve the IP address of the voter

    if (!post) {
      post = new Blog({
        slug: req.params.slug,
        likes: req.params.vote === "like" ? 1 : 0,
        dislikes: req.params.vote === "dislike" ? 1 : 0,
        voters: [voterIP], // Store voterIP
      });

      // Save the new post
      await post.save();
    } else {
      if (post.voters.includes(voterIP)) {
        if (req.params.vote === "like") {
          if (post.dislikes > 0) {
            post.dislikes -= 1;
          }
          post.likes += 1;
        } else if (req.params.vote === "dislike") {
          if (post.likes > 0) {
            post.likes -= 1;
          }
          post.dislikes += 1;
        }
      } else {
        if (req.params.vote === "like") {
          post.likes += 1;
        } else if (req.params.vote === "dislike") {
          post.dislikes += 1;
        }
        post.voters.push(voterIP);
      }

      // Save the updated post
      await post.save();
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
