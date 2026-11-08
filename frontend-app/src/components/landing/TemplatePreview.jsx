import { useMemo } from 'react'
import { renderStrip } from '../../utils/stripRenderer.js'

export default function TemplatePreview({ template }) {
  const src = useMemo(() => {
    try {
      return renderStrip({ template, scale: 0.5 }).toDataURL('image/png')
    } catch {
      return ''
    }
  }, [template])

  if (!src) return null

  return (
    <img
      className="template-preview-img"
      src={src}
      alt={`Contoh template ${template.name}`}
    />
  )
}