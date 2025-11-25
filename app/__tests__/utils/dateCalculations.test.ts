import { describe, it, expect } from 'vitest'
import {
  parseApiDate,
  determineStatus,
  processUser,
  formatDate,
  formatCPF,
  sortOverdue,
  sortUrgent,
  sortScheduled,
  formatNextVisitRelative
} from '../../utils/dateCalculations'
import { MonitoredUser, ProcessedUser } from '../../types/monitor'

describe('dateCalculations', () => {
  const FIXED_NOW = new Date('2025-11-25T12:00:00.000Z')

  describe('parseApiDate', () => {
    it('parseia data válida no formato API (YYYY/MM/DD HH:mm:ss)', () => {
      const result = parseApiDate('2025/11/25 14:30:00')
      expect(result).toBeInstanceOf(Date)
      expect(result?.getFullYear()).toBe(2025)
      expect(result?.getMonth()).toBe(10)
      expect(result?.getDate()).toBe(25)
    })

    it('retorna null para string vazia', () => {
      expect(parseApiDate('')).toBeNull()
    })

    it('retorna null para string inválida', () => {
      expect(parseApiDate('invalid-date')).toBeNull()
      expect(parseApiDate('not a date')).toBeNull()
    })

    it('retorna null para null/undefined', () => {
      expect(parseApiDate(null as unknown as string)).toBeNull()
      expect(parseApiDate(undefined as unknown as string)).toBeNull()
    })

    it('lida com data no formato ISO também', () => {
      const result = parseApiDate('2025-11-25T14:30:00')
      expect(result).toBeInstanceOf(Date)
    })
  })

  describe('determineStatus', () => {
    it('retorna "overdue" para dias negativos', () => {
      expect(determineStatus(-1)).toBe('overdue')
      expect(determineStatus(-5)).toBe('overdue')
      expect(determineStatus(-100)).toBe('overdue')
    })

    it('retorna "urgent" para 0 dias (hoje)', () => {
      expect(determineStatus(0)).toBe('urgent')
    })

    it('retorna "urgent" para 1 dia (amanhã)', () => {
      expect(determineStatus(1)).toBe('urgent')
    })

    it('retorna "urgent" para 2 dias', () => {
      expect(determineStatus(2)).toBe('urgent')
    })

    it('retorna "scheduled" para 3+ dias', () => {
      expect(determineStatus(3)).toBe('scheduled')
      expect(determineStatus(5)).toBe('scheduled')
      expect(determineStatus(100)).toBe('scheduled')
    })
  })

  describe('processUser', () => {
    const validUser: MonitoredUser = {
      id: 1,
      name: 'João Silva',
      cpf: '12345678901',
      active: true,
      last_verified_date: '2025/11/20 10:00:00',
      verify_frequency_in_days: 3
    }

    it('processa usuário válido corretamente', () => {
      const result = processUser(validUser, FIXED_NOW)

      expect(result).not.toBeNull()
      expect(result?.id).toBe(1)
      expect(result?.name).toBe('João Silva')
      expect(result?.cpfDigits).toBe('12345678901')
      expect(result?.nameLower).toBe('joão silva')
      expect(result?.nextVisitDate).toBeInstanceOf(Date)
    })

    it('retorna null para frequency <= 0', () => {
      expect(processUser({ ...validUser, verify_frequency_in_days: 0 }, FIXED_NOW)).toBeNull()
      expect(processUser({ ...validUser, verify_frequency_in_days: -1 }, FIXED_NOW)).toBeNull()
    })

    it('retorna null para data inválida', () => {
      expect(processUser({ ...validUser, last_verified_date: 'invalid' }, FIXED_NOW)).toBeNull()
      expect(processUser({ ...validUser, last_verified_date: '' }, FIXED_NOW)).toBeNull()
    })

    it('classifica usuário atrasado com daysOverdue', () => {
      const result = processUser(validUser, FIXED_NOW)
      expect(result?.status).toBe('overdue')
      expect(result?.daysOverdue).toBeGreaterThan(0)
    })

    it('classifica usuário urgente com daysRemaining', () => {
      const urgentUser: MonitoredUser = {
        ...validUser,
        last_verified_date: '2025/11/25 12:00:00',
        verify_frequency_in_days: 1
      }
      const result = processUser(urgentUser, FIXED_NOW)
      expect(result?.status).toBe('urgent')
      expect(result?.daysRemaining).toBeGreaterThanOrEqual(0)
      expect(result?.daysRemaining).toBeLessThanOrEqual(2)
    })

    it('classifica usuário agendado com daysRemaining', () => {
      const scheduledUser: MonitoredUser = {
        ...validUser,
        last_verified_date: '2025/11/25 10:00:00',
        verify_frequency_in_days: 10
      }
      const result = processUser(scheduledUser, FIXED_NOW)
      expect(result?.status).toBe('scheduled')
      expect(result?.daysRemaining).toBeGreaterThanOrEqual(3)
    })

    it('extrai apenas dígitos do CPF', () => {
      const userWithFormattedCPF: MonitoredUser = {
        ...validUser,
        cpf: '123.456.789-01'
      }
      const result = processUser(userWithFormattedCPF, FIXED_NOW)

      expect(result?.cpfDigits).toBe('12345678901')
    })

    it('converte nome para lowercase', () => {
      const userWithUppercase: MonitoredUser = {
        ...validUser,
        name: 'MARIA SANTOS'
      }
      const result = processUser(userWithUppercase, FIXED_NOW)

      expect(result?.nameLower).toBe('maria santos')
    })
  })

  describe('formatDate', () => {
    it('formata data no padrão brasileiro DD/MM/YYYY HH:mm', () => {
      const date = new Date('2025-11-25T14:30:00')
      const result = formatDate(date)

      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/)
      expect(result).toContain('25/')
      expect(result).toContain('/2025')
    })

    it('adiciona zero à esquerda para dia/mês/hora/minuto menor que 10', () => {
      const date = new Date('2025-01-05T09:05:00')
      const result = formatDate(date)

      expect(result).toBe('05/01/2025 09:05')
    })
  })

  describe('formatCPF', () => {
    it('formata CPF com 11 dígitos corretamente', () => {
      expect(formatCPF('12345678901')).toBe('123.456.789-01')
    })

    it('retorna original se não tiver 11 dígitos', () => {
      expect(formatCPF('1234567890')).toBe('1234567890')
      expect(formatCPF('123456789012')).toBe('123456789012')
    })

    it('remove caracteres não-numéricos antes de formatar', () => {
      expect(formatCPF('123.456.789-01')).toBe('123.456.789-01')
    })

    it('lida com CPF vazio', () => {
      expect(formatCPF('')).toBe('')
    })
  })

  describe('sortOverdue', () => {
    it('ordena por daysOverdue decrescente (mais atrasado primeiro)', () => {
      const users: ProcessedUser[] = [
        createOverdueUser(1, 2),
        createOverdueUser(2, 5),
        createOverdueUser(3, 3)
      ]

      const sorted = sortOverdue(users)

      expect(sorted[0].id).toBe(2)
      expect(sorted[1].id).toBe(3)
      expect(sorted[2].id).toBe(1)
    })

    it('retorna array vazio para input vazio', () => {
      expect(sortOverdue([])).toEqual([])
    })

    it('retorna mesmo elemento para array de 1', () => {
      const users = [createOverdueUser(1, 5)]
      const sorted = sortOverdue(users)

      expect(sorted).toHaveLength(1)
      expect(sorted[0].id).toBe(1)
    })

    it('não modifica array original', () => {
      const users: ProcessedUser[] = [
        createOverdueUser(1, 2),
        createOverdueUser(2, 5)
      ]
      const original = [...users]
      sortOverdue(users)

      expect(users[0].id).toBe(original[0].id)
    })
  })

  describe('sortUrgent', () => {
    it('ordena por daysRemaining crescente (menor primeiro)', () => {
      const users: ProcessedUser[] = [
        createUrgentUser(1, 2),
        createUrgentUser(2, 0),
        createUrgentUser(3, 1)
      ]

      const sorted = sortUrgent(users)

      expect(sorted[0].id).toBe(2)
      expect(sorted[1].id).toBe(3)
      expect(sorted[2].id).toBe(1)
    })

    it('retorna array vazio para input vazio', () => {
      expect(sortUrgent([])).toEqual([])
    })
  })

  describe('sortScheduled', () => {
    it('ordena por nextVisitDate crescente (mais cedo primeiro)', () => {
      const users: ProcessedUser[] = [
        createScheduledUserWithDate(1, new Date('2025-12-01')),
        createScheduledUserWithDate(2, new Date('2025-11-28')),
        createScheduledUserWithDate(3, new Date('2025-11-30'))
      ]

      const sorted = sortScheduled(users)

      expect(sorted[0].id).toBe(2)
      expect(sorted[1].id).toBe(3)
      expect(sorted[2].id).toBe(1)
    })

    it('retorna array vazio para input vazio', () => {
      expect(sortScheduled([])).toEqual([])
    })
  })

  describe('formatNextVisitRelative', () => {
    it('retorna "hoje" para 0 dias', () => {
      expect(formatNextVisitRelative(new Date(), 0)).toBe('hoje')
    })

    it('retorna "amanhã" para 1 dia', () => {
      expect(formatNextVisitRelative(new Date(), 1)).toBe('amanhã')
    })

    it('retorna "em 2 dias" para 2 dias', () => {
      expect(formatNextVisitRelative(new Date(), 2)).toBe('em 2 dias')
    })

    it('retorna "Xd atrás" para dias negativos', () => {
      expect(formatNextVisitRelative(new Date(), -3)).toBe('3d atrás')
    })

    it('retorna "em Xd" para 3+ dias', () => {
      expect(formatNextVisitRelative(new Date(), 5)).toBe('em 5d')
    })
  })
})

function createOverdueUser(id: number, daysOverdue: number): ProcessedUser {
  return {
    id,
    name: `Usuário ${id}`,
    cpf: '12345678901',
    active: true,
    last_verified_date: '2025/11/20 10:00:00',
    verify_frequency_in_days: 3,
    nextVisitDate: new Date(),
    lastVerifiedDateObj: new Date(),
    cpfDigits: '12345678901',
    nameLower: `usuário ${id}`,
    status: 'overdue',
    daysOverdue,
    daysRemaining: 0
  }
}

function createUrgentUser(id: number, daysRemaining: number): ProcessedUser {
  return {
    id,
    name: `Usuário ${id}`,
    cpf: '12345678901',
    active: true,
    last_verified_date: '2025/11/24 10:00:00',
    verify_frequency_in_days: 3,
    nextVisitDate: new Date(),
    lastVerifiedDateObj: new Date(),
    cpfDigits: '12345678901',
    nameLower: `usuário ${id}`,
    status: 'urgent',
    daysOverdue: 0,
    daysRemaining
  }
}

function createScheduledUserWithDate(id: number, nextVisitDate: Date): ProcessedUser {
  return {
    id,
    name: `Usuário ${id}`,
    cpf: '12345678901',
    active: true,
    last_verified_date: '2025/11/20 10:00:00',
    verify_frequency_in_days: 10,
    nextVisitDate,
    lastVerifiedDateObj: new Date(),
    cpfDigits: '12345678901',
    nameLower: `usuário ${id}`,
    status: 'scheduled',
    daysOverdue: 0,
    daysRemaining: 5
  }
}
