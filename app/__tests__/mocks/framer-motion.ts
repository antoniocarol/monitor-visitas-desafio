import { vi } from 'vitest'
import React from 'react'

type MotionProps = React.PropsWithChildren<Record<string, unknown>>

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: MotionProps) => React.createElement('div', props, children),
    button: ({ children, ...props }: MotionProps) => React.createElement('button', props, children),
    span: ({ children, ...props }: MotionProps) => React.createElement('span', props, children),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => children,
}))
