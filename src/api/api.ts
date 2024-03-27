import axios from 'axios'

const { API_URL } = process.env

export const api = axios.create({
  baseURL: API_URL,
})
