'use client'

export default function SettingsClient({ hasBilling: _hasBilling, isUpgrade: _isUpgrade }: { hasBilling: boolean; isUpgrade?: boolean }) {
  return (
    <div className="text-white/40 text-xs">
      Billing coming soon. All features are currently free during beta.
    </div>
  )
}
