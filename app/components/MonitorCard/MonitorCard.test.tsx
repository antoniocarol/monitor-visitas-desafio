import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MonitorCard } from './index'
import { createTestUser } from '../../__tests__/factories/createTestUser'

describe('MonitorCard', () => {
  const mockOnRegisterVisit = vi.fn()
  const mockOnToggleSelection = vi.fn()
  const mockOnLongPress = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Renderização básica', () => {
    it('renderiza nome do usuário', () => {
      const user = createTestUser({ name: 'Maria Santos' })
      render(<MonitorCard user={user} onRegisterVisit={mockOnRegisterVisit} />)

      expect(screen.getByText('Maria Santos')).toBeInTheDocument()
    })

    it('renderiza CPF formatado', () => {
      const user = createTestUser({ cpf: '12345678901' })
      render(<MonitorCard user={user} onRegisterVisit={mockOnRegisterVisit} />)
      expect(screen.getByText(/123\.456\.789-01/)).toBeInTheDocument()
    })

    it('renderiza frequência de verificação', () => {
      const user = createTestUser({ verify_frequency_in_days: 7 })
      render(<MonitorCard user={user} onRegisterVisit={mockOnRegisterVisit} />)

      expect(screen.getByText(/A cada 7 dias/)).toBeInTheDocument()
    })
  })

  describe('Status badges', () => {
    it('renderiza badge de status overdue', () => {
      const user = createTestUser({ status: 'overdue', daysOverdue: 5 })
      render(<MonitorCard user={user} onRegisterVisit={mockOnRegisterVisit} />)
      expect(screen.getByText(/5d atraso/)).toBeInTheDocument()
    })

    it('renderiza badge "HOJE" para urgente com 0 dias', () => {
      const user = createTestUser({ status: 'urgent', daysRemaining: 0 })
      render(<MonitorCard user={user} onRegisterVisit={mockOnRegisterVisit} />)

      expect(screen.getAllByText(/hoje/i).length).toBeGreaterThan(0)
    })

    it('renderiza badge para scheduled', () => {
      const user = createTestUser({ status: 'scheduled', daysRemaining: 5 })
      render(<MonitorCard user={user} onRegisterVisit={mockOnRegisterVisit} />)
      expect(screen.getAllByText(/em 5d/i).length).toBeGreaterThan(0)
    })
  })

  describe('Botão de registro de visita', () => {
    it('renderiza botão "Registrar Visita"', () => {
      const user = createTestUser()
      render(<MonitorCard user={user} onRegisterVisit={mockOnRegisterVisit} />)

      expect(screen.getByRole('button', { name: /registrar visita/i })).toBeInTheDocument()
    })

    it('chama onRegisterVisit quando botão é clicado', async () => {
      const user = createTestUser({ id: 42 })
      render(<MonitorCard user={user} onRegisterVisit={mockOnRegisterVisit} />)

      const button = screen.getByRole('button', { name: /registrar visita/i })
      await userEvent.click(button)

      expect(mockOnRegisterVisit).toHaveBeenCalledWith(42)
    })

    it('mostra estado de loading durante registro', async () => {
      const slowRegister = vi.fn().mockImplementation(() => new Promise(() => {}))
      const user = createTestUser()

      render(<MonitorCard user={user} onRegisterVisit={slowRegister} />)

      const button = screen.getByRole('button', { name: /registrar visita/i })
      await userEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText(/registrando/i)).toBeInTheDocument()
      })
    })

    it('desabilita botão durante loading', async () => {
      const slowRegister = vi.fn().mockImplementation(() => new Promise(() => {}))
      const user = createTestUser()

      render(<MonitorCard user={user} onRegisterVisit={slowRegister} />)

      const button = screen.getByRole('button', { name: /registrar visita/i })
      await userEvent.click(button)

      await waitFor(() => {
        expect(button).toBeDisabled()
      })
    })
  })

  describe('Modo seleção', () => {
    it('não renderiza botão de registro em modo seleção', () => {
      const user = createTestUser()
      render(
        <MonitorCard
          user={user}
          onRegisterVisit={mockOnRegisterVisit}
          isSelectionMode={true}
        />
      )

      expect(screen.queryByRole('button', { name: /registrar visita/i })).not.toBeInTheDocument()
    })

    it('renderiza checkbox em modo seleção', () => {
      const { container } = render(
        <MonitorCard
          user={createTestUser()}
          onRegisterVisit={mockOnRegisterVisit}
          isSelectionMode={true}
          isSelected={false}
          onToggleSelection={mockOnToggleSelection}
        />
      )

      const checkbox = container.querySelector('button.h-7.w-7')
      expect(checkbox).toBeInTheDocument()
    })

    it('mostra checkbox marcado quando selecionado', () => {
      const { container } = render(
        <MonitorCard
          user={createTestUser()}
          onRegisterVisit={mockOnRegisterVisit}
          isSelectionMode={true}
          isSelected={true}
          onToggleSelection={mockOnToggleSelection}
        />
      )

      const checkbox = container.querySelector('button.bg-red-500')
      expect(checkbox).toBeInTheDocument()
    })

    it('chama onToggleSelection quando checkbox é clicado', async () => {
      const { container } = render(
        <MonitorCard
          user={createTestUser({ id: 99 })}
          onRegisterVisit={mockOnRegisterVisit}
          isSelectionMode={true}
          isSelected={false}
          onToggleSelection={mockOnToggleSelection}
        />
      )

      const checkbox = container.querySelector('button.h-7.w-7')!
      await userEvent.click(checkbox)

      expect(mockOnToggleSelection).toHaveBeenCalledWith(99)
    })

    it('chama onToggleSelection ao clicar no card em modo seleção', async () => {
      const user = createTestUser({ id: 77 })
      const { container } = render(
        <MonitorCard
          user={user}
          onRegisterVisit={mockOnRegisterVisit}
          isSelectionMode={true}
          isSelected={false}
          onToggleSelection={mockOnToggleSelection}
        />
      )
      const card = container.querySelector('article')
      if (card) {
        await userEvent.click(card)
      }
      expect(mockOnToggleSelection).toHaveBeenCalledWith(77)
    })
  })

  describe('Long press', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    it('não ativa long press se em modo seleção', () => {
      const user = createTestUser({ id: 55 })
      const { container } = render(
        <MonitorCard
          user={user}
          onRegisterVisit={mockOnRegisterVisit}
          isSelectionMode={true}
          onLongPress={mockOnLongPress}
        />
      )

      const card = container.querySelector('article')
      if (card) {
        fireEvent.pointerDown(card)
        vi.advanceTimersByTime(600)
        fireEvent.pointerUp(card)
      }

      expect(mockOnLongPress).not.toHaveBeenCalled()
    })
  })

  describe('Acessibilidade', () => {
    it('tem role option em modo seleção', () => {
      const { container } = render(
        <MonitorCard
          user={createTestUser({ name: 'Ana Costa', status: 'overdue' })}
          onRegisterVisit={mockOnRegisterVisit}
          isSelectionMode={true}
          isSelected={false}
        />
      )

      const card = container.querySelector('article')
      expect(card).toHaveAttribute('role', 'option')
    })

    it('tem aria-selected em modo seleção', () => {
      const { container } = render(
        <MonitorCard
          user={createTestUser()}
          onRegisterVisit={mockOnRegisterVisit}
          isSelectionMode={true}
          isSelected={true}
        />
      )

      const card = container.querySelector('article')
      expect(card).toHaveAttribute('aria-selected', 'true')
    })

    it('botão fica desabilitado durante loading', async () => {
      const slowRegister = vi.fn().mockImplementation(() => new Promise(() => {}))

      render(<MonitorCard user={createTestUser()} onRegisterVisit={slowRegister} />)

      const button = screen.getByRole('button', { name: /registrar visita/i })
      await userEvent.click(button)

      await waitFor(() => {
        expect(button).toBeDisabled()
      })
    })
  })

  describe('Interação via teclado', () => {
    it('responde a Enter para registrar visita', async () => {
      const user = createTestUser({ id: 33 })
      render(<MonitorCard user={user} onRegisterVisit={mockOnRegisterVisit} />)

      const card = screen.getByRole('article')
      card.focus()

      fireEvent.keyDown(card, { key: 'Enter' })

      expect(mockOnRegisterVisit).toHaveBeenCalledWith(33)
    })

    it('responde a Space para toggle em modo seleção', async () => {
      const user = createTestUser({ id: 44 })
      const { container } = render(
        <MonitorCard
          user={user}
          onRegisterVisit={mockOnRegisterVisit}
          isSelectionMode={true}
          isSelected={false}
          onToggleSelection={mockOnToggleSelection}
        />
      )

      const card = container.querySelector('article')
      expect(card).toBeInTheDocument()
      card?.focus()

      fireEvent.keyDown(card!, { key: ' ' })

      expect(mockOnToggleSelection).toHaveBeenCalledWith(44)
    })
  })
})
