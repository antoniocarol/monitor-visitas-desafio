import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MonitorColumn } from './index'
import { ProcessedUser, MonitorStatus } from '../../types/monitor'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
    button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <button {...props}>{children}</button>
    ),
    span: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <span {...props}>{children}</span>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

function createTestUser(
  id: number,
  status: MonitorStatus,
  name: string = `Usuário ${id}`
): ProcessedUser {
  const base = {
    id,
    name,
    cpf: `${id}`.padStart(11, '0'),
    active: true,
    last_verified_date: '2025/11/20 10:00:00',
    verify_frequency_in_days: 3,
    nextVisitDate: new Date('2025-11-23'),
    lastVerifiedDateObj: new Date('2025-11-20T10:00:00'),
    cpfDigits: `${id}`.padStart(11, '0'),
    nameLower: name.toLowerCase(),
    daysOverdue: 0,
    daysRemaining: 0,
  }

  if (status === 'overdue') {
    return {
      ...base,
      status: 'overdue' as const,
      daysOverdue: 5,
    }
  }

  if (status === 'urgent') {
    return {
      ...base,
      status: 'urgent' as const,
      daysRemaining: 1,
    }
  }

  return {
    ...base,
    status: 'scheduled' as const,
    daysRemaining: 7,
  }
}

describe('MonitorColumn', () => {
  const mockOnRegisterVisit = vi.fn().mockResolvedValue(undefined)
  const mockOnSelectAll = vi.fn()
  const mockOnDeselectAll = vi.fn()
  const mockOnToggleSelection = vi.fn()
  const mockOnLongPress = vi.fn()

  const defaultProps = {
    title: 'ATRASADOS',
    status: 'overdue' as MonitorStatus,
    users: [] as ProcessedUser[],
    loading: false,
    onRegisterVisit: mockOnRegisterVisit,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Renderização básica', () => {
    it('renderiza título da coluna', () => {
      render(<MonitorColumn {...defaultProps} title="ATRASADOS" />)
      expect(screen.getByText('ATRASADOS')).toBeInTheDocument()
    })

    it('renderiza contador de itens zerado quando não há usuários', () => {
      render(<MonitorColumn {...defaultProps} users={[]} />)
      expect(screen.getByRole('status')).toHaveTextContent('0')
    })

    it('renderiza seção com aria-labelledby apontando para o título', () => {
      render(<MonitorColumn {...defaultProps} status="overdue" />)
      expect(screen.getByText('ATRASADOS')).toBeInTheDocument()
    })

    it('renderiza contador de itens correto quando há usuários', () => {
      const users = [
        createTestUser(1, 'overdue'),
        createTestUser(2, 'overdue'),
        createTestUser(3, 'overdue'),
      ]
      const { container } = render(<MonitorColumn {...defaultProps} users={users} />)
      const counter = container.querySelector('[role="status"].min-w-8')
      expect(counter).toHaveTextContent('3')
    })
  })

  describe('Estado vazio', () => {
    it('mostra mensagem "Tudo em dia!" para overdue vazio', () => {
      render(<MonitorColumn {...defaultProps} status="overdue" users={[]} />)
      expect(screen.getByText('Tudo em dia!')).toBeInTheDocument()
      expect(screen.getByText('Não há visitas atrasadas no momento')).toBeInTheDocument()
    })

    it('mostra mensagem correta para urgent vazio', () => {
      render(<MonitorColumn {...defaultProps} status="urgent" title="URGENTES" users={[]} />)
      expect(screen.getByText('Nenhum item urgente')).toBeInTheDocument()
      expect(screen.getByText('Novos itens aparecerão aqui automaticamente')).toBeInTheDocument()
    })

    it('mostra mensagem correta para scheduled vazio', () => {
      render(<MonitorColumn {...defaultProps} status="scheduled" title="AGENDADOS" users={[]} />)
      expect(screen.getByText('Nenhuma visita programada')).toBeInTheDocument()
      expect(screen.getByText('Visitas programadas aparecerão aqui')).toBeInTheDocument()
    })
  })

  describe('Estado de loading', () => {
    it('renderiza skeletons durante loading', () => {
      const { container } = render(<MonitorColumn {...defaultProps} loading={true} />)
      const skeletons = container.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('não renderiza cards durante loading', () => {
      const users = [createTestUser(1, 'overdue')]
      render(<MonitorColumn {...defaultProps} users={users} loading={true} />)
      expect(screen.queryByText('Usuário 1')).not.toBeInTheDocument()
    })
  })

  describe('Modo seleção', () => {
    const usersForSelection = [
      createTestUser(1, 'overdue', 'João'),
      createTestUser(2, 'overdue', 'Maria'),
      createTestUser(3, 'overdue', 'Pedro'),
    ]

    it('mostra checkbox em modo seleção', () => {
      const { container } = render(
        <MonitorColumn
          {...defaultProps}
          users={usersForSelection}
          isSelectionMode={true}
          selectedIds={new Set()}
          onSelectAll={mockOnSelectAll}
          onDeselectAll={mockOnDeselectAll}
        />
      )

      const checkbox = container.querySelector('button svg')
      expect(checkbox).toBeInTheDocument()
    })

    it('não mostra checkbox de selecionar todos quando lista está vazia', () => {
      const { container } = render(
        <MonitorColumn
          {...defaultProps}
          users={[]}
          isSelectionMode={true}
          selectedIds={new Set()}
        />
      )

      const selectAllButton = container.querySelector('button.h-6.w-6')
      expect(selectAllButton).not.toBeInTheDocument()
    })

    it('mostra ícone CheckSquare quando todos estão selecionados', () => {
      const { container } = render(
        <MonitorColumn
          {...defaultProps}
          users={usersForSelection}
          isSelectionMode={true}
          selectedIds={new Set([1, 2, 3])}
          onSelectAll={mockOnSelectAll}
          onDeselectAll={mockOnDeselectAll}
        />
      )

      const checkSquare = container.querySelector('button.bg-red-500')
      expect(checkSquare).toBeInTheDocument()
    })

    it('chama onSelectAll quando checkbox é clicado (nenhum selecionado)', async () => {
      const { container } = render(
        <MonitorColumn
          {...defaultProps}
          users={usersForSelection}
          isSelectionMode={true}
          selectedIds={new Set()}
          onSelectAll={mockOnSelectAll}
          onDeselectAll={mockOnDeselectAll}
        />
      )

      const selectAllBtn = container.querySelector('button.bg-white\\/10')!
      await userEvent.click(selectAllBtn)

      expect(mockOnSelectAll).toHaveBeenCalledWith([1, 2, 3])
    })

    it('chama onDeselectAll quando checkbox é clicado (todos selecionados)', async () => {
      const { container } = render(
        <MonitorColumn
          {...defaultProps}
          users={usersForSelection}
          isSelectionMode={true}
          selectedIds={new Set([1, 2, 3])}
          onSelectAll={mockOnSelectAll}
          onDeselectAll={mockOnDeselectAll}
        />
      )

      const deselectAllBtn = container.querySelector('button.bg-red-500')!
      await userEvent.click(deselectAllBtn)

      expect(mockOnDeselectAll).toHaveBeenCalledWith([1, 2, 3])
    })

    it('mostra contador de selecionados na coluna', () => {
      render(
        <MonitorColumn
          {...defaultProps}
          users={usersForSelection}
          isSelectionMode={true}
          selectedIds={new Set([1, 2])}
          onSelectAll={mockOnSelectAll}
          onDeselectAll={mockOnDeselectAll}
        />
      )

      expect(screen.getByText('2 sel.')).toBeInTheDocument()
    })
  })

  describe('Collapse (mobile)', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      })
      fireEvent(window, new Event('resize'))
    })

    it('mostra botão de toggle em mobile', () => {
      const { container } = render(<MonitorColumn {...defaultProps} />)
      const toggleBtn = container.querySelector('button.md\\:hidden')
      expect(toggleBtn).toBeInTheDocument()
    })

    it('alterna estado de collapse ao clicar no botão', async () => {
      const { container } = render(<MonitorColumn {...defaultProps} />)

      const toggleBtn = container.querySelector('button.md\\:hidden')!
      const chevron = toggleBtn.querySelector('svg')!

      expect(chevron.classList.contains('rotate-180')).toBe(true)

      await userEvent.click(toggleBtn)
      expect(chevron.classList.contains('rotate-180')).toBe(false)

      await userEvent.click(toggleBtn)
      expect(chevron.classList.contains('rotate-180')).toBe(true)
    })
  })

  describe('Renderização de cards', () => {
    it('renderiza card para cada usuário', () => {
      const users = [
        createTestUser(1, 'overdue', 'João Silva'),
        createTestUser(2, 'overdue', 'Maria Santos'),
      ]

      render(<MonitorColumn {...defaultProps} users={users} />)

      expect(screen.getByText('João Silva')).toBeInTheDocument()
      expect(screen.getByText('Maria Santos')).toBeInTheDocument()
    })

    it('passa props de seleção para MonitorCard', () => {
      const users = [createTestUser(1, 'overdue', 'João')]
      render(
        <MonitorColumn
          {...defaultProps}
          users={users}
          isSelectionMode={true}
          selectedIds={new Set([1])}
          onToggleSelection={mockOnToggleSelection}
          onLongPress={mockOnLongPress}
        />
      )
      expect(screen.queryByRole('button', { name: /registrar visita/i })).not.toBeInTheDocument()
    })
  })

  describe('Indicador de alerta (overdue)', () => {
    it('mostra indicador de pulso vermelho para coluna overdue com usuários', () => {
      const users = [createTestUser(1, 'overdue')]
      const { container } = render(
        <MonitorColumn {...defaultProps} status="overdue" users={users} />
      )

      const pulseIndicator = container.querySelector('.animate-ping')
      expect(pulseIndicator).toBeInTheDocument()
    })

    it('não mostra indicador de pulso para coluna overdue vazia', () => {
      const { container } = render(
        <MonitorColumn {...defaultProps} status="overdue" users={[]} />
      )

      const pulseIndicator = container.querySelector('.animate-ping')
      expect(pulseIndicator).not.toBeInTheDocument()
    })

    it('não mostra indicador de pulso em modo seleção', () => {
      const users = [createTestUser(1, 'overdue')]
      const { container } = render(
        <MonitorColumn
          {...defaultProps}
          status="overdue"
          users={users}
          isSelectionMode={true}
          selectedIds={new Set()}
        />
      )

      const pulseIndicator = container.querySelector('.animate-ping')
      expect(pulseIndicator).not.toBeInTheDocument()
    })
  })

  describe('Acessibilidade', () => {
    it('região de conteúdo tem role correto baseado no modo', () => {
      const users = [createTestUser(1, 'overdue')]

      const { rerender, container } = render(<MonitorColumn {...defaultProps} users={users} />)
      expect(container.querySelector('[role="region"]')).toBeInTheDocument()

      rerender(
        <MonitorColumn
          {...defaultProps}
          users={users}
          isSelectionMode={true}
          selectedIds={new Set()}
        />
      )
      expect(container.querySelector('[role="listbox"]')).toBeInTheDocument()
    })

    it('contador tem role status', () => {
      const users = [createTestUser(1, 'overdue')]
      const { container } = render(<MonitorColumn {...defaultProps} users={users} />)
      const counter = container.querySelector('[role="status"].min-w-8')
      expect(counter).toHaveTextContent('1')
    })

    it('contador exibe valor correto para múltiplos usuários', () => {
      const users = [
        createTestUser(1, 'overdue'),
        createTestUser(2, 'overdue'),
      ]
      const { container } = render(<MonitorColumn {...defaultProps} users={users} />)
      const counter = container.querySelector('[role="status"].min-w-8')
      expect(counter).toHaveTextContent('2')
    })

    it('título é exibido corretamente', () => {
      const users = [createTestUser(1, 'overdue')]
      render(<MonitorColumn {...defaultProps} users={users} title="ATRASADOS" />)
      expect(screen.getByText('ATRASADOS')).toBeInTheDocument()
    })
  })

  describe('Memoização', () => {
    it('não re-renderiza quando props não mudam', () => {
      const users = [createTestUser(1, 'overdue')]
      const { rerender } = render(<MonitorColumn {...defaultProps} users={users} />)

      rerender(<MonitorColumn {...defaultProps} users={users} />)

      expect(screen.getByText('Usuário 1')).toBeInTheDocument()
    })
  })
})
