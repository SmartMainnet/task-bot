import {
  burnPeople,
  openTaskMenu,
  taskCheck,
  updateTaskMenu,
} from '../../utils/index.js'
import { ContextType } from '../../types/index.js'

export const taskMenuCallback = async (ctx: ContextType) => {
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

    if (!taskMenuCallbacks[request.method as keyof typeof taskMenuCallbacks]) {
      return
    }

    taskMenuCallbacks[request.method as keyof typeof taskMenuCallbacks](
      ctx,
      request.data
    )
  } catch (e) {
    console.log(e)
  }
}

const taskMenuCallbacks = {
  task_menu: openTaskMenu,
  update_task_menu: updateTaskMenu,
  task_completed: taskCheck,
  burn_people: burnPeople,
}
