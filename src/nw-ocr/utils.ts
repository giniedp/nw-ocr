import * as exif from 'exifreader'
import { readFileSync } from 'fs'
import { Region } from 'sharp'
import sharp from 'sharp'
import * as path from 'path'
import { STRINGS } from './locale'
import * as similarity from 'string-similarity'

export async function processFile(
  fileIn: string,
  fn: (input: sharp.Sharp, meta: sharp.Metadata) => sharp.Sharp
) {
  const src = sharp(fileIn)
  const meta = await src.metadata()
  return fn(src, meta)
}

export function createRegion(
  width: number,
  height: number,
  region: { top: number; left: number; right: number; bottom: number }
): Region {
  const top = Math.floor(region.top * height)
  const left = Math.floor(region.left * width)
  const right = Math.floor(region.right * width)
  const bottom = Math.floor(region.bottom * height)
  const result = {
    top: top,
    left: left,
    width: right - left,
    height: bottom - top,
  }
  return result
}

/**
 * Collapses continuous whitespaces to a single white space
 */
export function normalizeSpace(text: string) {
  return (text || '').trim().replaceAll(/\s+/gim, ' ')
}

/**
 * Removes all short lines of text
 */
export function rejectShortLines(text: string, minLineLength = 5): string[] {
  return text
    .split('\n')
    .map((it) => it.trim())
    .filter((it) => it.length >= minLineLength)
}

/**
 * Removes short words in front and at the end of the string
 */
export function rejectShortWords(text: string, minWordLength = 2) {
  const tokens = normalizeSpace(text).split(' ')
  while (tokens[0]?.length < minWordLength) {
    tokens.shift()
  }
  while (tokens[tokens.length - 1]?.length < minWordLength) {
    tokens.pop()
  }
  return tokens.join(' ')
}

export async function readExifDate(file: string) {
  const exifData = exif.load(readFileSync(file), {
    expanded: true,
  })
  return exifData.exif?.DateTimeOriginal || exifData?.exif?.['Date Created']
}

export function toRegex(tokens: string[], flags?: string) {
  const reg = tokens.map((it) => `(${it})`).join('|')
  return new RegExp(reg, flags)
}

export function logCheck(value: boolean, ...message: Array<any>) {
  console.log(value ? '✓' : '✗', message?.filter((it) => !!it).join(' '))
}

export function regTester(reg: RegExp) {
  return (text: string): boolean => reg.test(text)
}

export function similarityTester(candidates: string[], minRating: number) {
  return (text: string): boolean => candidates.some((it) => similarity.compareTwoStrings(it.toLocaleLowerCase(), text.toLocaleLowerCase()) >= minRating)
}

export function rewriteFileName(file: string, options: {
  dir?: string
  prefix?: string
  suffix?: string
  ext?: string
}) {
  const ext = path.extname(file)
  const dirName = options.dir || path.dirname(file)
  const baseName = (options.prefix || '') + path.basename(file, ext) + (options.suffix || '')
  const extName = options.ext || ext
  return path.join(dirName, baseName + extName)
}

export function isSimilarToAny(text: string, candidate: string[], minRating = 0.5) {
  return maxStringSimilarity(text, candidate) >= minRating
}

export function maxStringSimilarity(text: string, candidate: string[]): number {
  if (text == null) {
    return 0
  }
  const ratings = candidate.filter((it) => it != null).map((it) => similarity.compareTwoStrings(text.toLocaleLowerCase(), it.toLocaleLowerCase()))
  return Math.max(...ratings)
}

export function toSettlementName(text: string, minRating: number): string | null {
  return detectClosestName(text, STRINGS.cities, minRating)
}

export function toSettlementTier(text: string, minRating: number): string | null {
  return detectClosestName(text, STRINGS.township_tiers, minRating)
}

export function toFactionName(text: string, minRating: number): string | null {
  return detectClosestName(text, STRINGS.faction_names, minRating)
}

export function detectClosestName(text: string, candidates: Record<string, string[]>, minRating: number) {
  if (!text) {
    return null
  }
  return Object.entries(candidates).map(([key, names]) => {
    return {
      key: key,
      rating: maxStringSimilarity(text, names)
    }
  })
    .sort((a, b) => a.rating - b.rating)
    .filter((it) => it.rating >= minRating)[0]?.key
}

export function isTierLabel(text: string, minRating: number): boolean {
  return STRINGS.tier.some((it) => {
    const rating = similarity.compareTwoStrings(it, text)
    return rating >= minRating
  })
}

export class TextUtil {

  public static create(text: string) {
    return new TextUtil(text)
  }

  public value: string

  public constructor(value: string) {
    this.value = value || ''
  }

  public lines() {
    return this.value.split(/\n/gim)
  }

  public tokens() {
    return this.value.split(/\s/gi)
  }

  public tap(fn: (value: string) => void) {
    fn(this.value)
    return this
  }

  public clean() {
    return this.transform((value) => value
      .split('\n')
      .map((it) => it.replaceAll(/\s+/gim, ' ').trim())
      .filter((it) => it.length > 0)
      .join('\n'))
  }

  public stripShortLines(minLineLength: number) {
    return this.transform((value) => value
      .split('\n')
      .map((it) => it.trim())
      .filter((it) => it.length >= minLineLength)
      .join('\n')
    )
  }

  public stripShortWords(minWordLength: number) {
    return this.transform((value) => value
      .split('\n')
      .map((line) => line
        .split(' ')
        .map((it) => it.trim())
        .filter((it) => it.length >= minWordLength)
        .join(' ')
      )
      .filter((it) => it.length > 0)
      .join('\n')
    )
  }

  public stripWordsLeft(count: number) {
    return this.transform((value) => {
      const words = value.split(' ')
      while (count > 0) {
        words.shift()
        count--
      }
      return words.join(' ')
    })
  }

  public stripWordsRight(count: number) {
    return this.transform((value) => {
      const words = value.split(' ')
      while (count > 0) {
        words.pop()
        count--
      }
      return words.join(' ')
    })
  }

  public replace(reg: RegExp, value: string) {
    return this.transform((it) => it.replace(reg, value))
  }

  public extract(reg: RegExp) {
    return this.transform((value) => value.match(reg)?.[0] || '')
  }

  public transform(fn: (input: string) => string) {
    this.value = (fn(this.value) || '')
    return this
  }

  public toResult<T>(fn: (input: string) => T): T {
    return fn(this.value)
  }

  public toNumber(): number {
    return Number(this.value)
  }

  public eachMatchingLine(test: RegExp | ((line: string, i: number) => boolean), action: (line: string, i: number, lines: string[]) => void) {
    this.lines().forEach((line, i, lines) => {
      if (test instanceof RegExp) {
        if (test.test(line)) {
          action(line, i, lines)
        }
      } else if (test(line, i)) {
        action(line, i, lines)
      }
    })
    return this
  }

  public findLine(test: (line: string, i: number) => boolean): string
  public findLine(test: (line: string, i: number) => boolean, offsets: [number]): [string]
  public findLine(test: (line: string, i: number) => boolean, offsets: [number, number]): [string, string]
  public findLine(test: (line: string, i: number) => boolean, offsets: [number, number, number]): [string, string, string]
  public findLine(test: (line: string, i: number) => boolean, offsets: [number, number, number, number]): [string, string, string, string]
  public findLine(test: (line: string, i: number) => boolean, offsets: [number, number, number, number, number]): [string, string, string, string, string]
  public findLine(test: (line: string, i: number) => boolean, offsets?: number[]) {
    const lines = this.lines()
    const index = lines.findIndex(test)
    if (offsets) {
      return offsets.map((i) => lines[index + i] || '')
    }
    return lines[index] || ''
  }

  public findLineAndResolve<T>(...candidates: Array<{ test: (line: string, i: number) => boolean, resolve: (line: string, i: number, lines: string[]) => T }>) {
    const lines = this.lines()
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      for (const candidate of candidates) {
        if (candidate.test(line, i)) {
          return candidate.resolve(line, i, lines)
        }
      }
    }
    return null
  }
}

export function textUtil(value: string) {
  return TextUtil.create(value)
}