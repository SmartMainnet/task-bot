import { Address, beginCell, toNano } from 'ton-core'
import { UserRejectsError, isTelegramUrl } from '@tonconnect/sdk'

import { getConnector, getWalletInfo } from '../../ton-connect/index.js'
import {
  addTGReturnStrategy,
  pTimeout,
  pTimeoutException,
} from '../../utils/index.js'
import { ContextType } from '../../types/index.js'

export const sendTxCommand = async (ctx: ContextType) => {
  try {
    const chatId = ctx.chat?.id!

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
      .then(() => {
        ctx.reply(`Transaction sent successfully`)
      })
      .catch(e => {
        if (e === pTimeoutException) {
          ctx.reply(`Transaction was not confirmed`)
          return
        }

        if (e instanceof UserRejectsError) {
          ctx.reply(`You rejected the transaction`)
          return
        }

        ctx.reply(`Unknown error happened`)
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

    await ctx.reply(
      `Open ${
        walletInfo?.name || connector.wallet!.device.appName
      } and confirm transaction`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: `Open ${walletInfo?.name || connector.wallet!.device.appName}`,
                url: deeplink,
              },
            ],
          ],
        },
      }
    )
  } catch (e) {
    console.log(e)
  }
}
