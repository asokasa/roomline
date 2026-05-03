import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { GameTable } from '../types'

type PersistentTables = {
  tables: GameTable[]
  setTables: Dispatch<SetStateAction<GameTable[]>>
  loadedFromStorage: boolean
  saveTables: () => boolean
}

export function usePersistentTables(
  storageKey: string,
  fallbackTables: GameTable[],
): PersistentTables {
  const [loadedFromStorage] = useState(() => {
    return window.localStorage.getItem(storageKey) !== null
  })

  const [tables, setTables] = useState<GameTable[]>(() => {
    const storedTables = window.localStorage.getItem(storageKey)

    if (!storedTables) {
      return fallbackTables
    }

    try {
      return JSON.parse(storedTables) as GameTable[]
    } catch {
      return fallbackTables
    }
  })

  const saveTables = () => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(tables))
      return true
    } catch {
      return false
    }
  }

  return {
    tables,
    setTables,
    loadedFromStorage,
    saveTables,
  }
}
