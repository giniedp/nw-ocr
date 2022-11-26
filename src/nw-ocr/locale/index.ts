import de from './de'
import en from './en'

export const LOCALE = {
  de: de,
  en: en,
}

export type I18nKey = keyof typeof de | keyof typeof en

export function allStrings(...keys: I18nKey[]) {
  const result: string[] = []
  Object.values(LOCALE).forEach((dict) => {
    keys.forEach((key) => result.push(dict[key]))
  })
  return result
}

export const STRINGS = {
  township: allStrings('township'),
  township_tiers: {
    hamlet: allStrings('settlement_hamlet'),
    village: allStrings('settlement_village'),
    town: allStrings('settlement_town'),
    city: allStrings('settlement_city'),
    capital: allStrings('settlement_capital')
  },
  township_all_tiers: allStrings(
    'settlement_capital',
    'settlement_city',
    'settlement_hamlet',
    'settlement_town',
    'settlement_village'
  ),
  encounter_upcoming_war: allStrings('encounter_upcoming_war'),
  encounter_ongoing_war: allStrings('encounter_ongoing_war'),
  encounter_upcoming_invasion: allStrings('encounter_upcoming_invasion'),
  encounter_ongoing_invasion: allStrings('encounter_ongoing_invasion'),
  attackerLabel: allStrings('attacker_label'),
  defenderLabel: allStrings('defender_label'),
  invasionAttacker: allStrings('invasion_attacker'),
  crafting_labels: allStrings('crafting', 'refining', 'taxes'),
  crafting: allStrings('crafting'),
  refining: allStrings('refining'),
  taxes: allStrings('taxes'),
  tier: allStrings('tier'),
  governdBy: allStrings('governd_by'),
  controlledBy: allStrings('controlled_by'),
  invasiontime: allStrings('invasiontime'),
  wartime: allStrings('wartime'),
  location: allStrings('location'),
  cities: {
    FirstLight: allStrings('cities_FirstLight'),
    CutlassKeys: allStrings('cities_CutlassKeys'),
    Reekwater: allStrings('cities_Reekwater'),
    Windsward: allStrings('cities_Windsward'),
    MonarchsBluffs: allStrings('cities_MonarchsBluffs'),
    Everfall: allStrings('cities_Everfall'),
    Queensport: allStrings('cities_Queensport'),
    RestlessShore: allStrings('cities_RestlessShore'),
    WeaversFen: allStrings('cities_WeaversFen'),
    Brightwood: allStrings('cities_Brightwood'),
    Mourningdale: allStrings('cities_Mourningdale'),
    Edengrove: allStrings('cities_Edengrove'),
    GreatCleave: allStrings('cities_GreatCleave'),
    ShatteredMountain: allStrings('cities_ShatteredMountain'),
  },
  cities_all: allStrings(
    'cities_FirstLight',
    'cities_CutlassKeys',
    'cities_Reekwater',
    'cities_Windsward',
    'cities_MonarchsBluffs',
    'cities_Everfall',
    'cities_Queensport',
    'cities_RestlessShore',
    'cities_WeaversFen',
    'cities_Brightwood',
    'cities_Mourningdale',
    'cities_Edengrove',
    'cities_GreatCleave',
    'cities_ShatteredMountain',
  ),
  faction_names: {
    Syndicate: allStrings('faction_name1'),
    Marauders: allStrings('faction_name2'),
    Covenant: allStrings('faction_name3'),
  }
}
