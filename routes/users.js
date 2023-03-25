const express = require('express')
const router = express.Router()

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('respond with a resource')
})

router.get('/cool', function (req, res) {
  res.send("your'e so cool")
})

router.get('/pug', function (req, res) {
  res.render('test', { value: 'Pug Test' })
})

module.exports = router
