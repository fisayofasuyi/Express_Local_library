/* eslint-disable func-call-spacing */
/* eslint-disable no-multiple-empty-lines */
/* eslint-disable no-trailing-spaces */
/* eslint-disable indent */
/* eslint-disable camelcase */
const Book = require('../models/book')
const Author = require('../models/author')
const BookInstance = require('../models/bookinstance')
const Genre = require('../models/genre')
const { body, validationResult } = require('express-validator')

const async = require('async')
const mongoose = require('mongoose')

const mongodbb = 'mongodb://localhost:27017/local_library'

mongoose.connect(mongodbb, { useNewUrlParser: true, useUnifiedTopology: true })

exports.index = (req, res) => { 
  async.parallel
  // eslint-disable-next-line indent, no-unexpected-multiline
(
    {
    book_count (callback) {
  Book.countDocuments({}, callback)
}, 
book_instance_count (callback) {
  BookInstance.countDocuments({}, callback)
},

book_instance_avaialble_count (callback) {
  BookInstance.countDocuments({ status: 'Available' }, callback)
},
author_count (callback) {
Author.countDocuments({}, callback)
},
genre_count (callback) {
Genre.countDocuments({}, callback)
}


}, (err, results) => {
  res.render('index', 
  { 
    title: 'Local Library Home',
    error: err,
    data: results
})
}
) 
}



/* eslint-disable semi */
/* eslint-disable quotes */

/*
exports.index = (req, res) => {
  res.send("NOT IMPLEMENTED: Site Home Page");
};
*/
// Display list of all books.

  exports.book_list = function (req, res, next) {
    Book.find({}, 'title author')
    .sort({ title: 1 })
    .populate('author')
    .exec(function (err, list_books) {
      if (err) {
        return next(err)
      }
      res.render('book_list', { title: 'Book List', book_list: list_books })
    })
  }
;

// Display detail page for a specific book.
exports.book_detail = (req, res, next) => {
  async.parallel(
    {
     book (callback) { 
    Book.findById(req.params.id)
    .populate('author')
    .populate('genre')
    .exec(callback)
  }, 
  book_instance (callback) {
  BookInstance.find({ book: req.params.id })
  .exec(callback)
  } 

  }, 
  (err, results) => {
  if (err) {
    return next(err)
  }

  if (results.book == null) {
    const err = new Error('Book not found')
    err.status = 404
    return next(err)
  }

  res.render('book_detail', {
    title: results.book.title,
    book: results.book,
    book_instances: results.book_instance
  })
  })
};

// Display book create form on GET.
exports.book_create_get = (req, res, next) => {
  async.parallel({
    authors (callback) {
      Author.find(callback)
    },


    genres (callback) {
      Genre.find(callback)
    }
  }, (err, result) => {
    if (err) {
      return next(err)
    }     
    res.render('book_form', {
      title: 'Create Book',
      authors: result.authors,
      genres: result.genres
    })
  })
};

// Handle book create on POST.
exports.book_create_post = [
  // convert the genre into an array
  (req, res, next) => {
    if (!Array.isArray(req.body.genre)) {
      req.body.genre = typeof req.body.genre === 'undefined' ? [] : [req.body.genre]
    }
    next()
  },

  // sanitize 
  body('title', 'title must not be empty')
  .trim()
  .isLength({ min: 1 })
  .escape(),
  body('author', 'author must not be empty')
  .trim()
  .isLength({ min: 1 })
  .escape(),
   body('summary', 'summary must not be empty')
   .trim()
   .isLength({ min: 1 })
   .escape(),
   body('isbn', 'ISBN must not be empty')
   .trim(),
   body('genre.*').escape(),

// process request after validation and sanitization
   (req, res, next) => {
   const errors = validationResult(req)
   const book = new Book({
    title: req.body.title,
    author: req.body.author,
    summary: req.body.summary,
    isbn: req.body.isbn,
    genre: req.body.genre
   })

   if (!errors.isEmpty()) {
    async.parallel({
      authors (callback) {
        Author.find(callback)
      },
      genres (callback) {
        Genre.find(callback)
    }
  }, (err, results) => {
    if (err) {
      return next(err)
    }
    // mark the selected genres as checked
    for (const genre of results.genres) {
      if (book.genre.includes(genre._id)) {
        genre.checked = 'true'
      }
  }
    res.render('book_form', {
       title: 'Create Book',
        authors: results.authors, 
        genres: results.genres, 
        book,
        errors: errors.array() 
      })
  })
}
book.save((err) => { 
  if (err) {
return next(err)
  }
  res.redirect(book.url)
})
  }
]
  

// Display book delete form on GET.
exports.book_delete_get = (req, res, next) => {
 async.parallel({
  books (callback) {
  Book.findById(req.params.id).exec(callback)
  },
  bookInstance (callback) {
   BookInstance.find({ book: req.params.id }).exec(callback)
  }

 }, (err, results) => {
  if (err) {
    return next(err)
}
if (results.books == null) {
  res.redirect('/catalog/books')
}
res.render('book_delete', {
  title: 'Delete Book',
  books: results.books,
  bookinstances: results.bookInstance
})
}
 )
};

// Handle book delete on POST.
exports.book_delete_post = (req, res) => {
  async.parallel({
    books (callback) {
      Book.findById(req.body.bookid).exec(callback)
      },
      bookInstance (callback) {
      BookInstance.find({ book: req.body.bookid }).exec(callback)
      }
  }, (err, results, next) => { 
    if (err) {
      return next(err)
    }

    if (results.books.length > 0) {
      res.render('book_delete', {
      title: 'Delete Books',
      books: results.books,
      bookinstances: results.bookInstance 
    }
      )

      Book.findByIdAndRemove(req.body.bookid).exec((err) => {
         if (err) {
        return next(err) 
      }
      })
}
})
};

// Display book update form on GET.
exports.book_update_get = (req, res, next) => {
async.parallel(
  {
 book (callback) {
  Book.findById(req.params.id).populate('author').populate('genre').exec(callback)
 },
 authors (callback) {
  Author.find(callback)
 },
 genres (callback) {
  Genre.find(callback)
 }
}, (err, results) => {
  if (err) {
    return next(err)
  }
  // check if the book exists
  if (results.book == null) {
  const err = new Error ('Book not found')
  err.status = 404
  return next(err)
  }
  // mark selected genres as checked
  for (const genre of results.genres) {
   for (const bookGenre of results.book.genre) {
    if (genre._id.toString() === bookGenre._id.toString()) {
      genre.checked = true
    }
   }
  }
  res.render('book_form', {
    title: 'Update Book',
    authors: results.authors,
    genres: results.genres,
    book: results.book
  })
}
)
}


// Handle book update on POST.
exports.book_update_post = [
  // convert req.body.genre to an array
  (req, res, next) => {
    if (!Array.isArray(req.body.genre)) {
      req.body.genre = req.body.genre === 'undefined' ? [] : [req.body.genre]
    }
    next()
  },
    // Validate and sanitize fields.
  body("title", "Title must not be empty.")
  .trim()
  .isLength({ min: 1 })
  .escape(),
body("author", "Author must not be empty.")
  .trim()
  .isLength({ min: 1 })
  .escape(),
body("summary", "Summary must not be empty.")
  .trim()
  .isLength({ min: 1 })
  .escape(),
body("isbn", "ISBN must not be empty").trim().isLength({ min: 1 }).escape(),
body("genre.*").escape(),

(req, res, next) => {
const errors = validationResult(req)
const book = new Book({
  title: req.body.title,
  author: req.body.author,
  summary: req.body.summary,
  isbn: req.body.isbn,
  genre: typeof req.body.genre === 'undefined' ? [] : req.body.genre,
  _id: req.params.id // This is a required or a new id will be reassigned
})

if (!errors.isEmpty()) {
  async.parallel(
    {
      authors (callback) {
        Author.find(callback)
      },
      genres (callback) {
      Genre.find(callback)
      }
    }, (err, results) => {
      if (err) {
        return next(err)
      }
      for (const genre of results.genres) {
        if (book.genre.includes(genre._id)) {
          genre.checked = 'true'
        }
    }
    res.render('book_form', {
      title: 'Update book',
      authors: results.authors,
      genres: results.genres,
      book,
      errors: errors.array()
    })
  }
  )
}
book.findByIdAndUpdate(req.params.id, book, {}, (err, thebook) => {
  if (err) {
    return next(err)
  }
  res.redirect(thebook.url)
})
}
]
  



