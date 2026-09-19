/**
 * Shrink a picked image before it's uploaded.
 *
 * A phone screenshot is several megabytes; MySQL's max_allowed_packet is
 * commonly 4MB, so an untouched one fails at the driver — somewhere we
 * can't explain it to a student. Doing this in the browser also means the
 * upload finishes on a school 4G connection.
 *
 * Quality steps down until it fits rather than picking one figure, because
 * what compresses well varies wildly: a screenshot of text and a photo of a
 * worksheet behave nothing alike at the same quality.
 */
const MAX_EDGE = 1600
const TARGET_BYTES = 800_000
const QUALITY_STEPS = [0.82, 0.7, 0.58, 0.45, 0.34]

/** Rough byte length of a base64 payload, without materialising it twice. */
function base64Bytes(dataUrl) {
  const i = dataUrl.indexOf(',')
  const b64 = i === -1 ? dataUrl : dataUrl.slice(i + 1)
  const padding = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0
  return Math.floor((b64.length * 3) / 4) - padding
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That image could not be opened')) }
    img.src = url
  })
}

/**
 * @returns {Promise<{dataUrl: string, bytes: number, width: number, height: number}>}
 */
export default async function downscaleImage(file) {
  const img = await loadImage(file)
  const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height))
  const width = Math.max(1, Math.round(img.width * scale))
  const height = Math.max(1, Math.round(img.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  // White underneath: a PNG screenshot with transparency would otherwise
  // come out with black wherever it was see-through once it's a JPEG.
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(img, 0, 0, width, height)

  let dataUrl = canvas.toDataURL('image/jpeg', QUALITY_STEPS[0])
  for (let i = 1; i < QUALITY_STEPS.length && base64Bytes(dataUrl) > TARGET_BYTES; i += 1) {
    dataUrl = canvas.toDataURL('image/jpeg', QUALITY_STEPS[i])
  }
  return { dataUrl, bytes: base64Bytes(dataUrl), width, height }
}
