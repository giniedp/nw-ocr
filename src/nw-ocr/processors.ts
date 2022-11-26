import { recognize } from 'node-tesseract-ocr'
import { parseCity, parseWar } from './parsers'
import { createRegion, processFile, rejectShortLines } from './utils'

export async function processScreen(file: string, type: 'war' | 'city' | 'unknown' = 'unknown') {
  if (type === 'war') {
    return processWarScreen(file)
  }
  if (type === 'city') {
    return processCityScreen(file)
  }

  const warOut = await processWarScreen(file)
  if (warOut.result.length) {
    return warOut
  }
  const cityOut = await processCityScreen(file)
  if (cityOut.result.settlement) {
    return cityOut
  }
  return null
}

export async function processCityScreen(fileIn: string) {
  const image = await processFile(fileIn, (src, { width, height }) =>
    src
      .extract(
        createRegion(width || 0, height || 0, {
          top: 0.07,
          left: 0.74,
          right: 0.98,
          bottom: 1,
        })
      )
      .negate()
      .gamma(3)
      .grayscale()
      .threshold(100)

  )
  const text = await recognize(await image.toBuffer(), {
    lang: 'eng+deu',
    oem: 1,
    psm: 3,
  })
  const result = parseCity(text)
  return {
    image,
    text,
    result,
  }
}

export async function processWarScreen(fileIn: string) {
  const image = await processFile(fileIn, (src, { width, height }) =>
    src
      .extract(
        createRegion(width || 0, height || 0, {
          top: 0.25,
          left: 0.05,
          right: 0.24,
          bottom: 0.95,
        })
      )
      .negate()
      .gamma(3)
      .grayscale()

  )
  const text = await recognize(await image.toBuffer(), {
    lang: 'eng+deu',
    oem: 1,
    psm: 3,
  })
  const result = parseWar(text)
  return {
    image,
    text,
    result,
  }
}
