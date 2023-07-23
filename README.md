# Node Express Server for Like/Dislike Voting Backend
This Node Express server is designed to handle like/dislike voting functionality for a
frontend application built using Gatsby, React, and Contentful. The server utilizes MongoDB for data storage and is intended to be used in
conjunction with the frontend repository located at https://github.com/tadeasf/tadeasfort.cz.

## Getting started

To run this server locally, follow the steps below:

    Clone this repository to your local machine.
    Install the required dependencies by running the following command:

bash

npm install

    Create a .env file in the root directory of the server and provide the MongoDB connection URL. For example:

env

MONGODB_URL=mongodb://localhost:27017/your-database-name

    Make sure you have MongoDB installed and running on your machine or provide a connection URL to your MongoDB database.

    Start the server with the following command:

bash

npm start

The server will be available at http://localhost:3333.
API Endpoints

The server exposes the following API endpoints:
POST /vote/:id/:vote

This endpoint allows users to vote on a specific blog post with the given id. Users can either like or dislike the post. The server checks if the user's IP address has already voted for the post to prevent multiple votes from the same IP.

    URL Parameters:
        id (string): The unique identifier of the blog post.
        vote (string): The vote type, either "like" or "dislike".

    Responses:
        200 OK: If the vote is successful, the server responds with the updated blog post object, including the updated vote counts.
        400 Bad Request: If the vote parameter is missing or invalid.
        403 Forbidden: If the user's IP address has already voted for the post.
        404 Not Found: If no blog post is found with the provided id.
        500 Internal Server Error: If there's an issue with the server while processing the request.

Database Schema

The server uses MongoDB as the database, and it defines the following schema for the documents:

javascript

const blogSchema = new mongoose.Schema({
  id: String,                 // Unique identifier for the blog post
  likes: { type: Number, default: 0 },     // Number of likes for the post
  dislikes: { type: Number, default: 0 },  // Number of dislikes for the post
  voters: { type: Array, default: [] },    // Array of IP addresses that have voted for the post
});

Connecting to MongoDB

The server connects to MongoDB using the provided connection URL in the .env file. Once connected, the server will log "Connected to Database" to the console.
Error Handling

If any error occurs while processing the vote, the server will respond with an appropriate error message and status code.
Note

This server is specifically designed to work with the frontend application available in the repository https://github.com/tadeasf/tadeasfort.cz. Make sure to integrate this server properly with the frontend to enable like/dislike functionality.

For more information or any issues related to the server, feel free to contact the author of the frontend repository or the server developer.

Happy voting! 🗳️
