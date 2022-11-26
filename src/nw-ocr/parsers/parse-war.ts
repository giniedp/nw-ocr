import { toRegex, toSettlementName, textUtil } from '../utils'
import { STRINGS } from '../locale'
import { parse } from 'date-fns'
import { de, enUS } from 'date-fns/locale'

export function parseWar(text: string) {
  const result: Array<{
    time: Date | string
    encounter: 'invasion' | 'war',
    location: string | null,
    info?: string
  }> = []

  textUtil(text)
    .clean()
    .eachMatchingLine(toRegex(STRINGS.invasiontime, 'gi'), (line, i, lines) => {
      const time = textUtil(lines[i + 1]).value
        // .extract(/\w+, \d+. \w+, \d+:\d+( \w+)?/)
        // .toResult((value) => parse(value, 'EEE, dd. MMM, HH:mm', new Date(), {
        //   locale: de
        // }))
      const location = textUtil(lines[i + 3])
        .stripWordsLeft(1)
        .toResult((value) => toSettlementName(value, 0.5))
      result.push({
        encounter: 'invasion',
        location: location,
        time: time
      })
    })
    .eachMatchingLine(toRegex(STRINGS.wartime, 'gi'), (line, i, lines) => {
      const time = textUtil(lines[i + 1]).value
        // .extract(/\w+, \d+. \w+, \d+:\d+( \w+)?/)
        // .toResult((value) => parse(value, 'EEE, dd. MMM, HH:mm', new Date(), {
        //   locale: de
        // }))
      const location = textUtil(lines[i + 3])
        .stripWordsLeft(1)
        .toResult((value) => toSettlementName(value, 0.5))
      result.push({
        encounter: 'war',
        location: location,
        time: time,
        info: lines[i - 1]
      })
    })

  return result
}
