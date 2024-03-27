import { api } from '../api/index.js'

type EndpointType = Promise<{ error: string } | { result: any }>

interface IApiResponse {
  data?: {
    ok: boolean
    result?: { [key: string]: any }
    error?: { message: string }
  }
}

export class API {
  static call = async (method: string, url: string, data: {}): EndpointType => {
    const response: IApiResponse = await api({ method, url, data })

    if (!response?.data || !response.data.ok) {
      return { error: response.data?.error?.message || 'error' }
    }

    if (response.data.result === undefined) {
      return { error: 'error' }
    }

    return { result: response.data.result }
  }
}
