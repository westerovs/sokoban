/* eslint-disable */
// @ts-nocheck
import antarctica1Location from './generated/antarctica-1.json'
import antarctica2Location from './generated/antarctica-2.json'
import antarctica3Location from './generated/antarctica-3.json'
import factory1Location from './generated/factory-1.json'
import factory2Location from './generated/factory-2.json'
import factory3Location from './generated/factory-3.json'
import forest1Location from './generated/forest-1.json'
import forest2Location from './generated/forest-2.json'
import forest3Location from './generated/forest-3.json'
import garden1Location from './generated/garden-1.json'
import garden2Location from './generated/garden-2.json'
import garden3Location from './generated/garden-3.json'
import garden4Location from './generated/garden-4.json'
import mine1Location from './generated/mine-1.json'
import mine2Location from './generated/mine-2.json'
import mine3Location from './generated/mine-3.json'

// Список доступных в игре локаций в порядке их прохождения.
const levels = {
  locations: [
    // Путешествие 1
    garden1Location,
    // forest1Location,
    // garden2Location,
    antarctica1Location,

    // Путешествие 2
    // mine1Location,
    // factory1Location,
    // antarctica2Location,
    // forest2Location,

    // Путешествие 3
    // garden3Location,
    // mine2Location,
    // factory2Location,
    // antarctica3Location,

    // Путешествие 4
    // forest3Location,
    // garden4Location,
    // mine3Location,
    // factory3Location,
  ],
}

export {levels}
