import { NextFunction } from 'grammy'

import { ContextType } from '../../types/index.js'

export const deleteCommandMiddleware = async (
  ctx: ContextType,
  next: NextFunction
) => {
  try {
    await ctx.deleteMessage()
    next()
  } catch (e) {
    console.log(e)
    next()
  }
}
