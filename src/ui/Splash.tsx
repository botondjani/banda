// Indulási pillanat (session / banda betöltése): a logó középen, mint egy natív splash
export function Splash() {
  return (
    <div className="flex min-h-dvh items-center justify-center" aria-busy="true" aria-label="Betöltés">
      <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="size-16 animate-pulse rounded-2xl" />
    </div>
  )
}
