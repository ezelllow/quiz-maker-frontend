import React from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

/**
 * MathText — renders a string that may contain inline LaTeX math delimited
 * by \( and \) (the P6 Math sheet convention; harmless for physics text).
 *
 * The string is split on \(...\): even segments are plain text, odd segments
 * are LaTeX rendered via KaTeX. Malformed LaTeX renders as literal source
 * (throwOnError: false) rather than crashing the question.
 *
 * Usage: <MathText>{q.question_text}</MathText>
 */
const MATH_SPLIT = /\\\((.+?)\\\)/gs

export default function MathText({ children }) {
  const text = String(children ?? '')
  // Fast path — no math delimiters, skip the split + KaTeX entirely.
  if (!text.includes('\\(')) return <>{text}</>
  const parts = text.split(MATH_SPLIT)
  return (
    <>
      {parts.map((seg, i) =>
        i % 2 === 1 ? (
          <span
            key={i}
            dangerouslySetInnerHTML={{
              __html: katex.renderToString(seg, {
                throwOnError: false,
                output: 'html',
              }),
            }}
          />
        ) : (
          <React.Fragment key={i}>{seg}</React.Fragment>
        )
      )}
    </>
  )
}
