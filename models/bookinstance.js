/* eslint-disable camelcase */
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const { DateTime } = require('luxon')

const BookInstanceSchema = new Schema({ book: { type: Schema.Types.ObjectId, ref: 'Book', required: true }, imprint: { type: String, required: true }, status: { type: String, required: true, enum: ['Available ', 'Maintenance', 'Loaned', 'Reserved'], default: 'Maintenance' }, due_back: { type: Date, default: Date.now } })

BookInstanceSchema.virtual('url').get(function () {
  return `/catalog/bookinstance/${this._id}`
})

BookInstanceSchema.virtual('date_back_formatted').get(function () {
  const due_back = DateTime.fromJSDate(this.due_back).toLocaleString(DateTime.DATE_MED)
  return due_back
})
module.exports = mongoose.model('Bookinstance', BookInstanceSchema)
