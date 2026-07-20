import axios from 'axios'
import fs from 'fs'
import os from 'os'
import path from 'path'
import sharp from 'sharp'

export type SlackFileRef = {
  id?: string
  name?: string
  mimetype?: string
  url_private?: string
  url_private_download?: string
  filetype?: string
  mode?: string
  size?: number
}

export type DownloadedSlackFile = {
  name: string
  mimetype: string
  /** Original bytes from Slack — use this for Jira */
  localPath: string
  kind: 'image' | 'video' | 'other'
  /** Vision-only (may be re-encoded JPEG). Never write this to Jira as a separate file. */
  base64?: string
  mediaType?: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
  attachable: boolean
  skipReason?: string
}

const MAX_IMAGES_FOR_VISION = 5
const MAX_IMAGE_BYTES = 4.5 * 1024 * 1024
const MIN_IMAGE_BYTES = 100
const MAX_VISION_EDGE = 2048
const MAX_VISION_JPEG_BYTES = 3.5 * 1024 * 1024

type VisionMediaType = NonNullable<DownloadedSlackFile['mediaType']>

function detectImageMediaType(buffer: Buffer): VisionMediaType | undefined {
  if (buffer.length < 12) return undefined
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg'
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return 'image/png'
  }
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return 'image/gif'
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return 'image/webp'
  }
  return undefined
}

function looksLikeHtmlOrJson(buffer: Buffer): boolean {
  const head = buffer.subarray(0, 64).toString('utf8').trim().toLowerCase()
  return (
    head.startsWith('<!doctype') ||
    head.startsWith('<html') ||
    head.startsWith('{') ||
    head.startsWith('<?xml')
  )
}

function isHeic(buffer: Buffer, name: string, mimetype: string): boolean {
  const lower = `${name} ${mimetype}`.toLowerCase()
  if (lower.includes('heic') || lower.includes('heif')) return true
  if (buffer.length >= 12 && buffer.toString('ascii', 4, 8) === 'ftyp') {
    const brand = buffer.toString('ascii', 8, 12)
    return ['heic', 'heif', 'mif1', 'msf1'].includes(brand)
  }
  return false
}

function isVideo(buffer: Buffer, name: string, mimetype: string): boolean {
  if (mimetype.startsWith('video/') || /\.(mp4|mov|webm|m4v)$/i.test(name)) return true
  if (buffer.length >= 12 && buffer.toString('ascii', 4, 8) === 'ftyp') {
    const brand = buffer.toString('ascii', 8, 12)
    return !['heic', 'heif', 'mif1', 'msf1'].includes(brand)
  }
  return false
}

function extFor(mediaType: VisionMediaType | undefined, name: string, kind: string): string {
  if (mediaType === 'image/jpeg') return '.jpg'
  if (mediaType === 'image/png') return '.png'
  if (mediaType === 'image/gif') return '.gif'
  if (mediaType === 'image/webp') return '.webp'
  if (kind === 'video') {
    const m = name.match(/\.(mp4|mov|webm|m4v)$/i)
    return m ? m[0]! : '.mp4'
  }
  return path.extname(name) || '.bin'
}

function safeBaseName(name: string): string {
  const base = path.basename(name, path.extname(name))
  return (base || 'file').replace(/[^\w.\-]+/g, '_').slice(0, 80)
}

async function fetchSlackFileBuffer(url: string, token: string): Promise<Buffer> {
  // Slack redirects file downloads to a CDN and drops Authorization unless we re-attach it.
  const response = await axios.get<ArrayBuffer>(url, {
    responseType: 'arraybuffer',
    headers: { Authorization: `Bearer ${token}` },
    maxContentLength: 80 * 1024 * 1024,
    maxRedirects: 5,
    beforeRedirect: (options) => {
      options.headers = options.headers ?? {}
      ;(options.headers as Record<string, string>).Authorization = `Bearer ${token}`
    },
    validateStatus: s => s >= 200 && s < 400,
  })

  const contentType = String(response.headers['content-type'] || '')
  const buffer = Buffer.from(response.data)
  if (contentType.includes('text/html') || looksLikeHtmlOrJson(buffer)) {
    throw new Error(
      'Slack returned HTML instead of the file. Add the files:read bot scope and reinstall the Slack app.'
    )
  }
  return buffer
}

export async function downloadSlackFiles(
  files: SlackFileRef[]
): Promise<DownloadedSlackFile[]> {
  const token = process.env.SLACK_BOT_TOKEN
  if (!token || files.length === 0) return []

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mobile-qai-'))
  const downloaded: DownloadedSlackFile[] = []

  for (const file of files) {
    if (file.mode && ['tombstone', 'hidden_by_limit', 'quip'].includes(file.mode)) continue

    const url = file.url_private_download || file.url_private
    if (!url) continue

    const claimedMime = file.mimetype || 'application/octet-stream'
    const originalName = file.name || `file-${file.id || Date.now()}`

    try {
      const buffer = await fetchSlackFileBuffer(url, token)

      const detected = detectImageMediaType(buffer)
      const heic = isHeic(buffer, originalName, claimedMime)
      const video = !detected && !heic && isVideo(buffer, originalName, claimedMime)

      let kind: DownloadedSlackFile['kind'] = 'other'
      if (detected || heic) kind = 'image'
      else if (video) kind = 'video'
      else if (claimedMime.startsWith('image/')) kind = 'image'
      else if (claimedMime.startsWith('video/')) kind = 'video'

      if (kind === 'other') {
        console.warn(`[slackFiles] ${originalName}: skipped non-media (${claimedMime})`)
        continue
      }

      const ext = heic ? '.heic' : extFor(detected, originalName, kind)
      const localPath = path.join(dir, `${safeBaseName(originalName)}${ext}`)
      fs.writeFileSync(localPath, buffer)

      const item: DownloadedSlackFile = {
        name: `${safeBaseName(originalName)}${ext}`,
        mimetype: detected || claimedMime,
        localPath,
        kind,
        attachable: true,
      }

      // Vision: separate in-memory JPEG; never overwrite the original on disk
      if (detected && buffer.length >= MIN_IMAGE_BYTES) {
        try {
          let quality = 85
          let visionBuf = await sharp(buffer, { failOn: 'none' })
            .rotate()
            .resize({
              width: MAX_VISION_EDGE,
              height: MAX_VISION_EDGE,
              fit: 'inside',
              withoutEnlargement: true,
            })
            .jpeg({ quality, mozjpeg: true })
            .toBuffer()

          while (visionBuf.length > MAX_VISION_JPEG_BYTES && quality > 40) {
            quality -= 15
            visionBuf = await sharp(buffer, { failOn: 'none' })
              .rotate()
              .resize({
                width: MAX_VISION_EDGE,
                height: MAX_VISION_EDGE,
                fit: 'inside',
                withoutEnlargement: true,
              })
              .jpeg({ quality, mozjpeg: true })
              .toBuffer()
          }

          if (visionBuf.length <= MAX_IMAGE_BYTES) {
            item.base64 = visionBuf.toString('base64')
            item.mediaType = 'image/jpeg'
          } else {
            item.skipReason = 'image_too_large_for_vision'
          }
        } catch (err) {
          item.skipReason = 'image_reencode_failed'
          console.warn(
            `[slackFiles] ${originalName}: vision re-encode failed:`,
            err instanceof Error ? err.message : err
          )
        }
      } else if (heic) {
        item.skipReason = 'heic_unsupported_for_vision'
      }

      console.log(
        `[slackFiles] ${item.name}: kind=${item.kind} bytes=${buffer.length} vision=${Boolean(item.base64)}`
      )
      downloaded.push(item)
    } catch (err) {
      console.error(
        `[slackFiles] failed to download ${originalName}:`,
        err instanceof Error ? err.message : err
      )
    }
  }

  return downloaded
}

export function filesFromMessage(msg: { files?: SlackFileRef[] } | undefined): SlackFileRef[] {
  return (msg?.files ?? []).filter(f => f.url_private_download || f.url_private)
}

export async function collectThreadFiles(
  client: {
    conversations: {
      replies: (args: {
        channel: string
        ts: string
        limit?: number
      }) => Promise<{ messages?: Array<{ files?: SlackFileRef[]; bot_id?: string }> }>
    }
  },
  channel: string,
  threadTs: string
): Promise<SlackFileRef[]> {
  const result = await client.conversations.replies({
    channel,
    ts: threadTs,
    limit: 100,
  })

  const files: SlackFileRef[] = []
  for (const msg of result.messages ?? []) {
    if (msg.bot_id) continue
    for (const f of msg.files ?? []) {
      files.push(f)
    }
  }
  const seen = new Set<string>()
  return files.filter(f => {
    const key = f.id || f.url_private_download || f.url_private || f.name || ''
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function pickVisionImages(files: DownloadedSlackFile[]): DownloadedSlackFile[] {
  return files
    .filter(f => f.kind === 'image' && f.base64 && f.mediaType)
    .slice(-MAX_IMAGES_FOR_VISION)
}

export function pickJiraAttachments(files: DownloadedSlackFile[]): string[] {
  return files.filter(f => f.attachable && (f.kind === 'image' || f.kind === 'video')).map(f => f.localPath)
}
