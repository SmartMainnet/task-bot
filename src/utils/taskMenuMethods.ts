import { InlineKeyboard } from 'grammy'

import {
  getJettons,
  getTransactions,
  getUserByUserId,
  taskCompleted,
} from '../api/index.js'
import {
  addTGReturnStrategy,
  getLastCompletedTask,
  getTaskList,
  getTaskMenu,
  is24HoursPassed,
  pTimeout,
  pTimeoutException,
} from '../utils/index.js'
import { ContextType } from '../types'
import { getConnector } from '../ton-connect/conenctor.js'
import { Address, beginCell, toNano } from 'ton-core'
import { UserRejectsError, isTelegramUrl } from '@tonconnect/sdk'
import { getWalletInfo } from '../ton-connect/wallets.js'

const backToTaskMenuKeyboard = () => {
  return new InlineKeyboard().text('« Back', JSON.stringify({ method: 'task_menu' }))
}

const backToCheckTaskKeyboard = (data: string) => {
  return new InlineKeyboard().text(
    '« Back',
    JSON.stringify({
      method: 'task_completed',
      data,
    })
  )
}

export const openTaskMenu = async (
  ctx: ContextType,
  data: string
): Promise<void> => {
  const user = ctx.update.callback_query?.from!
  const taskMenu = await getTaskMenu(ctx, user.id, data)

  await ctx.editMessageText(taskMenu.caption, taskMenu.options)
}

export const updateTaskMenu = async (
  ctx: ContextType,
  data: string
): Promise<void> => {
  try {
    const user = ctx.update.callback_query?.from!
    const taskMenu = await getTaskMenu(ctx, user.id, data)

    await ctx.editMessageText(taskMenu.caption, taskMenu.options)
  } catch (e) {
    await ctx.answerCallbackQuery(ctx.t('already_updated'))
  }
}

export const burnPeople = async (ctx: ContextType, data: string): Promise<void> => {
  try {
    const chatId = ctx.callbackQuery!.from.id

    const connector = getConnector(chatId)
    await connector.restoreConnection()

    if (!connector.connected) {
      await ctx.reply('Connect wallet to send transaction')
      return
    }

    const jettonMasterAddress = Address.parse(
      'EQA0KVd0qQ-fMsnvFU7f2Hg-wlRIq1V2AUxdwSDuiP0g4eJP'
    )
    const jettonWalletAddress = Address.parse(
      'EQB2VGqZrhGw7Vsq6Rq9wmCzGakF1Cm4vGbdFG1DeuMaGRsy'
    )

    const body = beginCell()
      .storeUint(0x595f07bc, 32) // jetton burn op code
      .storeUint(0, 64) // query_id:uint64
      .storeCoins(1000000) // amount:(VarUInteger 16) -  Jetton amount in decimal
      .storeAddress(jettonMasterAddress) // response_destination:MsgAddress - owner's wallet
      .storeUint(0, 1) // custom_payload:(Maybe ^Cell) - w/o payload typically
      .endCell()

    pTimeout(
      connector.sendTransaction({
        validUntil: Math.round(
          (Date.now() + Number(process.env.DELETE_SEND_TX_MESSAGE_TIMEOUT_MS)) / 1000
        ),
        messages: [
          {
            address: jettonWalletAddress.toString(),
            amount: toNano('0.1').toString(),
            payload: body.toBoc().toString('base64'),
          },
        ],
      }),
      Number(process.env.DELETE_SEND_TX_MESSAGE_TIMEOUT_MS)
    )
      .then(async () => {
        await taskCompleted(chatId, data)

        await ctx.editMessageText(ctx.t('task_completed'), {
          parse_mode: 'Markdown',
          reply_markup: backToTaskMenuKeyboard(),
        })
      })
      .catch(e => {
        if (e === pTimeoutException) {
          ctx.editMessageText(`Transaction was not confirmed`, {
            reply_markup: backToCheckTaskKeyboard(data),
          })
          return
        }

        if (e instanceof UserRejectsError) {
          ctx.editMessageText(`You rejected the transaction`, {
            reply_markup: backToCheckTaskKeyboard(data),
          })
          return
        }

        ctx.editMessageText(`Unknown error happened`, {
          reply_markup: new InlineKeyboard().text(
            '« Back',
            JSON.stringify({
              method: 'task_completed',
              data,
            })
          ),
        })
      })
      .finally(() => connector.pauseConnection())

    let deeplink = ''
    const walletInfo = await getWalletInfo(connector.wallet!.device.appName)

    if (walletInfo) {
      deeplink = (walletInfo as any).universalLink
    }

    if (isTelegramUrl(deeplink)) {
      const url = new URL(deeplink)
      url.searchParams.append('startattach', 'tonconnect')
      deeplink = addTGReturnStrategy(url.toString(), process.env.BOT_LINK!)
    }

    await ctx.editMessageText(
      `Open ${
        walletInfo?.name || connector.wallet!.device.appName
      } and confirm transaction`,
      {
        reply_markup: new InlineKeyboard()
          .url(
            `Open ${walletInfo?.name || connector.wallet!.device.appName}`,
            deeplink.replace('?attach=wallet&startattach', '/start?startapp')
          )
          .row()
          .text(
            '« Back',
            JSON.stringify({
              method: 'task_completed',
              data,
            })
          ),
      }
    )
  } catch (e) {
    console.log(e)
  }
}

export const taskCheck = async (ctx: ContextType, data: string): Promise<void> => {
  const query = ctx.update.callback_query!
  const user = query.from
  const userResponse = await getUserByUserId(user.id)

  if ('error' in userResponse) {
    await ctx.reply(ctx.t(userResponse.error))
    return
  }

  const completedTasks = userResponse.result.completed_tasks
  const lastCompletedTask = getLastCompletedTask(completedTasks, data)

  if (lastCompletedTask && !is24HoursPassed(lastCompletedTask.completion_time)) {
    await ctx.editMessageText(ctx.t('task_already_completed'), {
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard().text(
        '« Back',
        JSON.stringify({ method: 'task_menu' })
      ),
    })
    return
  }

  const address = userResponse.result.address.non_bounceable
  const task = getTaskList.find(task => (task.data = data))

  if (!task) {
    await ctx.reply(ctx.t('task_not_found'))
    return
  }

  if (data === 'hold_people') {
    const jettonsResponse = await getJettons(address, 1000, 0)

    if ('error' in jettonsResponse) {
      await ctx.reply(ctx.t(jettonsResponse.error))
      return
    }

    const jetton = jettonsResponse.result.jettons.filter(
      (jetton: any) => jetton.jetton.symbol === 'People'
    )[0]

    const balance = jetton.balance / 10 ** jetton.jetton.decimals
    const isCompleted = balance >= 10

    if (isCompleted) {
      await taskCompleted(user.id, data)

      await ctx.editMessageText(ctx.t('task_completed'), {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard().text(
          '« Back',
          JSON.stringify({ method: 'task_menu' })
        ),
      })
    } else {
      await ctx.editMessageText(task.uncompleted, {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard().text(
          '« Back',
          JSON.stringify({ method: 'task_menu' })
        ),
      })
    }
  }

  if (data === 'buy_people') {
    try {
      const transactionsResponse = await getTransactions(address, 100, 0)

      if ('error' in transactionsResponse) {
        await ctx.reply(ctx.t(transactionsResponse.error))
        return
      }

      const isCompleted = transactionsResponse.result.events.some(
        (event: any) =>
          event.actions[0].type === 'JettonSwap' &&
          event.actions[0].JettonSwap.jetton_master_out.symbol === 'People' &&
          event.actions[0].JettonSwap.amount_out /
            10 ** event.actions[0].JettonSwap.jetton_master_out.decimals >
            0.99 &&
          !is24HoursPassed(new Date(event.timestamp * 1000))
      )

      if (isCompleted) {
        await taskCompleted(user.id, data)

        await ctx.editMessageText(ctx.t('task_completed'), {
          parse_mode: 'Markdown',
          reply_markup: backToTaskMenuKeyboard(),
        })
      } else {
        await ctx.editMessageText(task.uncompleted, {
          parse_mode: 'Markdown',
          reply_markup: new InlineKeyboard()
            .text(
              '🔎 Chack again',
              JSON.stringify({
                method: 'task_completed',
                data,
              })
            )
            .webApp(
              '💰 Buy',
              'https://app.ston.fi/swap?referral_address=UQBBDmW8NxpCirSBW4tUF3uvpMqVRDqolW1rVDTBgGSKw9ep&ft=TON&tt=People&ta=1.01&chartVisible=false'
            )
            .row()
            .text('« Back', JSON.stringify({ method: 'task_menu' })),
        })
      }
    } catch (e) {
      await ctx.answerCallbackQuery(ctx.t('already_updated'))
    }
  }

  if (data === 'burn_people') {
    const transactionsResponse = await getTransactions(address, 100, 0)

    if ('error' in transactionsResponse) {
      await ctx.reply(ctx.t(transactionsResponse.error))
      return
    }

    const isCompleted = transactionsResponse.result.events.some(
      (event: any) =>
        event.actions[0].type === 'JettonBurn' &&
        event.actions[0].JettonBurn.jetton.symbol === 'People' &&
        !is24HoursPassed(new Date(event.timestamp * 1000))
    )

    if (isCompleted) {
      await taskCompleted(user.id, data)

      await ctx.editMessageText(ctx.t('task_completed'), {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard().text(
          '« Back',
          JSON.stringify({ method: 'task_menu' })
        ),
      })
    } else {
      await ctx.editMessageText(task.uncompleted, {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
          .text(
            '🔎 Chack again',
            JSON.stringify({
              method: 'task_completed',
              data,
            })
          )
          .text(
            '🔥 Burn',
            JSON.stringify({
              method: 'burn_people',
              data,
            })
          )
          .row()
          .text('« Back', JSON.stringify({ method: 'task_menu' })),
      })
    }
  }
}
