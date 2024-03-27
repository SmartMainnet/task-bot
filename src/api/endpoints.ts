import { User } from 'grammy/types'

import { API } from '../classes/index.js'

export const createUser = async (user: User) => {
  return await API.call('POST', '/users/createUser', user)
}

export const getUsers = async () => {
  return await API.call('GET', '/users/getUsers', {})
}

export const getUserById = async (id: number) => {
  return await API.call('GET', '/users/getUserById', { id })
}

export const getUserByUserId = async (user_id: number) => {
  return await API.call('GET', '/users/getUserByUserId', { user_id })
}

export const addAddress = async (user_id: number, address: string) => {
  return await API.call('POST', '/users/addAddress', { user_id, address })
}

export const pointsIncrease = async (user_id: number, points: number = 1) => {
  return await API.call('POST', '/users/pointsIncrease', { user_id, points })
}

export const taskCompleted = async (
  user_id: number,
  task: string,
  points: number = 1
) => {
  return await API.call('POST', '/users/taskCompleted', { user_id, task, points })
}

export const getCompletedTasks = async (user_id: number) => {
  return await API.call('GET', '/users/getCompletedTasks', { user_id })
}

// =================================================================

export const getFriendlyAddress = async (address: string) => {
  return await API.call('GET', '/ton/getFriendlyAddress', { address })
}

export const getRawAddress = async (address: string) => {
  return await API.call('GET', '/ton/getRawAddress', { address })
}

export const getAddressType = async (address: string) => {
  return await API.call('GET', '/ton/getAddressType', { address })
}

export const getWalletInfo = async (address: string) => {
  return await API.call('GET', '/ton/getWalletInfo', { address })
}

export const getTransactionInfo = async (address: string) => {
  return await API.call('GET', '/ton/getTransactionInfo', { address })
}

export const getJettonInfo = async (address: string) => {
  return await API.call('GET', '/ton/getJettonInfo', { address })
}

export const getNftInfo = async (address: string) => {
  return await API.call('GET', '/ton/getNftInfo', { address })
}

export const getNftInfoByOwner = async (address: string, page: number) => {
  return await API.call('GET', '/ton/getNftInfoByOwner', { address, page })
}

export const getTransactions = async (
  address: string,
  limit: number,
  page: number
) => {
  return await API.call('GET', '/ton/getTransactions', {
    address,
    limit,
    page,
  })
}

export const getJettons = async (address: string, limit: number, page: number) => {
  return await API.call('GET', '/ton/getJettons', { address, limit, page })
}

export const getNfts = async (address: string) => {
  return await API.call('GET', '/ton/getNfts', { address })
}
