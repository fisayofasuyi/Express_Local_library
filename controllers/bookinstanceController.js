/* eslint-disable no-trailing-spaces */
/* eslint-disable indent */
/* eslint-disable camelcase */

const BookInstance = require('../models/bookinstance')
const Book = require('../models/book')
const { body, validationResult } = require('express-validator')
const async = require('async')

exports.bookinstance_list = function (req, res, next) {
  BookInstance.find().populate('book').exec(function (err, list_bookinstances) {
    if (err) {
      return next(err)
    }

    res.render('bookinstance_list', {
      title: 'Book Instance List',
      bookinstance_list: list_bookinstances
    })
  })
}

exports.bookinstance_detail = (req, res, next) => {
  BookInstance.findById(req.params.id)
    .populate('book')
    .exec((err, bookinstance) => {
      if (err) {
        return next(err)
      }
      if (bookinstance == null) {
        const err = new Error('Book copy not found')
        err.status = 404
        return next(err)
      }

      res.render('bookinstance_detail', {
        title: `copy: ${bookinstance.book.title}`,
        id: bookinstance._id,
        instance: bookinstance
      })
    }
    )
}

exports.bookinstance_create_get = (req, res, next) => {
  Book.find().sort({ title: 1 }).exec((err, books) => {
    if (err) {
      return next(err)
    }
    res.render('bookinstance_form', {
      title: 'Create BookInstance',
      book_list: books
      
    })
  })
}

/*
exports.bookinstance_create_get = (req, res, next) => {
  Book.find({}, 'title').exec((err, books) => {
    if (err) {
      return next(err)
    }
    res.render('bookinstance_form', {
      title: 'Create BookInstance',
      book_list: books
    })
  })
}
*/

exports.bookinstance_create_post = [
  body('book', 'book must be soecified').trim().isLength({ min: 1 }).escape(),
  body('imprint', 'Imprint must be soecified').trim().isLength({ min: 1 }).escape(),
  body('status').escape(),
  body('due_back', 'invalid date').optional({ checkFalsy: true }).isISO8601().toDate(),
  (req, res, next) => {
    const errors = validationResult(req)
    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back
    }
    )
    if (!errors.isEmpty()) {
      Book.find().exec((err, books) => {
        if (err) {
          return next(err)
        }
        res.render('bookinstance_form', {
          title: 'Create Book Instance',
          books_list: books,
          errors: errors.array(),
          bookinstance

        })
      })
    }
    bookinstance.save(function (err) {
      if (err) {
        return next(err)
      }
      res.redirect(bookinstance.url)
    })
  }
]

exports.bookinstance_delete_get = (req, res, next) => {
  BookInstance.findById(req.params.id).exec((err, results) => {
    if (err) {
      return next(err)
    }
    if (results === null) {
      res.redirect('/catalog/bookinstance')
    }
    res.render(
      'bookinstance_delete', {
        title: 'Delete Bookinstance',
        bookinstances: results
      })
  }
  )
}

exports.bookinstance_delete_post = (req, res, next) => {
  Book.findById({ book: req.body.bookinstanceid }).populate('book').exec((err, results) => {
    if (err) {
      return next(err)
    }
    if (results === null) {
      res.redirect('/catalog/bookinstance')
    }
    res.render(
      'bookinstance_delete', {
        title: 'Delete Bookinstance',
        book_list: results
      })
  }
  )
}

exports.bookinstance_update_get = (req, res, next) => {
  async.parallel({ 
    bookinstances (callback) {
    BookInstance.findById(req.params.id).populate('book').exec(callback)
  },
  books (callback) {
    Book.find().sort().exec(callback)
  } 
},
(err, results) => {
    if (err) { return next(err) }
    res.render('bookinstance_form', { title: 'Update Book Instance', bookinstances: results.bookinstances, book_list: results.books, selected_book: results.bookinstances.book._id })
    // selected book is used to check the book that was selected
  })
}

exports.bookinstance_update_post = [
  body('book', 'book must be specified').trim().isLength({ min: 1 }).escape(),
  body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }).escape(),
  body('status').escape(),
  body('due_back', 'invalid date').optional({ checkFalsy: true }).isISO8601().toDate(),

  (req, res, next) => {
    const errors = validationResult(req)
    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
      _id: req.params.id
    })

  if (!errors.isEmpty()) {
    async.parallel({ 
      bookinstances (callback) {
      BookInstance.findById(req.params.id).exec(callback)
    },
    books (callback) {
      Book.find({}, 'title').sort().exec(callback)
    } 
  },
  (err, results) => {
      if (err) { return next(err) }
      res.render('bookinstance_form', { title: 'Update Book Instance', bookinstances: results.bookinstances, book_list: results.books, bookinstance, selected_book: results.bookinstances.book._id, errors: errors.array() })
    })
  }

  bookinstance.findByIdAndUpdate(req.params.id, bookinstance, {}, (err, thebookinstance) => { 
    if (err) {
    return next(err)
  }
  res.redirect(thebookinstance.url)
})
}
]
