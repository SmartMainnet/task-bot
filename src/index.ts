import 'dotenv/config'
import { Bot } from 'grammy'

import { i18nMiddleware, limitMiddleware } from './middlewares/plugins/index.js'
import { deleteCommandMiddleware } from './middlewares/utils/index.js'
import {
  menuCommand,
  sendTxCommand,
  startCommand,
} from './handlers/commands/index.js'
import {
  choseWalletCallback,
  companyMenuCallback,
  connectWalletCallback,
  taskMenuCallback,
} from './handlers/callbacks/index.js'
import { ContextType } from './types/index.js'

const { BOT_TOKEN } = process.env
const bot = new Bot<ContextType>(BOT_TOKEN!)

// set commands
await bot.api.setMyCommands([
  { command: 'start', description: 'Restart bot' },
  { command: 'menu', description: 'Show Menu' },
  { command: 'send_tx', description: 'Send transaction' },
])

// plugins
bot.use(i18nMiddleware)
bot.use(limitMiddleware)

// commands
bot.command('start', startCommand)
bot.command('menu', menuCommand)
bot.command('send_tx', sendTxCommand)

// messages
bot.hears(/./, async (ctx: ContextType) => {
  console.log(ctx.update.message)
  await ctx.replyWithDocument(ctx.update.message?.document?.file_id!)
})

// callbacks
bot.callbackQuery('connect', deleteCommandMiddleware, connectWalletCallback)
bot.callbackQuery(
  /^{"method":"(chose_wallet|select_wallet|universal_qr)".*}$/,
  choseWalletCallback
)
bot.callbackQuery(
  /^{"method":"(task_menu|update_task_menu|task_completed|burn_people)".*}$/,
  taskMenuCallback
)
bot.callbackQuery(/^{"method":"company_menu".*}$/, companyMenuCallback)

// start bot
bot.start({
  onStart(botInfo) {
    console.log('botInfo: ', botInfo)
  },
})
