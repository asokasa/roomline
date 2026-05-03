export type TableType = 'snooker' | 'air-hockey' | 'foosball'

export type TableCategory = 'competition' | 'normal' | 'kids'

export type TableColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple'

export type Position = {
  x: number
  y: number
}

export type RoomSize = {
  width: number
  height: number
}

export type GameTable = {
  id: number
  type: TableType
  category: TableCategory
  color: TableColor
  status: number
  position: Position
  isLocked: boolean
}

export type RawGameTable = Omit<GameTable, 'isLocked'> & {
  'is-locked': boolean
}

export type NewTableDraft = Omit<GameTable, 'id' | 'position'>
