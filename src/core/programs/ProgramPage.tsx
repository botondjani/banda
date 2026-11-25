import { useParams } from 'react-router'
import { useGoBack } from '../../lib/nav'
import { BackLink } from '../../ui/BackLink'
import { formatDateTime } from '../../lib/format'
import { Avatar } from '../../ui/Avatar'
import { Card } from '../../ui/Card'
import { ListRow } from '../../ui/ListRow'
import { Segmented } from '../../ui/Segmented'
import { useSession } from '../auth/auth'
import { useEnabledModules } from '../modules'
import { useProgram, useSetAttendance, useStopRecurrence, type Attendance } from './api'
import { ProgramActions } from './ProgramActions'
import { ProgramComments } from './ProgramComments'
import { WeatherLine } from './WeatherLine'
import { Skeleton, SkeletonList } from '../../ui/Skeleton'

const labels: Record<Attendance, string> = { going: 'Megyek', maybe: 'Talán', no: 'Nem' }
const RECURRENCE: Record<string, string> = { weekly: 'Hetente', biweekly: 'Kéthetente', monthly: 'Havonta' }

export function ProgramPage() {
  const { id = '' } = useParams()
  const uid = useSession()?.user.id
  const { data: program, isError } = useProgram(id)
  const setAttendance = useSetAttendance(id)
  const goBack = useGoBack('/programs')
  const stopRecurrence = useStopRecurrence(id)
  const sections = useEnabledModules().filter((m) => m.ProgramSection)

  if (isError) return <p className="text-muted">Ez a program nem létezik, vagy nem a te bandádé.</p>
  if (!program)
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <SkeletonList rows={2} />
      </div>
    )

  const mine = program.program_attendees.find((a) => a.user?.id === uid)?.status as Attendance | undefined
  const order: Attendance[] = ['going', 'maybe', 'no']
  const attendees = [...program.program_attendees].sort((a, b) => order.indexOf(a.status as Attendance) - order.indexOf(b.status as Attendance))

  return (
    <div className="flex flex-col gap-8">
      <div>
        <BackLink label="Vissza" onClick={goBack} />
        <h1 className="mt-2 text-3xl font-bold">{program.title}</h1>
        <p className="mt-1 text-muted">
          {[program.starts_at ? formatDateTime(program.starts_at) : 'Időpont még nincs', program.location].filter(Boolean).join(' · ')}
        </p>
        <WeatherLine location={program.location} startsAt={program.starts_at} />
        {program.recurrence && (
          <p className="mt-2 flex items-center gap-3 text-sm text-muted">
            <span>{RECURRENCE[program.recurrence]} ismétlődik</span>
            {program.created_by === uid && program.series_id && (
              <button className="min-h-11 font-semibold text-ink underline underline-offset-4" onClick={() => stopRecurrence.mutate(program.series_id!)}>
                Leállítom
              </button>
            )}
          </p>
        )}
      </div>

      <ProgramActions program={program} />

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Jössz?</h2>
        <Segmented
          options={order.map((v) => ({ value: v, label: labels[v] }))}
          value={mine}
          onChange={(v) => setAttendance.mutate(v)}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Ki jön · {program.program_attendees.filter((a) => a.status === 'going').length}</h2>
        <Card className="py-0">
          {attendees.map((a) =>
            a.user ? (
              <ListRow
                key={a.user.id}
                leading={<Avatar name={a.user.display_name} color={a.user.color} src={a.user.avatar_url ?? undefined} />}
                title={a.user.display_name}
                meta={labels[a.status as Attendance]}
              />
            ) : null,
          )}
        </Card>
      </section>

      <ProgramComments programId={program.id} groupId={program.group_id} />

      {sections.map(({ id: moduleId, ProgramSection }) => ProgramSection && <ProgramSection key={moduleId} programId={program.id} />)}
    </div>
  )
}
