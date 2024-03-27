import { ParseMode } from 'grammy/types'

import { getJettons, getUserByUserId } from '../api/index.js'
import {
  getChunks,
  getCompanyList,
  getTaskList,
  getTaskStatusesString,
  hoursUntilNextCompleted,
  is24HoursPassed,
} from './index.js'
import { Address } from '../classes/index.js'
import { ITask, ITaskDB } from './interfaces'
import { ContextType } from '../types'

export const getTaskMenu = async (
  ctx: ContextType,
  user_id: number,
  symbol: string
) => {
  const userResponse = await getUserByUserId(user_id)

  if ('error' in userResponse) {
    return {
      caption: ctx.t(userResponse.error),
    }
  }

  const completedTasks = userResponse.result.completed_tasks
  const address = userResponse.result.address.non_bounceable
  const jettonsResponse = await getJettons(address, 1000, 0)

  if ('error' in jettonsResponse) {
    return {
      caption: ctx.t(jettonsResponse.error),
    }
  }

  const jetton = jettonsResponse.result.jettons.filter(
    (jetton: any) => jetton.jetton.symbol === symbol
  )[0]

  const getTasks = getCompanyList
    .find((company: any) => company.symbol === symbol)
    ?.tasks.map((task: ITask) => {
      const completed: ITaskDB[] | [] = completedTasks.filter(
        (completedTask: ITaskDB) => completedTask.task === task.data
      )

      const progress = getTaskStatusesString(completed)
      const lastCompletedTask = completed.at(-1)

      if (!lastCompletedTask) {
        return ctx.t('uncompleted_task', { task: task.name })
      } else {
        const check = is24HoursPassed(lastCompletedTask.completion_time)

        if (!check) {
          const hoursLeft = hoursUntilNextCompleted(
            lastCompletedTask.completion_time
          )

          return ctx.t('completed_task', {
            task: task.name,
            next_time: hoursLeft,
            progress,
          })
        } else {
          return ctx.t('uncompleted_task', { task: task.name })
        }
      }
    })
    .join('\n\n')

  return {
    caption: ctx.t('menu', {
      address: `[${Address.short(
        userResponse.result.address.non_bounceable
      )}](https://tonviewer.com/${Address.getNonBounceable(address)})`,
      balance: jetton.balance / 10 ** jetton.jetton.decimals,
      symbol: jetton.jetton.symbol,
      points: userResponse.result.points,
      tasks: getTasks!,
    }),
    options: {
      parse_mode: 'Markdown' as ParseMode,
      link_preview_options: { is_disabled: true },
      reply_markup: {
        inline_keyboard: [
          ...getChunks(
            getTaskList
              .filter((task: ITask) => {
                const completed: ITaskDB[] | [] = completedTasks.filter(
                  (completedTask: ITaskDB) => completedTask.task === task.data
                )

                const lastCompletedTask = completed.at(-1)

                if (!lastCompletedTask) {
                  return true
                } else {
                  const check = is24HoursPassed(lastCompletedTask.completion_time)

                  if (!check) {
                    return false
                  } else {
                    return true
                  }
                }
              })
              .map((task: ITask) => ({
                text: task.check,
                callback_data: JSON.stringify({
                  method: task.method,
                  data: task.data,
                }),
              })),
            1
          ),
          [
            {
              text: '🔄 Update',
              callback_data: JSON.stringify({
                method: 'update_task_menu',
              }),
            },
          ],
        ],
      },
    },
  }
}
