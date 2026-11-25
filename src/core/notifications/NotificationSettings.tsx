import { Card } from '../../ui/Card'
import { useEnabledModules } from '../modules'
import { ListRow } from '../../ui/ListRow'
import { Switch } from '../../ui/Switch'
import { toast } from '../../ui/Toast'
import { NOTIFICATION_TYPES, pushSupported, useNotificationPrefs, usePushSubscription, useSetNotificationPref, useSetPush } from './api'

export function NotificationSettings() {
  const { data: pushOn = false } = usePushSubscription()
  const setPush = useSetPush()
  const { data: prefs = {} } = useNotificationPrefs()
  const setPref = useSetNotificationPref()
  const types = [...NOTIFICATION_TYPES, ...useEnabledModules().flatMap((m) => m.notificationTypes ?? [])]

  function togglePush(enabled: boolean) {
    setPush.mutate(enabled, {
      onError: () => toast.error(Notification.permission === 'denied' ? 'A böngészőben tiltva vannak az értesítések.' : 'Nem sikerült bekapcsolni.'),
    })
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-bold">Értesítések</h2>
      <Card className="py-0">
        <ListRow
          title="Push ezen az eszközön"
          meta={pushSupported ? 'Akkor is szól, ha nincs nyitva az app' : 'iPhone-on csak a főképernyőre tett appban megy'}
          value={pushSupported ? <Switch label="Push" checked={pushOn} onChange={togglePush} /> : undefined}
        />
        {types.map((t) => (
          <ListRow
            key={t.type}
            title={t.label}
            value={<Switch label={t.label} checked={prefs[t.type] ?? true} onChange={(enabled) => setPref.mutate({ type: t.type, enabled })} />}
          />
        ))}
      </Card>
    </section>
  )
}
