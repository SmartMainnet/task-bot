export interface ITask {
  name: string
  check: string
  method: string
  data: string
}

export interface ITaskDB {
  task: string
  completion_time: Date
}
