import React from 'react'

/**
 * Card — the QuizQuest card primitive.
 * variant: 'glass' (default, translucent blurred) | 'solid'
 * Passes through className for any Tailwind overrides.
 */
export default function Card({
  variant = 'glass',
  as: Tag = 'div',
  className = '',
  children,
  ...rest
}) {
  const base = variant === 'solid' ? 'qq-card-solid' : 'qq-card'
  return (
    <Tag className={`${base} ${className}`.trim()} {...rest}>
      {children}
    </Tag>
  )
}
