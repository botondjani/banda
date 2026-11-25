// Kliensoldali tömörítés WebP-re. cover: négyzetre vágja (avatar), különben arányosan kicsinyít.
export async function compressImage(file: File, max: number, cover = false, quality = 0.82) {
  const bitmap = await createImageBitmap(file)
  const scale = cover ? Math.max(max / bitmap.width, max / bitmap.height) : Math.min(1, max / Math.max(bitmap.width, bitmap.height))
  const w = cover ? max : Math.round(bitmap.width * scale)
  const h = cover ? max : Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d')!.drawImage(bitmap, (w - bitmap.width * scale) / 2, (h - bitmap.height * scale) / 2, bitmap.width * scale, bitmap.height * scale)
  return new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/webp', quality))
}

// Addig rontja a minőséget (majd a méretet), amíg a fájl limit alá nem kerül
export async function compressUnder(file: File, maxBytes: number, max = 1600) {
  for (const [size, q] of [[max, 0.82], [max, 0.7], [max, 0.58], [1200, 0.6], [1000, 0.55]] as const) {
    const blob = await compressImage(file, size, false, q)
    if (blob.size <= maxBytes) return blob
  }
  throw new Error('too large')
}
