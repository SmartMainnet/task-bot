import mongoose from 'mongoose'

const { Schema } = mongoose

const mapSchema = new Schema({
  chatId: Number,
  key: String,
  value: String,
})

export const MapModel = mongoose.model('MapModel', mapSchema)
