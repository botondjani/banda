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
