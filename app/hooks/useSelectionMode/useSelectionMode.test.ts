import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act, fireEvent } from '@testing-library/react'
import { useSelectionMode } from './index'

describe('useSelectionMode', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Estado inicial', () => {
    it('inicia com modo seleção desativado', () => {
      const { result } = renderHook(() => useSelectionMode())
      expect(result.current.isSelectionMode).toBe(false)
    })

    it('inicia com conjunto de selecionados vazio', () => {
      const { result } = renderHook(() => useSelectionMode())
      expect(result.current.selectedIds.size).toBe(0)
      expect(result.current.selectedCount).toBe(0)
    })
  })

  describe('enterSelectionMode / exitSelectionMode', () => {
    it('ativa modo seleção com enterSelectionMode()', () => {
      const { result } = renderHook(() => useSelectionMode())

      act(() => {
        result.current.enterSelectionMode()
      })

      expect(result.current.isSelectionMode).toBe(true)
    })

    it('ativa modo seleção com item inicial', () => {
      const { result } = renderHook(() => useSelectionMode())

      act(() => {
        result.current.enterSelectionMode(42)
      })

      expect(result.current.isSelectionMode).toBe(true)
      expect(result.current.selectedIds.has(42)).toBe(true)
      expect(result.current.selectedCount).toBe(1)
    })

    it('desativa modo seleção e limpa seleção com exitSelectionMode()', () => {
      const { result } = renderHook(() => useSelectionMode())

      act(() => {
        result.current.enterSelectionMode(1)
        result.current.selectAll([2, 3, 4])
      })

      expect(result.current.selectedCount).toBe(4)

      act(() => {
        result.current.exitSelectionMode()
      })

      expect(result.current.isSelectionMode).toBe(false)
      expect(result.current.selectedCount).toBe(0)
    })
  })

  describe('toggleSelection', () => {
    it('adiciona ID à seleção se não estiver selecionado', () => {
      const { result } = renderHook(() => useSelectionMode())

      act(() => {
        result.current.enterSelectionMode()
        result.current.toggleSelection(1)
      })

      expect(result.current.selectedIds.has(1)).toBe(true)
    })

    it('remove ID da seleção se já estiver selecionado', () => {
      const { result } = renderHook(() => useSelectionMode())

      act(() => {
        result.current.enterSelectionMode(1)
      })

      expect(result.current.selectedIds.has(1)).toBe(true)

      act(() => {
        result.current.toggleSelection(1)
      })

      expect(result.current.selectedIds.has(1)).toBe(false)
    })
  })

  describe('selectAll / deselectAll', () => {
    it('adiciona múltiplos IDs à seleção', () => {
      const { result } = renderHook(() => useSelectionMode())

      act(() => {
        result.current.enterSelectionMode()
        result.current.selectAll([1, 2, 3, 4, 5])
      })

      expect(result.current.selectedCount).toBe(5)
      expect(result.current.selectedIds.has(1)).toBe(true)
      expect(result.current.selectedIds.has(5)).toBe(true)
    })

    it('não duplica IDs já selecionados', () => {
      const { result } = renderHook(() => useSelectionMode())

      act(() => {
        result.current.enterSelectionMode(1)
        result.current.selectAll([1, 2, 3])
      })

      expect(result.current.selectedCount).toBe(3)
    })

    it('remove múltiplos IDs da seleção', () => {
      const { result } = renderHook(() => useSelectionMode())

      act(() => {
        result.current.enterSelectionMode()
        result.current.selectAll([1, 2, 3, 4, 5])
      })

      expect(result.current.selectedCount).toBe(5)

      act(() => {
        result.current.deselectAll([2, 4])
      })

      expect(result.current.selectedCount).toBe(3)
      expect(result.current.selectedIds.has(1)).toBe(true)
      expect(result.current.selectedIds.has(2)).toBe(false)
      expect(result.current.selectedIds.has(3)).toBe(true)
      expect(result.current.selectedIds.has(4)).toBe(false)
      expect(result.current.selectedIds.has(5)).toBe(true)
    })
  })

  describe('clearSelection', () => {
    it('remove todos os IDs mas mantém modo seleção', () => {
      const { result } = renderHook(() => useSelectionMode())

      act(() => {
        result.current.enterSelectionMode()
        result.current.selectAll([1, 2, 3])
      })

      act(() => {
        result.current.clearSelection()
      })

      expect(result.current.isSelectionMode).toBe(true)
      expect(result.current.selectedCount).toBe(0)
    })
  })

  describe('Tecla ESC', () => {
    it('sai do modo seleção ao pressionar ESC', () => {
      const { result } = renderHook(() => useSelectionMode())

      act(() => {
        result.current.enterSelectionMode()
        result.current.selectAll([1, 2, 3])
      })

      expect(result.current.isSelectionMode).toBe(true)
      expect(result.current.selectedCount).toBe(3)

      act(() => {
        fireEvent.keyDown(window, { key: 'Escape' })
      })

      expect(result.current.isSelectionMode).toBe(false)
      expect(result.current.selectedCount).toBe(0)
    })

    it('não faz nada se ESC é pressionado fora do modo seleção', () => {
      const { result } = renderHook(() => useSelectionMode())

      expect(result.current.isSelectionMode).toBe(false)

      act(() => {
        fireEvent.keyDown(window, { key: 'Escape' })
      })

      expect(result.current.isSelectionMode).toBe(false)
    })

    it('não responde a outras teclas', () => {
      const { result } = renderHook(() => useSelectionMode())

      act(() => {
        result.current.enterSelectionMode()
      })

      act(() => {
        fireEvent.keyDown(window, { key: 'Enter' })
        fireEvent.keyDown(window, { key: 'a' })
        fireEvent.keyDown(window, { key: 'Delete' })
      })

      expect(result.current.isSelectionMode).toBe(true)
    })
  })

  describe('Cleanup', () => {
    it('remove event listener no unmount quando em modo seleção', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

      const { result, unmount } = renderHook(() => useSelectionMode())

      act(() => {
        result.current.enterSelectionMode()
      })

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
      removeEventListenerSpy.mockRestore()
    })
  })
})
