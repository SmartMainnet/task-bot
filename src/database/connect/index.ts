import mongoose from 'mongoose'

export async function connectToMongoDB() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/raffle?replicaSet=rs0')
    console.log('Connected to MongoDB')
  } catch (error) {
    console.error('Error connecting to MongoDB:', error)
  }
}
