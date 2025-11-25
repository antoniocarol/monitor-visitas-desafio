import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useToast } from './index'

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Estado inicial', () => {
    it('inicia com array de toasts vazio', () => {
      const { result } = renderHook(() => useToast())
      expect(result.current.toasts).toEqual([])
    })

    it('retorna todas as funções esperadas', () => {
      const { result } = renderHook(() => useToast())

      expect(typeof result.current.removeToast).toBe('function')
      expect(typeof result.current.success).toBe('function')
      expect(typeof result.current.error).toBe('function')
      expect(typeof result.current.info).toBe('function')
    })
  })

  describe('Criação de toast', () => {
    it('adiciona toast ao array', () => {
      const { result } = renderHook(() => useToast())

      act(() => {
        result.current.success('Mensagem de sucesso')
      })

      expect(result.current.toasts.length).toBe(1)
      expect(result.current.toasts[0].type).toBe('success')
      expect(result.current.toasts[0].message).toBe('Mensagem de sucesso')
    })

    it('gera ID único para cada toast', () => {
      const { result } = renderHook(() => useToast())

      act(() => {
        result.current.success('Toast 1')
        result.current.info('Toast 2')
      })

      expect(result.current.toasts[0].id).not.toBe(result.current.toasts[1].id)
    })

    it('remove toast automaticamente após duration padrão (3000ms)', () => {
      const { result } = renderHook(() => useToast())

      act(() => {
        result.current.success('Mensagem')
      })

      expect(result.current.toasts.length).toBe(1)

      act(() => {
        vi.advanceTimersByTime(3000)
      })

      expect(result.current.toasts.length).toBe(0)
    })
  })

  describe('Helpers de tipo', () => {
    it('success() cria toast de sucesso com duration padrão', () => {
      const { result } = renderHook(() => useToast())

      act(() => {
        result.current.success('Operação concluída!')
      })

      expect(result.current.toasts[0].type).toBe('success')
      expect(result.current.toasts[0].message).toBe('Operação concluída!')

      act(() => {
        vi.advanceTimersByTime(3000)
      })
      expect(result.current.toasts.length).toBe(0)
    })

    it('error() cria toast de erro com duration maior (5000ms)', () => {
      const { result } = renderHook(() => useToast())

      act(() => {
        result.current.error('Algo deu errado!')
      })

      expect(result.current.toasts[0].type).toBe('error')
      expect(result.current.toasts[0].message).toBe('Algo deu errado!')

      act(() => {
        vi.advanceTimersByTime(4999)
      })
      expect(result.current.toasts.length).toBe(1)

      act(() => {
        vi.advanceTimersByTime(1)
      })
      expect(result.current.toasts.length).toBe(0)
    })

    it('info() cria toast de informação com duration padrão', () => {
      const { result } = renderHook(() => useToast())

      act(() => {
        result.current.info('Informação importante')
      })

      expect(result.current.toasts[0].type).toBe('info')
      expect(result.current.toasts[0].message).toBe('Informação importante')
    })
  })

  describe('removeToast', () => {
    it('remove toast manualmente pelo ID', () => {
      const { result } = renderHook(() => useToast())

      act(() => {
        result.current.success('Toast 1')
        result.current.info('Toast 2')
      })

      const toastIdToRemove = result.current.toasts[0].id

      act(() => {
        result.current.removeToast(toastIdToRemove)
      })

      expect(result.current.toasts.length).toBe(1)
      expect(result.current.toasts[0].message).toBe('Toast 2')
    })

    it('cancela timer ao remover toast manualmente', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')
      const { result } = renderHook(() => useToast())

      act(() => {
        result.current.error('Mensagem')
      })

      const toastId = result.current.toasts[0].id

      act(() => {
        result.current.removeToast(toastId)
      })

      expect(clearTimeoutSpy).toHaveBeenCalled()
      clearTimeoutSpy.mockRestore()
    })

    it('nao quebra ao tentar remover ID inexistente', () => {
      const { result } = renderHook(() => useToast())

      act(() => {
        result.current.success('Toast')
      })

      expect(() => {
        act(() => {
          result.current.removeToast('id-inexistente')
        })
      }).not.toThrow()

      expect(result.current.toasts.length).toBe(1)
    })
  })

  describe('Multiplos toasts', () => {
    it('gerencia multiplos toasts simultaneamente', () => {
      const { result } = renderHook(() => useToast())

      act(() => {
        result.current.success('Sucesso 1')
        result.current.error('Erro 1')
        result.current.info('Info 1')
      })

      expect(result.current.toasts.length).toBe(3)
    })
  })

  describe('Cleanup', () => {
    it('limpa todos os timers quando componente desmonta', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')
      const { result, unmount } = renderHook(() => useToast())

      act(() => {
        result.current.success('Toast 1')
        result.current.error('Toast 2')
      })

      unmount()

      expect(clearTimeoutSpy).toHaveBeenCalledTimes(2)
      clearTimeoutSpy.mockRestore()
    })
  })
})
