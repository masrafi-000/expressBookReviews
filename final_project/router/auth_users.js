const express = require('express');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const bodyParser = require('body-parser');
let books = require("./booksdb.js");

const regd_users = express.Router();

let users = [];

// Middleware to parse JSON request bodies
regd_users.use(bodyParser.json());

// Load users from the file
const loadUsers = () => {
  try {
    const data = fs.readFileSync('users.json');
    users = JSON.parse(data);
  } catch (error) {
    console.log("Error loading users from file", error);
  }
};

// Save users to the file
const saveUsers = () => {
  try {
    fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
  } catch (error) {
    console.log("Error saving users to file", error);
  }
};

// Check if the username exists
const isValid = (username) => {
  return users.some(user => user.username === username);
};

// Check if the user is authenticated
const authenticatedUser = (username, password) => {
  const user = users.find(user => user.username === username);
  return user && user.password === password;
};

loadUsers();

// Login route
regd_users.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!isValid(username)) {
    return res.status(401).json({ message: "Username not found!" });
  }

  if (!authenticatedUser(username, password)) {
    return res.status(401).json({ message: "Incorrect password!" });
  }

  const token = jwt.sign({ username: username }, "thereisnomoresecrets", { expiresIn: "1h" });

  return res.status(200).json({ message: "Login successful", token: token });
});

// Add or update a book review route
regd_users.put("/auth/review/:isbn", (req, res) => {
  const { isbn } = req.params;
  const { review } = req.body;
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    console.log("Authorization header missing");
    return res.status(401).json({ message: "Authorization token is missing!" });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    console.log("Token format is incorrect");
    return res.status(401).json({ message: "Authorization token is missing!" });
  }

  try {
    const decoded = jwt.verify(token, "thereisnomoresecrets");
    const username = decoded.username;

    if (!review || typeof review !== 'string') {
      return res.status(400).json({ message: "Review must be a non-empty string!" });
    }

    // Load users from the file
    loadUsers();

    const user = users.find(user => user.username === username);

    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    if (!user.reviews) {
      user.reviews = {};
    }

    user.reviews[isbn] = review;

    saveUsers();

    return res.status(200).json({ message: "Review added successfully!" });

  } catch (error) {
    console.log("Error decoding JWT", error);
    return res.status(403).json({ message: "Invalid token!" });
  }
});

// Delete a book review
regd_users.delete("/auth/review/:isbn", (req, res) => {
  const { isbn } = req.params;
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    console.log("Authorization header missing");
    return res.status(401).json({ message: "Authorization token is missing!" });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    console.log("Token format is incorrect");
    return res.status(401).json({ message: "Authorization token is missing!" });
  }

  try {
    const decoded = jwt.verify(token, "thereisnomoresecrets");
    const username = decoded.username;

    // Load users from the file
    loadUsers();

    const user = users.find(user => user.username === username);

    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    if (!user.reviews || !user.reviews[isbn]) {
      return res.status(404).json({ message: "No review found for this book!" });
    }

    delete user.reviews[isbn];

    saveUsers();

    return res.status(200).json({ message: "Review deleted successfully!" });

  } catch (error) {
    console.log("Error decoding JWT", error);
    return res.status(403).json({ message: "Invalid token!" });
  }
});

// Export module
module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
module.exports.saveUsers = saveUsers;
