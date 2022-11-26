import {
  toRegex,
  toSettlementName,
  toSettlementTier,
  isTierLabel,
  isSimilarToAny,
  textUtil,
  toFactionName,
  regTester,
} from '../utils'
import { STRINGS } from '../locale'

export function parseCity(text: string) {
  text = textUtil(text).clean().value
  return {
    settlement: parseSettlement(text),
    encounter: parseEncounter(text),
    governedBy: parseGovernedBy(text),
    controledBy: parseControlledBy(text),
    crafting: parseShops(text)
  }
}

function parseSettlement(text: string) {
  function resolve(l1: string, l2: string) {
    const tokens = textUtil(l1).stripShortWords(2).tokens()
    const tier = tokens.pop() || ''
    const name = tokens.join(' ')
    const upgrades = textUtil(l2)
      .stripShortWords(2)
      .stripWordsRight(1)
      .replace(/[il]/gi, '1')
      .replace(/[Z]/gi, '7')
      .transform((value) => value.match(/\d+/)?.[0] || '')
      .toNumber()
  
    return {
      name: toSettlementName(name, 0.5) || null,
      tier: toSettlementTier(tier, 0.5) || null,
      upgrades: upgrades,
    }
  }

  // Settlement
  // [CITY NAME] [SETTLEMENT]
  // [NUMBER] Upgrades
  return textUtil(text).findLineAndResolve(
    {
      test: regTester(toRegex(STRINGS.cities_all, 'gi')),
      resolve: (line, i, lines) => resolve(lines[i + 0], lines[i + 1])
    },
    {
      test: regTester(toRegex(STRINGS.township_all_tiers, 'gi')),
      resolve: (line, i, lines) => resolve(lines[i + 0], lines[i + 1])
    },
    {
      test: regTester(toRegex(STRINGS.township, 'g')),
      resolve: (line, i, lines) => resolve(lines[i + 1], lines[i + 2])
    }
  )
}

function parseEncounter(text: string) {
  return textUtil(text).findLineAndResolve(
    {
      test: regTester(toRegex([
        ...STRINGS.encounter_upcoming_war,
        ...STRINGS.encounter_ongoing_war
      ], 'gi')),
      resolve: (line, i, lines) => ({
        type: 'war',
        info: lines[i - 2]
      })
    },
    {
      test: regTester(toRegex([
        ...STRINGS.encounter_upcoming_invasion,
        ...STRINGS.encounter_ongoing_invasion
      ], 'gi')),
      resolve: (line, i, lines) => ({
        type: 'invasion',
        info: lines[i - 2]
      })
    },
    {
      test: regTester(toRegex([
        ...STRINGS.attackerLabel,
        ...STRINGS.defenderLabel,
      ], 'gi')),
      resolve: (line, i, lines) => {
        const info = lines[i - 1]
        return {
          type: toRegex(STRINGS.invasionAttacker, 'gi').test(info)
            ? 'invasion'
            : 'war',
          info: info,
        }
      }
    }
  )
}

function parseGovernedBy(text: string) {
  return textUtil(text).findLineAndResolve({
    test: regTester(toRegex(STRINGS.governdBy, 'gi')),
    resolve: (line, i, lines) => textUtil(lines[i + 1]).stripShortWords(2).value
  })
}

function parseControlledBy(text: string) {
  return textUtil(text).findLineAndResolve({
    test: regTester(toRegex(STRINGS.controlledBy, 'gi')),
    resolve: (line, i, lines) => textUtil(lines[i + 1])
      .stripShortWords(2)
      .toResult((it) => toFactionName(it, 0.5))
  })
}

function parseShops(text: string) {
  function resolve(line: string, index: number, lines: string[]) {
    const l1 = extractShopLine(lines[index + 1])
    const l2 = extractShopLine(lines[index + 2])
    const l3 = extractShopLine(lines[index + 3])
    const l4 = extractShopLine(lines[index + 4])
    const l5 = extractShopLine(lines[index + 5])
    return {
      crafting: [l1.crafting, l2.crafting, l3.crafting, l4.crafting, l5.crafting],
      refining: [l1.refining, l2.refining, l3.refining, l4.refining, l5.refining],
      taxes: [l1.taxes, l2.taxes, l3.taxes, l4.taxes]
    }
  }
  return textUtil(text).findLineAndResolve(
    {
      test: regTester(toRegex(STRINGS.crafting_labels, 'gi')),
      resolve: resolve
    },
    {
      test: (line, i) => {
        const tokens = line.split(' ')
        return tokens.length >= 3
          && isSimilarToAny(tokens[0], STRINGS.crafting, 0.5)
          && isSimilarToAny(tokens[1], STRINGS.refining, 0.5)
          && isSimilarToAny(tokens[2], STRINGS.taxes, 0.5)
      },
      resolve: resolve
    }
  )
}

function extractShopLine(line: string) {
  let crafting: number | null = null
  let refining: number | null = null
  let taxes: string | null = null

  line.split(' ').forEach((token, i, tokens) => {
    if (taxes == null) {
      const match = token.match(/(\d?\d[.,]?\d\d)/)
      if (match) {
        taxes = match[1]
      }
    }

    if (crafting == null) {
      if (isTierLabel(token, 0.2)) {
        if (/\d/.test(token[token.length - 1])) {
          crafting = Number(token[token.length - 1])
        } else if (/\d/.test(tokens[i + 1] || '')) {
          crafting = Number(tokens[i + 1].match(/\d/)![0])
        } else if (token.endsWith('e')) {
          crafting = 3
        } else if (token.endsWith('s')) {
          crafting = 5
        }
      }
      return
    }
    if (refining == null) {
      if (isTierLabel(token, 0.2)) {
        if (/\d/.test(token[token.length - 1])) {
          refining = Number(token[token.length - 1])
        } else if (/\d/.test(tokens[i + 1] || '')) {
          refining = Number(tokens[i + 1].match(/\d/)![0])
        } else if (token.endsWith('e')) {
          refining = 3
        } else if (token.endsWith('s')) {
          refining = 5
        }
      }
      return
    }
  })
  return {
    crafting, refining, taxes
  }
}