import { MonitoredUser } from '../../types/monitor'

export function createDateString(daysAgo: number, hoursAgo: number = 0): string {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  date.setHours(date.getHours() - hoursAgo)

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`
}

export const mockUsers: MonitoredUser[] = [
  { id: 1, name: 'João Silva', cpf: '12345678901', active: true, last_verified_date: '2025/11/20 10:00:00', verify_frequency_in_days: 3 },
  { id: 2, name: 'Maria Santos', cpf: '98765432100', active: true, last_verified_date: '2025/11/25 08:00:00', verify_frequency_in_days: 7 },
  { id: 3, name: 'Pedro Oliveira', cpf: '11122233344', active: true, last_verified_date: '2025/11/24 14:00:00', verify_frequency_in_days: 2 },
  { id: 4, name: 'Ana Costa', cpf: '55566677788', active: false, last_verified_date: '2025/11/23 09:00:00', verify_frequency_in_days: 5 },
  { id: 5, name: 'Carlos Mendes', cpf: '99988877766', active: true, last_verified_date: '2025/11/15 16:00:00', verify_frequency_in_days: 3 }
]

export const invalidUsers: MonitoredUser[] = [
  { id: 100, name: 'Usuário Inválido', cpf: '00000000000', active: true, last_verified_date: 'invalid-date', verify_frequency_in_days: 5 },
  { id: 101, name: 'Frequência Zero', cpf: '11111111111', active: true, last_verified_date: '2025/11/25 10:00:00', verify_frequency_in_days: 0 },
  { id: 102, name: 'Frequência Negativa', cpf: '22222222222', active: true, last_verified_date: '2025/11/25 10:00:00', verify_frequency_in_days: -5 }
]

export function createMockUser(overrides: Partial<MonitoredUser> = {}): MonitoredUser {
  return {
    id: Math.floor(Math.random() * 10000),
    name: 'Usuário Teste',
    cpf: '12345678901',
    active: true,
    last_verified_date: createDateString(0),
    verify_frequency_in_days: 7,
    ...overrides
  }
}

export function createOverdueUser(idOrDays: number = 5, name?: string): MonitoredUser {
  const daysOverdue = name ? idOrDays : 5
  const id = name ? idOrDays : 1000 + daysOverdue
  return createMockUser({
    id,
    name: name || `Usuário Atrasado ${daysOverdue}d`,
    last_verified_date: createDateString(daysOverdue + 3),
    verify_frequency_in_days: 3
  })
}

export function createUrgentUser(idOrDays: number = 1, name?: string): MonitoredUser {
  const frequency = 7
  const daysRemaining = name ? 1 : idOrDays
  const daysAgo = frequency - daysRemaining
  const id = name ? idOrDays : 2000 + daysRemaining
  return createMockUser({
    id,
    name: name || `Usuário Urgente ${daysRemaining}d`,
    last_verified_date: createDateString(daysAgo),
    verify_frequency_in_days: frequency
  })
}

export function createScheduledUser(idOrDays: number = 5, name?: string): MonitoredUser {
  const frequency = 10
  const daysRemaining = name ? 5 : idOrDays
  const daysAgo = frequency - daysRemaining
  const id = name ? idOrDays : 3000 + daysRemaining
  return createMockUser({
    id,
    name: name || `Usuário Programado ${daysRemaining}d`,
    last_verified_date: createDateString(daysAgo),
    verify_frequency_in_days: frequency
  })
}
