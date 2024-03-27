import { walletMenuCallbacks } from '../../ton-connect/index.js'
import { ContextType } from '../../types/index.js'

export const choseWalletCallback = async (ctx: ContextType) => {
  try {
    const query = ctx.update.callback_query!

    if (!query.data) {
      return
    }

    let request: { method: string; data: string }

    try {
      request = JSON.parse(query.data)
    } catch {
      return
    }

    if (!walletMenuCallbacks[request.method as keyof typeof walletMenuCallbacks]) {
      return
    }

    walletMenuCallbacks[request.method as keyof typeof walletMenuCallbacks](
      ctx,
      request.data
    )
  } catch (e) {
    console.log(e)
  }
}
