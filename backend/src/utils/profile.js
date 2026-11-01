export function toProfile(row) {
  const premiumActive =
    row.plan_id === 'premium' &&
    row.premium_until !== null &&
    new Date(row.premium_until) > new Date()

  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    planId: premiumActive ? 'premium' : 'free',
    premiumUntil: row.premium_until,
    isPremium: premiumActive,
  }
}