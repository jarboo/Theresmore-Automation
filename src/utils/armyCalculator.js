import { factions, locations, units } from '../data'
import translate from './translate'

const fights = factions.concat(locations).map((fight) => {
  return {
    key: fight.id,
    id: translate(fight.id),
    army: fight.army,
  }
})

const applyUnitMods = (unit) => {
  let run = window.localStorage.getItem('run')
  if (run) {
    run = JSON.parse(run)
  }

  if (unit && run && run.modifiers) {
    let bonusAttack = 0
    let bonusDefense = 0

    const unitMods = run.modifiers.find((mod) => mod.id === unit.id)

    if (unitMods && unitMods.mods) {
      for (let i = 0; i < unitMods.mods.length; i++) {
        const mod = unitMods.mods[i]

        if (mod.type === 'stat') {
          if (!mod.perc) {
            if (mod.id === 'attack') {
              bonusAttack += mod.value
            }

            if (mod.id === 'defense') {
              bonusDefense += mod.value
            }
          }
        }
      }
    }

    unit.attack += bonusAttack
    unit.defense += bonusDefense
  }

  return unit
}

const getEnemyArmy = (enemyId) => {
  const difficultyMode = window.localStorage.getItem('difficultyMode')
  const difficultyModeMultiplier = difficultyMode === '0' ? 1 : difficultyMode === '1' ? 1.5 : 2
  const randomBonus = 1.3
  const army = fights
    .find((fight) => fight.key === enemyId || fight.id === enemyId)
    .army.map((unit) => {
      const unitDetails = units.find((enemy) => enemy.id === unit.id)

      return {
        ...unit,
        ...unitDetails,
        value: Math.round(unit.value * difficultyModeMultiplier * randomBonus),
      }
    })

  return army
}

const getGarrison = () => {
  const garrison = []

  let run = window.localStorage.getItem('run')
  if (run) {
    run = JSON.parse(run)
  }

  if (run && run.army) {
    for (let i = 0; i < run.army.length; i++) {
      const unit = run.army[i]

      if (unit.value - unit.away > 0) {
        const unitDetails = units.find((unitDetails) => unitDetails.id === unit.id)

        if (unitDetails) {
          garrison.push({ ...applyUnitMods(unitDetails), value: unit.value - unit.away })
        }
      }
    }
  }

  return garrison
}

const calculateEnemyStats = (army) => {
  const enemyStats = {
    attack: [0, 0, 0, 0, 0],
    defense: [0, 0, 0, 0, 0],
  }

  for (let i = 0; i < army.length; i++) {
    enemyStats.attack[army[i].category] += army[i].attack * army[i].value
    enemyStats.defense[army[i].category] += army[i].defense * army[i].value
  }

  return enemyStats
}

const calculateDamages = (enemyStats, userStats) => {
  let enemyAttack = 0
  let enemyDefense = 0

  let userAttack = 0
  let userDefense = 0
  // ['Recon', 'Ranged', 'Shock', 'Tank', 'Rider']
  for (let i = 1; i < enemyStats.attack.length; i++) {
    let j = i + 1
    if (i === 4) j = 1

    enemyAttack += userStats.attack[j] ? 2 * enemyStats.attack[i] : enemyStats.attack[i]
    enemyDefense += enemyStats.defense[i]
  }

  for (let i = 1; i < userStats.attack.length; i++) {
    let j = i + 1
    if (i === 4) j = 1

    userAttack += enemyStats.attack[j] ? 2 * userStats.attack[i] : userStats.attack[i]
    userDefense += userStats.defense[i]
  }

  return {
    enemy: { enemyAttack, enemyDefense },
    user: { userAttack, userDefense },
  }
}

export default { applyUnitMods, getGarrison, getEnemyArmy, calculateEnemyStats, calculateDamages }