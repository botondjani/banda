import { useSession } from '../../../core/auth/auth'
import { useGroup } from '../../../core/groups/GroupProvider'
import { Button } from '../../../ui/Button'
import { toast } from '../../../ui/Toast'
import { usePhotoUrl, useVoteSubmission, type Submission } from '../api'

const STATUS: Record<string, { label: string; className: string }> = {
  pending: { label: 'Szavazás folyik', className: 'text-muted' },
  valid: { label: 'Érvényes', className: 'text-positive' },
  invalid: { label: 'Nem ér', className: 'text-negative' },
}

export function SubmissionCard({ s }: { s: Submission }) {
  const { group } = useGroup()
  const uid = useSession()!.user.id
  const { data: url } = usePhotoUrl(s.photo_path)
  const vote = useVoteSubmission(group.id, uid)
  const mine = s.submission_votes.find((v) => v.user_id === uid)
  const yes = s.submission_votes.filter((v) => v.valid).length
  const no = s.submission_votes.length - yes
  const canVote = s.status === 'pending' && s.user_id !== uid
  const cast = (valid: boolean) => vote.mutate({ submissionId: s.id, valid }, { onError: () => toast.error('Nem ment át.') })

  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface">
      {url ? <img src={url} alt={`${s.user?.display_name} bizonyítéka`} className="aspect-[4/3] w-full object-cover" /> : <div className="aspect-[4/3] w-full bg-line" />}
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-semibold">{s.user?.display_name}</span>
          <span className={`text-sm font-semibold ${STATUS[s.status].className}`}>{STATUS[s.status].label}</span>
        </div>
        {s.note && <p className="text-muted">{s.note}</p>}
        <p className="text-sm text-muted tabular-nums">
          {yes} szerint ér · {no} szerint nem
        </p>
        {canVote && (
          <div className="flex gap-2">
            <Button variant="secondary" className={`min-h-9 flex-1 text-sm ${mine?.valid === true ? 'border-ink' : ''}`} onClick={() => cast(true)}>Ér</Button>
            <Button variant="secondary" className={`min-h-9 flex-1 text-sm ${mine?.valid === false ? 'border-ink' : ''}`} onClick={() => cast(false)}>Nem ér</Button>
          </div>
        )}
      </div>
    </div>
  )
}
