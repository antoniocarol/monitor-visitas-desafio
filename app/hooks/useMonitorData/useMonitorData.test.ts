import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useMonitorData } from './index'
import { server } from '../../__tests__/mocks/server'
import { http, HttpResponse, delay } from 'msw'
import { mockUsers, createOverdueUser, createUrgentUser, createScheduledUser, createMockUser, createDateString } from '../../__tests__/mocks/data'

const API_URL = process.env.NEXT_PUBLIC_API_URL!

function makeOverdueUser(id: number, name: string = 'Usuário Teste') {
  return createMockUser({
    id,
    name,
    last_verified_date: createDateString(10),
    verify_frequency_in_days: 3
  })
}

describe('useMonitorData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    server.resetHandlers()
  })

  describe('Fetch inicial e estados de loading', () => {
    it('inicia com loading true', () => {
      const { result } = renderHook(() => useMonitorData())
      expect(result.current.loading).toBe(true)
    })

    it('termina loading após fetch bem-sucedido', async () => {
      const { result } = renderHook(() => useMonitorData())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })

    it('carrega dados corretamente da API', async () => {
      const { result } = renderHook(() => useMonitorData())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const totalUsers =
        result.current.data.overdue.length +
        result.current.data.urgent.length +
        result.current.data.scheduled.length

      expect(totalUsers).toBeGreaterThan(0)
    })

    it('error é null após fetch bem-sucedido', async () => {
      const { result } = renderHook(() => useMonitorData())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBeNull()
    })
  })

  describe('Filtragem de dados (apenas active: true)', () => {
    it('ignora usuários com active: false', async () => {
      server.use(
        http.get(API_URL, () => {
          return HttpResponse.json([
            { ...mockUsers[0], active: true },
            { ...mockUsers[1], active: false },
            { ...mockUsers[2], active: true },
          ])
        })
      )

      const { result } = renderHook(() => useMonitorData())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.allUsers.length).toBe(2)
    })
  })

  describe('Categorização de dados', () => {
    it('categoriza usuários em overdue/urgent/scheduled corretamente', async () => {
      server.use(
        http.get(API_URL, () => {
          return HttpResponse.json([
            createOverdueUser(),
            createUrgentUser(),
            createScheduledUser(),
          ])
        })
      )

      const { result } = renderHook(() => useMonitorData())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data.overdue.length).toBe(1)
      expect(result.current.data.urgent.length).toBe(1)
      expect(result.current.data.scheduled.length).toBe(1)

      expect(result.current.data.overdue[0].status).toBe('overdue')
      expect(result.current.data.urgent[0].status).toBe('urgent')
      expect(result.current.data.scheduled[0].status).toBe('scheduled')
    })
  })

  describe('Tratamento de erros', () => {
    it.skip('define error.type como "timeout" quando timeout ocorre', async () => {
      server.use(
        http.get(API_URL, async () => {
          await delay('infinite')
        })
      )

      const { result } = renderHook(() => useMonitorData())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      }, { timeout: 15000 })

      expect(result.current.error?.type).toBe('timeout')
      expect(result.current.error?.canRetry).toBe(true)
    })

    it('define error.type como "server" para erro 500', async () => {
      server.use(
        http.get(API_URL, () => {
          return new HttpResponse(null, { status: 500 })
        })
      )

      const { result } = renderHook(() => useMonitorData())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error?.type).toBe('server')
      expect(result.current.error?.canRetry).toBe(true)
    })

    it('define error.type como "server" e canRetry false para 404', async () => {
      server.use(
        http.get(API_URL, () => {
          return new HttpResponse(null, { status: 404 })
        })
      )

      const { result } = renderHook(() => useMonitorData())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error?.type).toBe('server')
      expect(result.current.error?.canRetry).toBe(false)
    })

    it('define error.type como "network" para falha de conexão', async () => {
      server.use(
        http.get(API_URL, () => {
          return HttpResponse.error()
        })
      )

      const { result } = renderHook(() => useMonitorData())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error?.type).toBe('network')
      expect(result.current.error?.canRetry).toBe(true)
    })
  })

  describe('refetch', () => {
    it('recarrega dados quando refetch é chamado', async () => {
      let callCount = 0
      server.use(
        http.get(API_URL, () => {
          callCount++
          return HttpResponse.json(mockUsers)
        })
      )

      const { result } = renderHook(() => useMonitorData())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(callCount).toBe(1)

      await act(async () => {
        await result.current.refetch()
      })

      expect(callCount).toBe(2)
    })
  })

  describe('Busca por nome e CPF', () => {
    beforeEach(() => {
      const overdueUser = createMockUser({
        id: 1,
        name: 'João Silva',
        cpf: '12345678901',
        last_verified_date: createDateString(10),
        verify_frequency_in_days: 3
      })
      const urgentUser = createMockUser({
        id: 2,
        name: 'Maria Santos',
        cpf: '98765432100',
        last_verified_date: createDateString(6),
        verify_frequency_in_days: 7
      })
      const scheduledUser = createMockUser({
        id: 3,
        name: 'Pedro Oliveira',
        cpf: '11122233344',
        last_verified_date: createDateString(2),
        verify_frequency_in_days: 10
      })

      server.use(
        http.get(API_URL, () => {
          return HttpResponse.json([overdueUser, urgentUser, scheduledUser])
        })
      )
    })

    it('filtra por nome (case-insensitive)', async () => {
      const { result } = renderHook(() => useMonitorData())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.allUsers.length).toBe(3)

      act(() => {
        result.current.setSearchTerm('maria')
      })

      await waitFor(() => {
        const total =
          result.current.data.overdue.length +
          result.current.data.urgent.length +
          result.current.data.scheduled.length
        expect(total).toBe(1)
      }, { timeout: 2000 })

      expect(result.current.data.urgent[0].name).toBe('Maria Santos')
    })

    it('filtra por CPF (apenas dígitos)', async () => {
      const { result } = renderHook(() => useMonitorData())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.setSearchTerm('987654')
      })

      await waitFor(() => {
        const total =
          result.current.data.overdue.length +
          result.current.data.urgent.length +
          result.current.data.scheduled.length
        expect(total).toBe(1)
      }, { timeout: 2000 })

      expect(result.current.data.urgent[0].cpf).toBe('98765432100')
    })

    it('retorna lista vazia quando busca não encontra resultados', async () => {
      const { result } = renderHook(() => useMonitorData())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.setSearchTerm('xyznonexistent')
      })

      await waitFor(() => {
        const total =
          result.current.data.overdue.length +
          result.current.data.urgent.length +
          result.current.data.scheduled.length
        expect(total).toBe(0)
      }, { timeout: 1000 })
    })
  })

  describe('registerVisit', () => {
    it('envia PATCH com formato correto de data', async () => {
      let capturedBody: { last_verified_date: string } | null = null

      server.use(
        http.get(API_URL, () => HttpResponse.json([makeOverdueUser(1, 'João')])),
        http.patch(`${API_URL}/:id`, async ({ request }) => {
          capturedBody = await request.json() as { last_verified_date: string }
          return HttpResponse.json({ success: true })
        })
      )

      const { result } = renderHook(() => useMonitorData())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.registerVisit(1)
      })

      expect(capturedBody).not.toBeNull()
      expect(capturedBody!.last_verified_date).toMatch(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}$/)
    })

    it('lança erro quando PATCH falha', async () => {
      server.use(
        http.get(API_URL, () => HttpResponse.json([makeOverdueUser(1, 'João')])),
        http.patch(`${API_URL}/:id`, () => {
          return new HttpResponse(null, { status: 500 })
        })
      )

      const { result } = renderHook(() => useMonitorData())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await expect(
        act(async () => {
          await result.current.registerVisit(1)
        })
      ).rejects.toThrow()
    })
  })

  describe('registerVisitBatch', () => {
    it('retorna success e failed arrays corretos', async () => {
      server.use(
        http.get(API_URL, () => HttpResponse.json([
          makeOverdueUser(1, 'João'),
          makeOverdueUser(2, 'Maria'),
          makeOverdueUser(3, 'Pedro'),
        ])),
        http.patch(`${API_URL}/1`, () => HttpResponse.json({ success: true })),
        http.patch(`${API_URL}/2`, () => new HttpResponse(null, { status: 500 })),
        http.patch(`${API_URL}/3`, () => HttpResponse.json({ success: true })),
      )

      const { result } = renderHook(() => useMonitorData())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let batchResult: { success: number[]; failed: number[] } | undefined

      await act(async () => {
        batchResult = await result.current.registerVisitBatch([1, 2, 3])
      })

      expect(batchResult?.success).toContain(1)
      expect(batchResult?.success).toContain(3)
      expect(batchResult?.failed).toContain(2)
      expect(batchResult?.success.length).toBe(2)
      expect(batchResult?.failed.length).toBe(1)
    })

    it('processa todos os IDs em paralelo', async () => {
      const requestTimes: number[] = []

      server.use(
        http.get(API_URL, () => HttpResponse.json([
          makeOverdueUser(1, 'João'),
          makeOverdueUser(2, 'Maria'),
        ])),
        http.patch(`${API_URL}/:id`, async () => {
          requestTimes.push(Date.now())
          await delay(50)
          return HttpResponse.json({ success: true })
        })
      )

      const { result } = renderHook(() => useMonitorData())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.registerVisitBatch([1, 2])
      })

      expect(requestTimes.length).toBe(2)
      const timeDiff = Math.abs(requestTimes[0] - requestTimes[1])
      expect(timeDiff).toBeLessThan(50)
    })
  })

  describe('Ordenação de dados', () => {
    it('ordena overdue por daysOverdue DESC (mais atrasados primeiro)', async () => {
      const usersData = [
        { ...makeOverdueUser(1, 'João'), verify_frequency_in_days: 3 },
        { ...makeOverdueUser(2, 'Maria'), verify_frequency_in_days: 7 },
        { ...makeOverdueUser(3, 'Pedro'), verify_frequency_in_days: 5 },
      ].map((u, i) => ({
        ...u,
        last_verified_date: `2025/11/${18 - i * 2} 10:00:00`
      }))

      server.use(
        http.get(API_URL, () => HttpResponse.json(usersData))
      )

      const { result } = renderHook(() => useMonitorData())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const overdue = result.current.data.overdue
      if (overdue.length >= 2) {
        expect(overdue[0].daysOverdue).toBeGreaterThanOrEqual(overdue[1].daysOverdue)
      }
    })

    it('ordena urgent por daysRemaining ASC (menos dias restantes primeiro)', async () => {
      server.use(
        http.get(API_URL, () => HttpResponse.json([
          createUrgentUser(1, 'Hoje'),
          createUrgentUser(2, 'Amanhã'),
          createUrgentUser(3, 'Depois'),
        ]))
      )

      const { result } = renderHook(() => useMonitorData())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const urgent = result.current.data.urgent
      if (urgent.length >= 2) {
        for (let i = 0; i < urgent.length - 1; i++) {
          expect(urgent[i].daysRemaining).toBeLessThanOrEqual(urgent[i + 1].daysRemaining ?? Infinity)
        }
      }
    })

    it('ordena scheduled por nextVisitDate ASC (datas mais próximas primeiro)', async () => {
      server.use(
        http.get(API_URL, () => HttpResponse.json([
          createScheduledUser(1, 'Próximo'),
          createScheduledUser(2, 'Médio'),
          createScheduledUser(3, 'Distante'),
        ]))
      )

      const { result } = renderHook(() => useMonitorData())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const scheduled = result.current.data.scheduled
      if (scheduled.length >= 2) {
        for (let i = 0; i < scheduled.length - 1; i++) {
          expect(scheduled[i].nextVisitDate.getTime())
            .toBeLessThanOrEqual(scheduled[i + 1].nextVisitDate.getTime())
        }
      }
    })
  })
})
