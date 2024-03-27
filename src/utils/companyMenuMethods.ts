import { InlineKeyboard } from 'grammy'
import { ParseMode } from 'grammy/types'

import { getCompanyList } from '../utils/index.js'
import { ContextType } from '../types'

export const openCompanyMenu = async (
  ctx: ContextType,
  _: string
): Promise<void> => {
  const user = ctx.update.callback_query?.from!

  const companyMenu = {
    caption: ctx.t('select_company'),
    options: {
      parse_mode: 'Markdown' as ParseMode,
      link_preview_options: { is_disabled: true },
      reply_markup: InlineKeyboard.from([
        getCompanyList.map((company: any) =>
          InlineKeyboard.text(
            company.name,
            JSON.stringify({ method: 'task_menu', data: company.symbol })
          )
        ),
      ]),
    },
  }

  await ctx.editMessageText(companyMenu.caption, companyMenu.options)
}
