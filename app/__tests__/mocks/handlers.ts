import { http, HttpResponse, delay } from 'msw'
import { mockUsers } from './data'

const API_URL = process.env.NEXT_PUBLIC_API_URL!

export const handlers = [
  http.get(API_URL, () => HttpResponse.json(mockUsers)),
  http.patch(`${API_URL}/:id`, async ({ params, request }) => {
    const { id } = params
    const body = await request.json() as { last_verified_date: string }
    return HttpResponse.json({
      id: Number(id),
      success: true,
      last_verified_date: body.last_verified_date
    })
  })
]

export const errorHandlers = {
  timeout: http.get(API_URL, async () => { await delay('infinite') }),
  serverError: http.get(API_URL, () => new HttpResponse(null, { status: 500 })),
  networkError: http.get(API_URL, () => HttpResponse.error()),
  notFound: http.get(API_URL, () => new HttpResponse(null, { status: 404 })),
  emptyResponse: http.get(API_URL, () => HttpResponse.json([])),
  patchError: http.patch(`${API_URL}/:id`, () => new HttpResponse(null, { status: 500 })),
  patchNotFound: http.patch(`${API_URL}/:id`, () => new HttpResponse(null, { status: 404 }))
}

export function createDelayedHandler(delayMs: number) {
  return http.get(API_URL, async () => {
    await delay(delayMs)
    return HttpResponse.json(mockUsers)
  })
}

export function createCustomDataHandler(data: Parameters<typeof HttpResponse.json>[0]) {
  return http.get(API_URL, () => HttpResponse.json(data))
}
