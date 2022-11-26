import * as fs from 'fs'
import glob from 'fast-glob'
import { rewriteFileName } from './utils'
import { processCityScreen, processWarScreen } from './processors'
import type { Sharp } from 'sharp'
import { program } from 'commander'

program
  .option('-i, --input <pattern>', 'input directory or glob pattern', '*.png')
  .option('-o, --output <path>', 'output directory', 'output')
  .option('-t, --type <type>', 'screenshot type, may be `wars` `town` or `unknown`', 'unknown')
  .option('-d, --dry', 'do not write output', 'dry')
  .action(async () => {
    const { input, output, type, dry } = program.opts<{
      input: string,
      output: string,
      type: 'wars' | 'town' | 'unknown',
      dry: boolean
    }>()
  
    if (!fs.statSync(output).isDirectory()) {
      console.error(`${output} is not a directory or does not exist`)
      return
    }
  
    console.log(`searching files: ${input}`)
    const found = await glob(input)
    const files = found.filter((it) => /\.(png|jpg|jpeg)/gi.test(it))
    if (!files.length) {
      console.error(`${input} does not match any png or jpg file`)
      return
    }
    console.log(`found ${files.length} images`)
  
    for (const file of files) {
      console.log('processing', file, 'as', type)
      switch (type) {
        case 'wars': {
          const out = await processWarScreen(file)
          if (!out.result.length) {
            console.error('screenshot contains no wars info')
            saveData(file, output, out)
          } else if (dry) {
            console.info(out.result)
          } else {
            saveData(file, output, out)
          }
          break 
        }
        case 'town': {
          const out = await processCityScreen(file)
          if (!out.result.settlement) {
            console.error('screenshot contains no town info')
          } else if (dry) {
            console.info(out.result)
          } else {
            saveData(file, output, out)
          }
          break 
        }
        case 'unknown': {
          const warOut = await processWarScreen(file)
          if (warOut.result.length) {
            await saveData(file, output, warOut)
            continue
          }
          const cityOut = await processCityScreen(file)
          if (cityOut.result.settlement) {
            await saveData(file, output, cityOut)
            continue
          }
          console.log('unrecoginzed', cityOut.text)
          break 
        }
        default: {
          console.error(`unknown type option: ${type}`)
        }
      }
    }
  })
  .parse()
  
async function saveData(
  fileIn: string,
  outDir: string,
  { image, text, result } : { image: Sharp, text: string, result: any }) {
  const json = JSON.stringify(result, null, 2)

  const fileOutOrig = rewriteFileName(fileIn, { dir: outDir, suffix: '-orig' })
  const fileOutGrey = rewriteFileName(fileIn, { dir: outDir })
  const fileOutText = rewriteFileName(fileIn, { dir: outDir, ext: '.txt' })
  const fileOutJson = rewriteFileName(fileIn, { dir: outDir, ext: '.json' })

  await fs.promises.copyFile(fileIn, fileOutOrig)
  await image.toFile(fileOutGrey)

  await fs.promises.writeFile(fileOutText, Buffer.from(text))
  await fs.promises.writeFile(fileOutJson, Buffer.from(json))
}
