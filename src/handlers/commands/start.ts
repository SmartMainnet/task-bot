import { InlineKeyboard } from 'grammy'

import { createUser } from '../../api/index.js'
import { ContextType } from '../../types/index.js'

export const startCommand = async (ctx: ContextType) => {
  try {
    await ctx.reply(ctx.t('start', { bot_name: ctx.me.first_name }), {
      reply_markup: new InlineKeyboard().text('Connect Wallet', 'connect'),
    })

    await createUser(ctx.from!)
  } catch (e) {
    console.log(e)
  }
}
