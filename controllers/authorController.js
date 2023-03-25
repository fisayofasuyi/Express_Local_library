/* eslint-disable camelcase */
/* eslint-disable eol-last */
/* eslint-disable no-trailing-spaces */
/* eslint-disable indent */
/* eslint-disable semi */
/* eslint-disable quotes */
const Author = require('../models/author')

const Book = require('../models/book')
const async = require('async')
const { body, validationResult } = require('express-validator')

exports.author_list = (req, res) => {
 Author.find()
 .sort({ family_name: 1 })
 // eslint-disable-next-line camelcase
 .exec(function (err, list_authors) {
  if (err) {
    console.log(err)
    }
    res.render('author_list', {
      title: 'Author List ',
      author_list: list_authors
    })
 })
}

exports.author_detail = (req, res, next) => {
  async.parallel({
    author (callback) {
      Author.findById(req.params.id)
      .exec(callback)
    },
    author_books (callback) {
    Book.find({ author: req.params.id }, 'title summary').exec(callback)
    }
  }, (err, results) => {
    if (err) { return next(err) }
    if (results.author == null) { 
      const err = new Error('Author not found')
      err.status = 404
      return next(err)
 }
 res.render('author_detail', {
  title: 'Author Detail',
  author: results.author,
  author_books: results.author_books
 }) 
}
 
 )
}

exports.author_create_get = (req, res) => {
  res.render('author_form', { title: 'Create Author' })
}

exports.author_create_post = [
  body('first_name')
  .trim()
  .isLength({ min: 1 })
  .escape()
  .withMessage('first name must be specified')
  .isAlphanumeric()// don't use
  .withMessage('First name has non alpha-numeric charcters'), 

  body('family_name')
  .trim()
  .isLength({ min: 1 })
  .escape()
  .withMessage('Family name must be specified')
  .isAlphanumeric()// don't use
  .withMessage('Family name has non alpha-numeric charcters'), 

  body('date_of_birth', 'Invalid Date of Birth')
  .optional({ checkFalsy: true })
  .isISO8601()
  .toDate(),

  body('date_of_death', 'Invalid Date of Birth')
  .optional({ checkFalsy: true })
  .isISO8601()
  .toDate(),

  (req, res, next) => {
    const errors = validationResult(req)
  
   if (!errors.isEmpty()) {
    res.render('author_form', {
      title: 'Create Author',
      author: req.body,
      errors: errors.array()

    })
   }
   const author = new Author({
    first_name: req.body.first_name,
    family_name: req.body.family_name,
    date_of_birth: req.body.date_of_birth,
    date_of_death: req.body.date_of_death
   })

   author.save(err => {
    if (err) {
     return next(err)
    }
    res.redirect(author.url)
   })
}

]
exports.author_delete_get = (req, res, next) => {
    async.parallel({
      author (callback) {
        Author.findById(req.params.id).exec(callback)
      },
      author_books (callback) {
        Book.find({ author: req.params.id }).exec(callback)
      }
    }, (err, results) => {
      if (err) {
        return next(err)
      }
      if (results.author === null) {
        res.redirect('/catalog/authors')
      }
      res.render('author_delete', {
        title: 'Delete Author',
        author: results.author,
        author_books: results.author_books
      })
    })
  };
  
  // Handle Author delete on POST.
  exports.author_delete_post = (req, res, next) => {
    async.parallel({
      author (callback) {
        Author.findById(req.body.authorid).exec(callback);
      },
      author_books (callback) {
       Book.find({ author: req.body.authorid }).exec(callback);
      }
    }, (err, results) => {
      if (err) {
        return next(err)
      }
      if (results.author_books.length > 0) {
        // Author has books. Render in the same way as get route
        res.render('author_delete', {
          title: 'Delete Author',
          author: results.author,
          author_books: results.author_books
        })
}
     Author.findByIdAndRemove(results.body.authorid, (err) => {
      if (err) {
        return next(err)
      }
      res.redirect('/catalog/authors')
     })
    })
  };
  
  // Display Author update form on GET.
  exports.author_update_get = (req, res) => {
    res.render('author_form', { title: 'Update Author Details' })
  };
  
  // Handle Author update on POST.
  exports.author_update_post = [

    // sanitize the fields
    body('first_name', 'first name must be specified').trim().isLength({ min: 1 }).escape(),
    body('family_name', 'family name must be specified').trim().isLength({ min: 1 }).escape(),
    body('date_of_birth', 'invalid date of birth').optional({ checkFalsy: true }).isISO8601().toDate(),
    body('date_of_death', 'invalid date of death').optional({ checkFalsy: true }).isISO8601().toDate(),

    (req, res, next) => {
     const errors = validationResult(req)
    
     // create a new instance of author
     const author = new Author({
      first_name: req.body.first_name,
      family_name: req.body.family_name,
      date_of_birth: req.body.date_of_birth,
      date_of_death: req.body.date_of_death,
      _id: req.params.id
    })
   
     // if errors are not empty, render the form again
    if (!errors.isEmpty()) {
    res.render('author_form', {
      title: 'Update Author Details',
      author,
      errors: errors.array()
    }
    
    )
  }

  // update the author with the new details
  Author.findByIdAndUpdate(req.params.id, author, {}, (err, theauthor) => {
    if (err) {
      return next(err)
    }
    res.redirect(theauthor.url)
  })
    }
  ]