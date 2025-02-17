import _ from 'lodash'

import { Token } from '../typings'

import { IsLatin } from './chars'

export const SPACE = '\u2581'
const CHARS_TO_MERGE: string[] = '"+è-_!@#$%?&*()1234567890~`/\\[]{}:;<>='.split('')

export const makeTokens = (stringTokens: string[], text: string) => {
  return stringTokens.reduce(reduceTokens(text), [] as Token[])
}

const reduceTokens = (text: string) => (currentTokens: Token[], token: string) => {
  const trimedToken = token.replace(SPACE, '')

  const previousToken = currentTokens[currentTokens.length - 1]
  const cursor = previousToken ? previousToken.end : 0

  const cutText = text.substring(cursor).toLowerCase()
  const start = cutText.indexOf(trimedToken) + cursor
  const sanitized = text.substr(start, trimedToken.length)

  const newToken = {
    value: token,
    cannonical: sanitized,
    start,
    end: start + trimedToken.length,
    matchedEntities: []
  } as Token

  return currentTokens.concat(newToken)
}

function tokenIsAllMadeOf(tok: string, chars: string[]) {
  const tokenCharsLeft = _.without(tok.split(''), ...chars)
  return _.isEmpty(tokenCharsLeft)
}

export const mergeSpecialCharactersTokens = (tokens: Token[], specialChars: string[] = CHARS_TO_MERGE) => {
  let current: Token | undefined
  const final: Token[] = []

  for (const head of tokens) {
    if (!current) {
      current = { ...head }
      continue
    }

    const currentIsAllSpecialChars = tokenIsAllMadeOf(current!.value.replace(SPACE, ''), specialChars)

    const headHasNoSpace = !head.value.includes(SPACE)
    const headIsAllSpecialChars = tokenIsAllMadeOf(head.value, specialChars)

    const shouldMergeSpecialChars = currentIsAllSpecialChars && headIsAllSpecialChars && headHasNoSpace
    const shouldMergeLatinWords = headHasNoSpace && IsLatin(head.value) && IsLatin(current.value.replace(SPACE, ''))

    if (shouldMergeSpecialChars || shouldMergeLatinWords) {
      current.value += head.value
      current.cannonical += head.cannonical
      current.end = head.end
      current.matchedEntities = current.matchedEntities.concat(head.matchedEntities)
    } else {
      final.push(current)
      current = { ...head }
    }
  }
  return current ? [...final, current] : final
}
