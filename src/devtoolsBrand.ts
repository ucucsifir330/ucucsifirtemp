/// <reference types="vite/client" />

const SIGNATURE_ID = 'ucucsifir-devtools-signature'
const FONT_FAMILY = '"Cascadia Mono", "Cascadia Code", Consolas, "Courier New", monospace'

const ASCII_BANNER_LINES = [
  '                                                                       ©',
  '            ▓▓▓▓▓▓▓▓▓▓▓▓▓       ▓▓▓▓▓▓▓▓▓▓▓▓▓       ▓▓▓▓▓▓▓▓▓▓▓▓▓',
  '          ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓',
  '        ▓▓▓▓▓▓111111▓▓▓▓▓▓▓ ▓▓▓▓▓▓111111▓▓▓▓▓▓▓ ▓▓▓▓▓▓000000▓▓▓▓▓▓▓',
  '        111111       ▓▓▓▓▓▓ 111111       ▓▓▓▓▓▓ ▓▓▓▓▓▓        ▓▓▓▓▓▓',
  '        010101       ▓▓▓▓▓▓ 010101       ▓▓▓▓▓▓ ▓▓▓▓▓▓        ▓▓▓▓▓▓',
  '                    ▓▓▓▓▓▓              ▓▓▓▓▓▓  ▓▓▓▓▓▓        ▓▓▓▓▓▓',
  '              ▓▓▓▓▓▓▓▓▓▓          ▓▓▓▓▓▓▓▓▓▓    ▓▓▓▓▓▓        ▓▓▓▓▓▓',
  '              ▓▓▓▓▓▓▓▓▓▓          ▓▓▓▓▓▓▓▓▓▓    ▓▓▓▓▓▓        ▓▓▓▓▓▓',
  '                    ▓▓▓▓▓▓              ▓▓▓▓▓▓  ▓▓▓▓▓▓        ▓▓▓▓▓▓',
  '        101010       ▓▓▓▓▓▓ 101010       ▓▓▓▓▓▓ ▓▓▓▓▓▓        ▓▓▓▓▓▓',
  '        111111       ▓▓▓▓▓▓ 111111       ▓▓▓▓▓▓ ▓▓▓▓▓▓        ▓▓▓▓▓▓',
  '        ▓▓▓▓▓▓111111▓▓▓▓▓▓▓ ▓▓▓▓▓▓111111▓▓▓▓▓▓▓ ▓▓▓▓▓▓000000▓▓▓▓▓▓▓',
  '          ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓',
  '            ▓▓▓▓▓▓▓▓▓▓▓▓▓       ▓▓▓▓▓▓▓▓▓▓▓▓▓       ▓▓▓▓▓▓▓▓▓▓▓▓▓',
  '',
  ' 010101 // C L A V I S   F U T U R I // 101010',
  '                         WWW.UCUCSIFIR.COM',
] as const

const ASCII_BANNER = ASCII_BANNER_LINES.join('\n')

let initialized = false

function hueFor(rowIndex: number, columnIndex: number): number {
  return (columnIndex * 7 + rowIndex * 19) % 360
}

function neonStyle(rowIndex: number, columnIndex: number, isCopyright = false): string {
  const hue = hueFor(rowIndex, columnIndex)
  const fontSize = isCopyright ? '28px' : '15px'
  const lineHeight = isCopyright ? '32px' : '18px'

  return [
    `color: hsl(${hue} 100% 68%)`,
    'background: #020403',
    `font-family: ${FONT_FAMILY}`,
    `font-size: ${fontSize}`,
    'font-style: oblique 28deg',
    'font-weight: 700',
    `line-height: ${lineHeight}`,
    'margin: 0',
    'padding: 0',
    `text-shadow: 0 0 4px hsl(${hue} 100% 60% / 0.95), 0 0 9px hsl(${hue} 100% 50% / 0.55)`,
  ].join('; ')
}

function printConsoleBanner(): void {
  ASCII_BANNER_LINES.forEach((line, rowIndex) => {
    if (line.length === 0) {
      console.log('')
      return
    }

    const format: string[] = []
    const styles: string[] = []

    Array.from(line).forEach((character, columnIndex) => {
      format.push(`%c${character}`)
      styles.push(neonStyle(rowIndex, columnIndex, character === '©'))
    })

    console.log(format.join(''), ...styles)
  })
}

function gradientFor(line: string, rowIndex: number): string {
  const denominator = Math.max(line.length - 1, 1)
  const stops = Array.from(line, (_, columnIndex) => {
    const hue = hueFor(rowIndex, columnIndex)
    const position = (columnIndex / denominator) * 100

    return `hsl(${hue} 100% 68%) ${position.toFixed(2)}%`
  })

  return `linear-gradient(90deg, ${stops.join(', ')})`
}

function domRowStyle(line: string, rowIndex: number): string {
  const hue = hueFor(rowIndex, 0)

  return [
    `color: hsl(${hue} 100% 68%)`,
    `background-image: ${gradientFor(line, rowIndex)}`,
    'background-clip: text',
    '-webkit-background-clip: text',
    '-webkit-text-fill-color: transparent',
    `font-family: ${FONT_FAMILY}`,
    'font-size: 15px',
    'font-style: oblique 28deg',
    'font-weight: 700',
    'line-height: 18px',
    'white-space: pre',
    `text-shadow: 0 0 4px hsl(${hue} 100% 60% / 0.95), 0 0 9px hsl(${hue} 100% 50% / 0.55)`,
  ].join('; ')
}

function appendDomSignature(): void {
  const mountPoint = document.body ?? document.documentElement
  const comment = document.createComment(ASCII_BANNER)
  const signature = document.createElement('pre')

  signature.id = SIGNATURE_ID
  signature.hidden = true
  signature.setAttribute('aria-hidden', 'true')
  signature.setAttribute('data-brand', '330')
  signature.setAttribute('data-clavis', 'futuri')
  signature.setAttribute('data-url', 'www.ucucsifir.com')
  signature.style.cssText = [
    'display: none !important',
    'position: absolute',
    'width: 0',
    'height: 0',
    'overflow: hidden',
    'pointer-events: none',
    'visibility: hidden',
  ].join('; ')

  ASCII_BANNER_LINES.forEach((line, rowIndex) => {
    const row = document.createElement('span')

    row.setAttribute('data-row', String(rowIndex))

    if (line.length > 0) {
      row.style.cssText = domRowStyle(line, rowIndex)

      if (rowIndex === 0) {
        const copyrightColumn = line.indexOf('©')
        const copyright = document.createElement('span')

        row.append(document.createTextNode(line.slice(0, copyrightColumn)))
        copyright.textContent = '©'
        copyright.style.cssText = neonStyle(rowIndex, copyrightColumn, true)
        row.append(copyright)
      } else {
        row.textContent = line
      }
    }

    signature.append(row)

    if (rowIndex < ASCII_BANNER_LINES.length - 1) {
      signature.append(document.createTextNode('\n'))
    }
  })

  mountPoint.append(comment, signature)
}

export function initDevtoolsBrand(): void {
  if (!import.meta.env.PROD) return
  if (initialized || typeof document === 'undefined') return

  initialized = true

  if (document.getElementById(SIGNATURE_ID)) return

  console.clear()
  printConsoleBanner()
  appendDomSignature()
}
