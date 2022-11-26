import * as fs from 'fs'
import * as path from 'path'
import { processScreen } from '../processors'
import { rewriteFileName } from '../utils'
import { expect } from 'chai'

const sampleDirs = [
  path.join(process.cwd(), 'sample', 'de'),
  path.join(process.cwd(), 'sample', 'en')
] 

for (const dir of sampleDirs) {
  fs
    .readdirSync(dir)
    .filter((it) => it.endsWith('.png'))
    .forEach((file) => {
      describe(file, () => {
        it('snapshot', async () => {
          file = path.join(dir, file)
          const out = await processScreen(file)
          const snapshot = await Snapshot.forFile(file).readOrUpdate(out?.result)
          
          expect(out?.result).to.deep.equal(snapshot)
        })
      })
    })
}

class Snapshot {
  public static forFile(file: string) {
    return new Snapshot(rewriteFileName(file, { ext: '.json' }))
  }

  public constructor(public readonly file: string) {

  }

  public async exists() {
    return !!(await fs.promises.stat(this.file).catch(() => false))
  }

  public async read<T = any>(): Promise<T | undefined> {
    const exists = await this.exists()
    if (!exists) {
      return void 0
    }
    const data = await fs.promises.readFile(this.file)
    return JSON.parse(data.toString()) as T
  }

  public async readOrUpdate<T>(update: T) {
    let result = await this.read()
    if (result === undefined && process.env.SNAPSHOT_UPDATE) {
      await this.write(update)
      result = this.read()
    }
    return result
  }

  public async write<T>(value: T) {
    return fs.promises.writeFile(this.file, Buffer.from(JSON.stringify(value, null, 2)))
  }
}  