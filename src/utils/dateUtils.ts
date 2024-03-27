import { ITaskDB } from './interfaces'

export const is24HoursPassed = (date: Date): boolean => {
  const now = new Date()
  const timeDifference = now.getTime() - new Date(date).getTime()
  const hoursDifference = timeDifference / (1000 * 60 * 60)
  return hoursDifference >= 24
}

export const hoursUntilNextCompleted = (lastCompletedTime: Date): number => {
  const now = new Date()
  const timeDifference = now.getTime() - new Date(lastCompletedTime).getTime()
  const hoursDifference = timeDifference / (1000 * 60 * 60)
  const hoursUntilNext = 24 - hoursDifference
  return Math.floor(hoursUntilNext)
}

export const calculateMissedDays = (dateA: Date, dateB: Date): number => {
  const timeDifference = new Date(dateB).getTime() - new Date(dateA).getTime()
  const daysDifference = timeDifference / (1000 * 60 * 60 * 24) - 1
  return Math.floor(daysDifference)
}

export const getTaskStatusesString = (completed_tasks: ITaskDB[]): string => {
  let statuses = ''

  for (let i = 0; i < completed_tasks.length; i++) {
    const task = completed_tasks[i]
    statuses += '✅'

    if (i < completed_tasks.length - 1) {
      const nextTask = completed_tasks[i + 1]
      const missedDays = calculateMissedDays(
        task!.completion_time,
        nextTask!.completion_time
      )
      statuses += '❌'.repeat(missedDays)
    }
  }

  return statuses
}

export const getLastCompletedTask = (
  completed_tasks: ITaskDB[],
  task: string
): ITaskDB | undefined => {
  const completed: ITaskDB[] | [] = completed_tasks.filter(
    (completedTask: ITaskDB) => completedTask.task === task
  )
  return completed.at(-1)
}
