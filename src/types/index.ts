import { Context, Api } from 'grammy'
import { Conversation, ConversationFlavor } from '@grammyjs/conversations'
import { I18nFlavor } from '@grammyjs/i18n'

export interface ISceneProduct {
  file_id: string
  amount: number
}

export interface IProduct {
  user_id: number
  file_id: string
  asset: string
  amount: number
  id: number
}

interface IConfig {
  [key: string]: any
}

export type ContextType = Context & IConfig & ConversationFlavor & I18nFlavor

export type ConversationType = Conversation<ContextType>

export type BotApiType = { api: Api }
