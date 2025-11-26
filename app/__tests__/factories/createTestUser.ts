import { ProcessedUser, MonitorStatus } from '../../types/monitor'

interface CreateTestUserOptions {
  id?: number
  name?: string
  status?: MonitorStatus
  daysOverdue?: number
  daysRemaining?: number
  cpf?: string
  active?: boolean
  verify_frequency_in_days?: number
}

export function createTestUser(options: CreateTestUserOptions = {}): ProcessedUser {
  const {
    id = 1,
    name = `Usuário ${id}`,
    status = 'overdue',
    daysOverdue = status === 'overdue' ? 5 : 0,
    daysRemaining = status === 'urgent' ? 1 : status === 'scheduled' ? 7 : 0,
    cpf = `${id}`.padStart(11, '0'),
    active = true,
    verify_frequency_in_days = 3,
  } = options

  return {
    id,
    name,
    cpf,
    active,
    last_verified_date: '2025/11/20 10:00:00',
    verify_frequency_in_days,
    nextVisitDate: new Date('2025-11-23'),
    lastVerifiedDateObj: new Date('2025-11-20T10:00:00'),
    cpfDigits: cpf,
    nameLower: name.toLowerCase(),
    status,
    daysOverdue,
    daysRemaining,
  }
}

export function createTestUsers(
  count: number,
  status: MonitorStatus,
  startId = 1
): ProcessedUser[] {
  return Array.from({ length: count }, (_, i) =>
    createTestUser({ id: startId + i, status })
  )
}
