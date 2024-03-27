import { InlineKeyboard } from 'grammy'

import { IProduct } from '../../types/index.js'

export const buyInlineKeyboard = (product: IProduct) => {
  return new InlineKeyboard().text(`Buy for ${product.amount} TON`, `P${product.id}`)
}
