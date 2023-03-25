/* eslint-disable indent */
/* eslint-disable camelcase */
/* eslint-disable space-before-blocks */
/* eslint-disable semi */
/* eslint-disable quotes */
const Genre = require("../models/genre");
const async = require('async')
const Book = require('../models/book');
const { body, validationResult } = require('express-validator');

// Display list of all Genre.
exports.genre_list = (req, res) => {
  Genre.find().sort({ name: 1 }).exec(function (err, genre_list) {
  if (err){
    console.log(err)
  }
    res.render('genre_list', {
      title: 'Genre List',
    list_genre: genre_list
  }
    )
 })
};

// Display detail page for a specific Genre.
exports.genre_detail = (req, res) => {
async.parallel(
  {
     genre (callback) { Genre.findById(req.params.id).exec(callback) },
     genre_books (callback) {
     Book.find({ genre: req.params.id }).exec(callback)
}
}, (err, results) => {
  if (err) {
  return err
  }
  if (results.genre == null) {
     const err = new Error('Genre not found')
     err.status = 404
     return err
  }
  res.render('genre_detail', {
     title: 'Genre Detail',
     genre: results.genre,
     genre_books: results.genre_books

})
}
)
}

// Display Genre create form on GET.
exports.genre_create_get = (req, res) => {
 res.render('genre_form', { title: 'Create Genre' })
};

// Handle Genre create on POST
exports.genre_create_post = [
  // validate and sanitize the name field
  body('name', 'Genre name required').trim().isLength({ min: 1 }).escape(),
  // process request after the validation and sanitization

  (req, res, next) => {
    // extrect the validation errors for a request
    const errors = validationResult(req)

    // create a new genre with escaped abd trimmed data
    const genre = new Genre({ name: req.body.name })

    if (!errors.isEmpty()) {
      // there are errors so render the form again with sanitized values / error messages
      res.render('genre_form', {
      title: 'Create Genre',
      genre,
       errors: errors.array()
      }
      )
      } else {
        // data from the form is valid
        // check if genre with the same name exists
      Genre.findOne({ name: req.body.name }).exec((err, found_genre) => {
        if (err){
        return next(err)
      }
      if (found_genre) {
        // genre exists redircet to its detail page
        res.redirect(found_genre.url)
      } else {
        genre.save(err => {
          if (err) {
            return next(err)
          }
          res.redirect(genre.url)
        })
      }
    })
    }
  }
]

// Display Genre delete form on GET.
exports.genre_delete_get = (req, res, next) => {
 async.parallel({
  genres (callback) {
    Genre.findById(req.params.id).exec(callback)
  },
  books (callback){
  Book.find({ genre: req.params.id }).exec(callback)
  }
 }, (err, results) => {
  if (err) {
    return next(err)
  }
  if (results.genres === null) {
   res.redirect('/catalog/genres')
  }
  res.render('genre_delete', {
    title: 'Delete Genre',
    genre: results.genres,
    books: results.books
  })
 })
};

// Handle Genre delete on POST.
exports.genre_delete_post = (req, res, next) => {
async.parallel({
  genres (callback) {
   Genre.find(req.body.genreid).exec(callback)
  },
  books (callback) {
    Book.find({ genre: req.body.genreid }).exec(callback)
  }
}, (err, results) => {
  if (err) {
    return next(err)
  }
  if (results.genres.length > 0) {
    res.render('genre_delete', {
      title: 'Delete Genre',
    genre: results.genres,
    books: results.books
    })
}
})
}

// Display Genre update form on GET.
exports.genre_update_get = (req, res) => {
res.render('genre_form', { title: 'update Genre' })
};

// Handle Genre update on POST.
exports.genre_update_post = [
  body('name', 'genre must be filled').trim().isLength({ min: 1 }).escape(),

  (req, res, next) => {
 const errors = validationResult(req)

 const genre = new Genre({ name: req.body.name, _id: req.params.id })

 if (!errors.isEmpty()) {
  res.render('genre_form', { title: 'Update Genre', genre, errors: errors.array() })
 }
  Genre.findOneAndUpdate(req.body.name, genre, {}, (err) => {
    if (err) {
      return next(err)
    }
  }
  )
  res.redirect(genre.url)
}

]
