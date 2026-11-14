// Mengubah baris tabel templates menjadi bentuk yang dipakai frontend
export function toTemplate(template, { locked = false } = {}) {
  return {
    id: template.id,
    name: template.name,
    className: template.slug,
    category: template.category,
    description: template.description,
    background: template.background,
    accent: template.accent,
    decoration: template.decoration,
    tag: template.tag,
    imageUrl: template.image_url,
    isPremium: Boolean(template.is_premium),
    locked,
    isEvent: Boolean(template.owner_id),
    activeUntil: template.active_until ?? null,
    config: template.config ?? null,
  }
}