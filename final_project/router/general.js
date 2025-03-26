const express = require('express');
let books = require("./booksdb.js");
let {isValid, users, saveUsers} = require("./auth_users.js");
const public_users = express.Router();



public_users.post("/register", (req,res) => {
  const { username, password} = req.body;

  if(!username || !password) {
    return res.status(400).json({ message: "Username and password are required"})
  }

  if(isValid(username)) {
    return res.status(400).json({ message: "Username already exists"});
  }

  users.push({username,password});

  saveUsers();

  return res.status(200).json({message: "User registered successfully"});
});

// Get the book list available in the shop
public_users.get('/', async function (req, res) {
  try {
    const bookList = await Promise.resolve(books);

    return res.status(200).json(bookList);
  } catch (error) {
    console.log("Error fetching books list", error);
    return res.status(500).json({message: "Error fetching books list"})
  }
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn', async function (req, res) {

  try {
    const  bookId = req.params.isbn;
    const book = await Promise.resolve(books[bookId]);

    if (book) {
      return res.status(200).json(JSON.parse(JSON.stringify(book, null, 2)));
    } else {
      return res.status(404).json({ message: "Book not found" });
    }

  } catch (error) {
    console.log("Error fetching the book by ISBN");
    return res.status(500).json({message: "an error occured fetching data"})
  }
 });
  
// Get book details based on author
public_users.get('/author/:author', async function (req, res) {
  try {
    const author = req.params.author.toLowerCase();
    const booksByAuthor = await Promise.resolve(
      Object.values(books).filter(book => book.author.toLowerCase() === author)
    )

    if (booksByAuthor.length > 0) {
      return res.status(200).json(booksByAuthor);
    } else {
      return res.status(404).json({ message: "No book found by this author" });
    }

  } catch (error) {
    console.log("Error fetching books by author");
    return res.status(500).json({message: "An error occurred while fetching data"})
  }
});

// Get all books based on title
public_users.get('/title/:title', async function (req, res) {
  try {
    const title = req.params.title.toLowerCase();

    const booksByTitle = await Promise.resolve(
      Object.values(books).filter(book => book.title.toLowerCase() === title)
    );

    if (booksByTitle.length > 0) {
      return res.status(200).json(booksByTitle);
    } else {
      return res.status(404).json({ message: "No books found by this title" });
    }
  } catch (error) {
    console.error("Error fetching books by title:", error);
    return res.status(500).json({ message: "An error occurred while fetching books" });
  }
});

//  Get book review
public_users.get('/review/:isbn',function (req, res) {
  const isbn = req.params.isbn;

  const book = books[isbn];

  if (book) {
    if (Object.keys(book.reviews).length > 0) {
      return res.status(200).json(JSON.parse(JSON.stringify(book.reviews, null, 2)));
    }else {
      return res.status(404).json({message: "No reviews found for this book"});
    }
  } else {
    return res.status(404).json({message: "Book not found"});

  }

});

module.exports.general = public_users;