import React, { ElementType, forwardRef } from 'react'

export type TextVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'body'
  | 'body-lg'
  | 'caption'
  | 'label'
  | 'code'

const defaultElementMap: Record<TextVariant, ElementType> = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  'body-lg': 'p',
  body: 'p',
  caption: 'span',
  label: 'span',
  code: 'code',
}

const variantStyles: Record<TextVariant, string> = {
  h1: 'font-extrabold tracking-tight text-3xl sm:text-4xl lg:text-5xl text-slate-900 dark:text-white leading-[1.15]',
  h2: 'font-bold tracking-tight text-2xl sm:text-3xl text-slate-900 dark:text-white leading-snug',
  h3: 'font-semibold tracking-tight text-lg sm:text-xl text-slate-900 dark:text-white leading-snug',
  h4: 'font-semibold text-base sm:text-lg text-slate-900 dark:text-white leading-normal',
  'body-lg': 'text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal',
  body: 'text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed font-normal',
  caption: 'text-xs text-slate-500 dark:text-slate-400 leading-normal font-normal',
  label: 'text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400',
  code: 'font-mono text-xs text-sky-600 dark:text-sky-400 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800',
}

export interface TextProps extends React.HTMLAttributes<HTMLElement> {
  variant?: TextVariant
  as?: ElementType
  children?: React.ReactNode
  className?: string
}

export const Text = forwardRef<HTMLElement, TextProps>(function Text(
  { variant = 'body', as, className = '', children, ...props },
  ref
) {
  const Component = (as || defaultElementMap[variant] || 'p') as ElementType
  const style = variantStyles[variant] || variantStyles.body

  return React.createElement(
    Component,
    {
      ref,
      className: `${style} ${className}`,
      ...props,
    },
    children
  )
})

Text.displayName = 'Text'
