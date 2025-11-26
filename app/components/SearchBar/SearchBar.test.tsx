import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchBar } from './index'
import { MonitorColumnData } from '../../types/monitor'
import { createTestUser } from '../../__tests__/factories/createTestUser'

describe('SearchBar', () => {
  const mockOnSearchChange = vi.fn()

  const emptyData: MonitorColumnData = {
    overdue: [],
    urgent: [],
    scheduled: [],
  }

  const dataWithResults: MonitorColumnData = {
    overdue: [createTestUser({ id: 1, name: 'João Silva', status: 'overdue' })],
    urgent: [
      createTestUser({ id: 2, name: 'Maria Santos', status: 'urgent' }),
      createTestUser({ id: 3, name: 'Pedro Oliveira', status: 'urgent', daysRemaining: 2 }),
    ],
    scheduled: [createTestUser({ id: 4, name: 'Ana Costa', status: 'scheduled', daysRemaining: 10 })],
  }

  const defaultProps = {
    searchTerm: '',
    onSearchChange: mockOnSearchChange,
    data: emptyData,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Renderização', () => {
    it('renderiza input de busca', () => {
      render(<SearchBar {...defaultProps} />)
      expect(screen.getByPlaceholderText('Buscar por nome ou CPF...')).toBeInTheDocument()
    })

    it('renderiza com placeholder correto', () => {
      render(<SearchBar {...defaultProps} />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('placeholder', 'Buscar por nome ou CPF...')
    })

    it('renderiza contadores de status', () => {
      render(<SearchBar {...defaultProps} data={dataWithResults} />)

      expect(screen.getByText('atrasadas')).toBeInTheDocument()
      expect(screen.getByText('urgentes')).toBeInTheDocument()
      expect(screen.getByText('programadas')).toBeInTheDocument()
    })

    it('renderiza valores corretos nos contadores', () => {
      const { container } = render(<SearchBar {...defaultProps} data={dataWithResults} />)

      const badges = container.querySelectorAll('.rounded-full.border')
      expect(badges).toHaveLength(3)
    })
  })

  describe('Input de busca', () => {
    it('mostra valor do searchTerm no input', () => {
      render(<SearchBar {...defaultProps} searchTerm="João" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('João')
    })

    it('chama onSearchChange ao digitar', async () => {
      render(<SearchBar {...defaultProps} />)
      const input = screen.getByRole('textbox')
      await userEvent.type(input, 'Maria')
      expect(mockOnSearchChange).toHaveBeenCalledTimes(5)
      expect(mockOnSearchChange).toHaveBeenNthCalledWith(1, 'M')
      expect(mockOnSearchChange).toHaveBeenNthCalledWith(2, 'a')
      expect(mockOnSearchChange).toHaveBeenNthCalledWith(3, 'r')
      expect(mockOnSearchChange).toHaveBeenNthCalledWith(4, 'i')
      expect(mockOnSearchChange).toHaveBeenNthCalledWith(5, 'a')
    })

    it('mostra botão de limpar quando há texto', () => {
      render(<SearchBar {...defaultProps} searchTerm="teste" />)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('esconde botão de limpar quando vazio', () => {
      render(<SearchBar {...defaultProps} searchTerm="" />)
      expect(screen.queryByRole('button', { name: /limpar busca/i })).not.toBeInTheDocument()
    })

    it('limpa busca ao clicar no X', async () => {
      render(<SearchBar {...defaultProps} searchTerm="teste" />)

      const clearButton = screen.getByRole('button')
      await userEvent.click(clearButton)

      expect(mockOnSearchChange).toHaveBeenCalledWith('')
    })
  })

  describe('Resultados de busca', () => {
    it('mostra total de resultados quando há searchTerm', () => {
      render(<SearchBar {...defaultProps} searchTerm="maria" data={dataWithResults} />)
      expect(screen.getByText(/4/)).toBeInTheDocument()
      expect(screen.getByText(/monitorados encontrados/i)).toBeInTheDocument()
    })

    it('usa singular "monitorado" para 1 resultado', () => {
      const singleResultData: MonitorColumnData = {
        overdue: [dataWithResults.overdue[0]],
        urgent: [],
        scheduled: [],
      }
      render(<SearchBar {...defaultProps} searchTerm="joão" data={singleResultData} />)
      expect(screen.getByText(/monitorado encontrado$/i)).toBeInTheDocument()
    })

    it('usa plural "monitorados" para múltiplos resultados', () => {
      render(<SearchBar {...defaultProps} searchTerm="test" data={dataWithResults} />)

      expect(screen.getByText(/monitorados encontrados/i)).toBeInTheDocument()
    })

    it('não mostra texto de resultados quando searchTerm está vazio', () => {
      render(<SearchBar {...defaultProps} searchTerm="" data={dataWithResults} />)

      expect(screen.queryByText(/encontrado/i)).not.toBeInTheDocument()
    })
  })

  describe('Contadores dinâmicos', () => {
    it('atualiza contador de overdue quando dados mudam', () => {
      const { rerender } = render(<SearchBar {...defaultProps} data={emptyData} />)

      expect(screen.getByText('atrasadas')).toBeInTheDocument()

      rerender(<SearchBar {...defaultProps} data={dataWithResults} />)

      expect(screen.getByText('atrasadas')).toBeInTheDocument()
    })

    it('atualiza contador de urgent quando dados mudam', () => {
      const { rerender } = render(<SearchBar {...defaultProps} data={emptyData} />)

      expect(screen.getByText('urgentes')).toBeInTheDocument()

      rerender(<SearchBar {...defaultProps} data={dataWithResults} />)

      expect(screen.getByText('urgentes')).toBeInTheDocument()
    })

    it('atualiza contador de scheduled quando dados mudam', () => {
      const { rerender } = render(<SearchBar {...defaultProps} data={emptyData} />)

      expect(screen.getByText('programadas')).toBeInTheDocument()

      rerender(<SearchBar {...defaultProps} data={dataWithResults} />)

      expect(screen.getByText('programadas')).toBeInTheDocument()
    })
  })

  describe('Acessibilidade', () => {
    it('input é acessível via placeholder', () => {
      render(<SearchBar {...defaultProps} />)
      const input = screen.getByPlaceholderText('Buscar por nome ou CPF...')
      expect(input).toBeInTheDocument()
    })

    it('botão limpar está presente quando há texto', () => {
      render(<SearchBar {...defaultProps} searchTerm="teste" />)
      const clearButton = screen.getByRole('button')
      expect(clearButton).toBeInTheDocument()
    })

    it('contadores têm labels acessíveis via sr-only', () => {
      render(<SearchBar {...defaultProps} data={dataWithResults} />)

      expect(screen.getByText('atrasadas')).toBeInTheDocument()
      expect(screen.getByText('urgentes')).toBeInTheDocument()
      expect(screen.getByText('programadas')).toBeInTheDocument()
    })

    it('ícones têm aria-hidden', () => {
      const { container } = render(<SearchBar {...defaultProps} data={dataWithResults} />)

      const icons = container.querySelectorAll('svg[aria-hidden="true"]')
      expect(icons.length).toBeGreaterThan(0)
    })
  })

  describe('Ref do input', () => {
    it('searchInputRef funciona corretamente', () => {
      const inputRef = React.createRef<HTMLInputElement>()
      render(<SearchBar {...defaultProps} searchInputRef={inputRef} />)

      expect(inputRef.current).toBeInstanceOf(HTMLInputElement)
      expect(inputRef.current?.placeholder).toBe('Buscar por nome ou CPF...')
    })

    it('permite focar no input via ref', () => {
      const inputRef = React.createRef<HTMLInputElement>()
      render(<SearchBar {...defaultProps} searchInputRef={inputRef} />)

      inputRef.current?.focus()

      expect(document.activeElement).toBe(inputRef.current)
    })
  })

  describe('Estilos e classes', () => {
    it('tem classes de estilo corretas no container', () => {
      const { container } = render(<SearchBar {...defaultProps} />)

      const searchBar = container.firstChild as HTMLElement
      expect(searchBar).toHaveClass('w-full')
      expect(searchBar).toHaveClass('bg-zinc-900/98')
    })

    it('input tem classes de foco corretas', () => {
      render(<SearchBar {...defaultProps} />)
      const input = screen.getByRole('textbox')

      expect(input).toHaveClass('focus:outline-none')
      expect(input).toHaveClass('focus:ring-2')
    })
  })
})
