import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmationModal } from './index'
import { ProcessedUser, MonitorStatus } from '../../types/monitor'
import { createTestUser } from '../../__tests__/factories/createTestUser'

const createUser = (id: number, status: MonitorStatus, name = `Usuário ${id}`): ProcessedUser =>
  createTestUser({ id, status, name })

describe('ConfirmationModal', () => {
  const mockOnConfirm = vi.fn()
  const mockOnCancel = vi.fn()

  const defaultProps = {
    isOpen: true,
    users: [createUser(1, 'overdue', 'João Silva')],
    onConfirm: mockOnConfirm,
    onCancel: mockOnCancel,
    loading: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    document.body.style.overflow = ''
  })

  afterEach(() => {
    document.body.style.overflow = ''
  })

  describe('Visibilidade', () => {
    it('não renderiza quando isOpen é false', () => {
      render(<ConfirmationModal {...defaultProps} isOpen={false} />)

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('renderiza quando isOpen é true', () => {
      render(<ConfirmationModal {...defaultProps} isOpen={true} />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })

  describe('Conteúdo', () => {
    it('mostra título "Confirmar Registro"', () => {
      render(<ConfirmationModal {...defaultProps} />)

      expect(screen.getByText('Confirmar Registro')).toBeInTheDocument()
    })

    it('mostra contagem de usuários correta (singular)', () => {
      render(<ConfirmationModal {...defaultProps} users={[createUser(1, 'overdue')]} />)
      expect(screen.getByText(/monitorado:/)).toBeInTheDocument()
    })

    it('mostra contagem de usuários correta (plural)', () => {
      const users = [
        createUser(1, 'overdue'),
        createUser(2, 'urgent'),
        createUser(3, 'scheduled'),
      ]
      render(<ConfirmationModal {...defaultProps} users={users} />)
      expect(screen.getByText(/monitorados:/)).toBeInTheDocument()
    })

    it('lista nomes de todos os usuários', () => {
      const users = [
        createUser(1, 'overdue', 'João Silva'),
        createUser(2, 'urgent', 'Maria Santos'),
        createUser(3, 'scheduled', 'Pedro Oliveira'),
      ]
      render(<ConfirmationModal {...defaultProps} users={users} />)

      expect(screen.getByText('João Silva')).toBeInTheDocument()
      expect(screen.getByText('Maria Santos')).toBeInTheDocument()
      expect(screen.getByText('Pedro Oliveira')).toBeInTheDocument()
    })

    it('mostra status "Xd atraso" para usuário overdue', () => {
      const overdueUser = createUser(1, 'overdue')
      render(<ConfirmationModal {...defaultProps} users={[overdueUser]} />)

      expect(screen.getByText(/5d atraso/i)).toBeInTheDocument()
    })

    it('mostra status "hoje" para usuário urgent com 0 dias', () => {
      const urgentUser: ProcessedUser = {
        ...createUser(1, 'urgent'),
        daysRemaining: 0,
      }
      render(<ConfirmationModal {...defaultProps} users={[urgentUser]} />)

      expect(screen.getByText(/\(hoje\)/i)).toBeInTheDocument()
    })

    it('mostra status "amanhã" para usuário urgent com 1 dia', () => {
      const urgentUser: ProcessedUser = {
        ...createUser(1, 'urgent'),
        daysRemaining: 1,
      }
      render(<ConfirmationModal {...defaultProps} users={[urgentUser]} />)

      expect(screen.getByText(/\(amanhã\)/i)).toBeInTheDocument()
    })

    it('mostra status "em Xd" para usuário scheduled', () => {
      const scheduledUser = createUser(1, 'scheduled')
      render(<ConfirmationModal {...defaultProps} users={[scheduledUser]} />)

      expect(screen.getByText(/em 7d/i)).toBeInTheDocument()
    })

    it('mostra aviso para usuários atrasados', () => {
      render(<ConfirmationModal {...defaultProps} users={[createUser(1, 'overdue')]} />)

      expect(
        screen.getByText(/Alguns monitorados estão com visitas atrasadas/i)
      ).toBeInTheDocument()
    })

    it('não mostra aviso quando não há usuários atrasados', () => {
      render(<ConfirmationModal {...defaultProps} users={[createUser(1, 'scheduled')]} />)

      expect(
        screen.queryByText(/Alguns monitorados estão com visitas atrasadas/i)
      ).not.toBeInTheDocument()
    })
  })

  describe('Botões', () => {
    it('renderiza botão "Cancelar"', () => {
      render(<ConfirmationModal {...defaultProps} />)

      expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument()
    })

    it('renderiza botão "Confirmar"', () => {
      render(<ConfirmationModal {...defaultProps} />)

      expect(screen.getByRole('button', { name: /confirmar/i })).toBeInTheDocument()
    })

    it('chama onCancel ao clicar em Cancelar', async () => {
      render(<ConfirmationModal {...defaultProps} />)

      const cancelButton = screen.getByRole('button', { name: /cancelar/i })
      await userEvent.click(cancelButton)

      expect(mockOnCancel).toHaveBeenCalledTimes(1)
    })

    it('chama onConfirm ao clicar em Confirmar', async () => {
      render(<ConfirmationModal {...defaultProps} />)

      const confirmButton = screen.getByRole('button', { name: /confirmar/i })
      await userEvent.click(confirmButton)

      expect(mockOnConfirm).toHaveBeenCalledTimes(1)
    })

    it('desabilita botões durante loading', () => {
      render(<ConfirmationModal {...defaultProps} loading={true} />)

      const cancelButton = screen.getByRole('button', { name: /cancelar/i })
      const confirmButton = screen.getByRole('button', { name: /registrando/i })

      expect(cancelButton).toBeDisabled()
      expect(confirmButton).toBeDisabled()
    })

    it('mostra spinner e texto "Registrando..." durante loading', () => {
      render(<ConfirmationModal {...defaultProps} loading={true} />)

      expect(screen.getByText('Registrando...')).toBeInTheDocument()
    })

    it('mostra texto "Confirmar" quando não está em loading', () => {
      render(<ConfirmationModal {...defaultProps} loading={false} />)

      expect(screen.getByRole('button', { name: /confirmar/i })).toHaveTextContent('Confirmar')
    })
  })

  describe('Interação com backdrop', () => {
    it('chama onCancel ao clicar no backdrop quando não está em loading', async () => {
      render(<ConfirmationModal {...defaultProps} loading={false} />)
      const backdrop = screen.getByRole('dialog').previousElementSibling as HTMLElement
      await userEvent.click(backdrop)
      expect(mockOnCancel).toHaveBeenCalledTimes(1)
    })

    it('não chama onCancel ao clicar no backdrop durante loading', async () => {
      render(<ConfirmationModal {...defaultProps} loading={true} />)

      const backdrop = screen.getByRole('dialog').previousElementSibling as HTMLElement
      await userEvent.click(backdrop)

      expect(mockOnCancel).not.toHaveBeenCalled()
    })
  })

  describe('Interação com teclado', () => {
    it('fecha modal ao pressionar ESC quando não está em loading', () => {
      render(<ConfirmationModal {...defaultProps} loading={false} />)

      fireEvent.keyDown(document, { key: 'Escape' })

      expect(mockOnCancel).toHaveBeenCalledTimes(1)
    })

    it('não fecha modal ao pressionar ESC durante loading', () => {
      render(<ConfirmationModal {...defaultProps} loading={true} />)

      fireEvent.keyDown(document, { key: 'Escape' })

      expect(mockOnCancel).not.toHaveBeenCalled()
    })

    it('não responde a outras teclas', () => {
      render(<ConfirmationModal {...defaultProps} />)

      fireEvent.keyDown(document, { key: 'Enter' })
      fireEvent.keyDown(document, { key: 'Tab' })
      fireEvent.keyDown(document, { key: 'a' })

      expect(mockOnCancel).not.toHaveBeenCalled()
    })
  })

  describe('Acessibilidade', () => {
    it('tem role="dialog"', () => {
      render(<ConfirmationModal {...defaultProps} />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('tem aria-modal="true"', () => {
      render(<ConfirmationModal {...defaultProps} />)

      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
    })

    it('mostra título do modal', () => {
      render(<ConfirmationModal {...defaultProps} />)

      expect(screen.getByText('Confirmar Registro')).toBeInTheDocument()
    })

    it('tem botão para fechar o modal', () => {
      const { container } = render(<ConfirmationModal {...defaultProps} />)

      const closeButton = container.querySelector('button svg')
      expect(closeButton).toBeInTheDocument()
    })
  })

  describe('Bloqueio de scroll', () => {
    it('bloqueia scroll do body quando aberto', () => {
      render(<ConfirmationModal {...defaultProps} isOpen={true} />)

      expect(document.body.style.overflow).toBe('hidden')
    })

    it('restaura scroll do body quando fechado', () => {
      const { rerender } = render(<ConfirmationModal {...defaultProps} isOpen={true} />)

      expect(document.body.style.overflow).toBe('hidden')

      rerender(<ConfirmationModal {...defaultProps} isOpen={false} />)

      expect(document.body.style.overflow).toBe('')
    })
  })

  describe('Foco', () => {
    it('foca no botão Confirmar ao abrir', async () => {
      render(<ConfirmationModal {...defaultProps} />)

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /confirmar/i })
        expect(document.activeElement).toBe(confirmButton)
      })
    })
  })

  describe('Cores de status', () => {
    it('aplica cor vermelha para status overdue', () => {
      render(<ConfirmationModal {...defaultProps} users={[createUser(1, 'overdue')]} />)

      const statusText = screen.getByText(/5d atraso/i)
      expect(statusText).toHaveClass('text-red-400')
    })

    it('aplica cor amarela para status urgent', () => {
      const urgentUser: ProcessedUser = {
        ...createUser(1, 'urgent'),
        daysRemaining: 0,
      }
      render(<ConfirmationModal {...defaultProps} users={[urgentUser]} />)

      const statusText = screen.getByText(/\(hoje\)/i)
      expect(statusText).toHaveClass('text-yellow-400')
    })

    it('aplica cor verde para status scheduled', () => {
      render(<ConfirmationModal {...defaultProps} users={[createUser(1, 'scheduled')]} />)

      const statusText = screen.getByText(/em 7d/i)
      expect(statusText).toHaveClass('text-emerald-400')
    })
  })

  describe('Botão fechar (X)', () => {
    it('chama onCancel ao clicar no X', async () => {
      const { container } = render(<ConfirmationModal {...defaultProps} />)

      const buttons = container.querySelectorAll('button')
      const closeButton = buttons[0]
      await userEvent.click(closeButton)

      expect(mockOnCancel).toHaveBeenCalledTimes(1)
    })

    it('desabilita botão X durante loading', () => {
      const { container } = render(<ConfirmationModal {...defaultProps} loading={true} />)

      const buttons = container.querySelectorAll('button')
      const closeButton = buttons[0]
      expect(closeButton).toBeDisabled()
    })
  })
})
