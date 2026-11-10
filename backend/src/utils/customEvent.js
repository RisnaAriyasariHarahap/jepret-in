export const EVENT_TYPES = ['birthday', 'graduation', 'wedding', 'gathering', 'campus', 'other']

export const EVENT_STATUSES = ['pending', 'approved', 'rejected']

export function toCustomEvent(row) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    eventName: row.event_name,
    eventType: row.event_type,
    eventDate: row.event_date,
    location: row.location,
    guestCount: row.guest_count,
    themeNotes: row.theme_notes,
    status: row.status,
    adminNotes: row.admin_notes,
    quotedPrice: row.quoted_price,
    finalPrice: row.final_price,
    startsAt: row.starts_at,
    durationUnit: row.duration_unit,
    durationValue: row.duration_value,
    endsAt: row.ends_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}