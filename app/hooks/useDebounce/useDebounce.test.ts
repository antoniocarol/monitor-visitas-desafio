import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from './index'

const DEBOUNCE_DELAY_MS = 300

describe('useDebounce', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  describe('Comportamento básico', () => {
    it('retorna valor inicial imediatamente', () => {
      const { result } = renderHook(() => useDebounce('initial', 100))
      expect(result.current).toBe('initial')
    })

    it('não atualiza valor antes do delay', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 100),
        { initialProps: { value: 'initial' } }
      )
      rerender({ value: 'updated' })
      act(() => { vi.advanceTimersByTime(50) })
      expect(result.current).toBe('initial')
    })

    it('atualiza valor após o delay', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 100),
        { initialProps: { value: 'initial' } }
      )
      rerender({ value: 'updated' })
      act(() => { vi.advanceTimersByTime(100) })
      expect(result.current).toBe('updated')
    })
  })

  describe('Cancelamento de debounce', () => {
    it('cancela debounce anterior quando valor muda rapidamente', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 100),
        { initialProps: { value: 'initial' } }
      )

      rerender({ value: 'first' })
      act(() => { vi.advanceTimersByTime(50) })

      rerender({ value: 'second' })
      act(() => { vi.advanceTimersByTime(50) })

      rerender({ value: 'third' })
      act(() => { vi.advanceTimersByTime(100) })

      expect(result.current).toBe('third')
    })
  })

  describe('Delay customizado', () => {
    it('usa delay padrão quando não especificado', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value),
        { initialProps: { value: 'initial' } }
      )

      rerender({ value: 'updated' })
      act(() => { vi.advanceTimersByTime(DEBOUNCE_DELAY_MS - 1) })
      expect(result.current).toBe('initial')

      act(() => { vi.advanceTimersByTime(1) })
      expect(result.current).toBe('updated')
    })

    it('aceita delay customizado', () => {
      const customDelay = 500
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, customDelay),
        { initialProps: { value: 'initial' } }
      )

      rerender({ value: 'updated' })
      act(() => { vi.advanceTimersByTime(customDelay - 1) })
      expect(result.current).toBe('initial')

      act(() => { vi.advanceTimersByTime(1) })
      expect(result.current).toBe('updated')
    })

    it('funciona com delay zero', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 0),
        { initialProps: { value: 'initial' } }
      )
      rerender({ value: 'updated' })
      act(() => { vi.advanceTimersByTime(0) })
      expect(result.current).toBe('updated')
    })
  })

  describe('Tipos de valor', () => {
    it('funciona com números', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 100),
        { initialProps: { value: 0 } }
      )
      rerender({ value: 42 })
      act(() => { vi.advanceTimersByTime(100) })
      expect(result.current).toBe(42)
    })

    it('funciona com objetos', () => {
      const initial = { name: 'John' }
      const updated = { name: 'Jane' }
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 100),
        { initialProps: { value: initial } }
      )
      rerender({ value: updated })
      act(() => { vi.advanceTimersByTime(100) })
      expect(result.current).toEqual(updated)
    })

    it('funciona com arrays', () => {
      const initial = [1, 2, 3]
      const updated = [4, 5, 6]
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 100),
        { initialProps: { value: initial } }
      )
      rerender({ value: updated })
      act(() => { vi.advanceTimersByTime(100) })
      expect(result.current).toEqual(updated)
    })

    it('funciona com null', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce<string | null>(value, 100),
        { initialProps: { value: 'initial' as string | null } }
      )
      rerender({ value: null })
      act(() => { vi.advanceTimersByTime(100) })
      expect(result.current).toBeNull()
    })
  })

  describe('Cleanup no unmount', () => {
    it('limpa timer quando componente desmonta', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')
      const { unmount } = renderHook(
        ({ value }) => useDebounce(value, 100),
        { initialProps: { value: 'initial' } }
      )
      unmount()
      expect(clearTimeoutSpy).toHaveBeenCalled()
      clearTimeoutSpy.mockRestore()
    })
  })
})
