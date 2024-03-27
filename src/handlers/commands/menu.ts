import { InlineKeyboard } from 'grammy'
import { ParseMode } from 'grammy/types'

import { getChunks, getCompanyList } from '../../utils/index.js'
import { ContextType } from '../../types'

export const menuCommand = async (ctx: ContextType) => {
  const user = ctx.update.message?.from!

  const companyMenu = {
    caption: ctx.t('select_company'),
    options: {
      parse_mode: 'Markdown' as ParseMode,
      link_preview_options: { is_disabled: true },
      reply_markup: InlineKeyboard.from([
        ...getChunks(
          getCompanyList.map((company: any) =>
            InlineKeyboard.text(
              company.name,
              JSON.stringify({ method: 'task_menu', data: company.symbol })
            )
          ),
          1
        ),
      ]),
    },
  }

  await ctx.reply(companyMenu.caption, companyMenu.options)
}
