// 8 tompított felhasználói szín; mindkét módban sötét szöveggel olvasható.
export const USER_COLORS = [
  '#E8A98C', '#B9C48F', '#9EC3CE', '#C7B3DA',
  '#E6C77F', '#A9B8DA', '#E3A7B3', '#A8CDB6',
] as const

type Props = {
  name: string
  color: number
  src?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizes = { sm: 'size-8 text-xs', md: 'size-10 text-sm', lg: 'size-16 text-xl' }

export function Avatar({ name, color, src, size = 'md' }: Props) {
  const initials = name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <span
      role="img"
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold text-[#191714] ${sizes[size]}`}
      style={{ background: USER_COLORS[color % USER_COLORS.length] }}
      aria-label={name}
    >
      {src ? <img src={src} alt="" className="size-full object-cover" /> : initials}
    </span>
  )
}
