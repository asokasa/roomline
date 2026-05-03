import { useMemo, useState } from 'react'
import styles from './App.module.css'
import { AddTableModal } from './components/AddTableModal'
import { Room } from './components/Room'
import { RoomControls } from './components/RoomControls'
import { SummaryPanel } from './components/SummaryPanel'
import { TableDetails } from './components/TableDetails'
import { INITIAL_ROOM_SIZE, TABLE_TYPE_LABELS } from './constants'
import rawTables from './data/tables.json'
import type { GameTable, NewTableDraft, Position, RawGameTable } from './types'
import {
  getClearanceIssueIds,
  getPlacementError,
  normalizeTables,
  roundPosition,
} from './utils/tableGeometry'

const INITIAL_TABLES = normalizeTables(rawTables as RawGameTable[])

function nextId(tables: GameTable[]) {
  return tables.reduce((maxId, table) => Math.max(maxId, table.id), 0) + 1
}

function validStatus(status: number) {
  return Math.min(Math.max(status, 1), 10)
}

function App() {
  const [tables, setTables] = useState<GameTable[]>(INITIAL_TABLES)
  const [roomSize, setRoomSize] = useState(INITIAL_ROOM_SIZE)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [pendingTable, setPendingTable] = useState<NewTableDraft | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const selectedTable = tables.find((table) => table.id === selectedId) ?? null
  const clearanceIssueIds = useMemo(
    () => getClearanceIssueIds(tables, roomSize),
    [roomSize, tables],
  )

  const addTable = (draft: NewTableDraft, position: Position) => {
    const newTable: GameTable = {
      ...draft,
      id: nextId(tables),
      position: roundPosition(position),
    }
    const error = getPlacementError(newTable, tables, roomSize)

    if (error) {
      setFeedback(error)
      return false
    }

    setTables([...tables, newTable])
    setSelectedId(newTable.id)
    setPendingTable(null)
    setFeedback('sikeres lerakas')
    return true
  }

  const handleAddAtCoordinates = (
    draft: NewTableDraft,
    position: Position,
  ) => {
    if (addTable(draft, position)) {
      setIsAddModalOpen(false)
    }
  }

  const handleStartPlacement = (draft: NewTableDraft) => {
    setPendingTable(draft)
    setSelectedId(null)
    setIsAddModalOpen(false)
    setFeedback(`${TABLE_TYPE_LABELS[draft.type]} lerakas folyamatban`)
  }

  const handleMoveTable = (id: number, position: Position) => {
    setTables((currentTables) =>
      currentTables.map((table) =>
        table.id === id ? { ...table, position: roundPosition(position) } : table,
      ),
    )
  }

  const handleMoveFinished = (
    id: number,
    originPosition: Position,
    finalPosition: Position,
  ) => {
    const movedTable = tables.find((table) => table.id === id)

    if (!movedTable) {
      return
    }

    const candidate = {
      ...movedTable,
      position: roundPosition(finalPosition),
    }
    const error = getPlacementError(candidate, tables, roomSize)

    if (error) {
      setTables((currentTables) =>
        currentTables.map((table) =>
          table.id === id ? { ...table, position: originPosition } : table,
        ),
      )
      setFeedback(error)
      return
    }

    setFeedback('az asztal helye frissult')
  }

  const handleStatusChange = (id: number, status: number) => {
    setTables((currentTables) =>
      currentTables.map((table) =>
        table.id === id ? { ...table, status: validStatus(status) } : table,
      ),
    )
    setFeedback(null)
  }

  const handleDeleteTable = (id: number) => {
    setTables((currentTables) => currentTables.filter((table) => table.id !== id))
    setSelectedId(null)
    setFeedback('asztal torolve')
  }

  const handleApplyRoomSize = (nextRoomSize: typeof roomSize) => {
    setRoomSize(nextRoomSize)
    setTables([])
    setSelectedId(null)
    setPendingTable(null)
    setFeedback('uj terem meret, asztalok torolve')
  }

  const handleReloadInitialTables = () => {
    setRoomSize(INITIAL_ROOM_SIZE)
    setTables(INITIAL_TABLES)
    setSelectedId(null)
    setPendingTable(null)
    setFeedback('az eredeti asztalok betoltodtek.')
  }

  return (
    <div className={styles.appShell}>
      <header className={styles.appHeader}>
        <div>
          <p className={styles.eyebrow}>roomlie</p>
          <h1>asztal lepakolo</h1>
        </div>
        <div className={styles.headerMetrics} aria-label="Terem adatok">
          <span>{tables.length} asztal</span>
          <span>
            {roomSize.width} x {roomSize.height} px
          </span>
        </div>
      </header>

      {feedback ? (
        <div className={styles.feedback} role="status">
          {feedback}
        </div>
      ) : null}

      <main className={styles.appLayout}>
        <div className={styles.workspace}>
          <Room
            tables={tables}
            roomSize={roomSize}
            selectedId={selectedId}
            clearanceIssueIds={clearanceIssueIds}
            pendingTable={pendingTable}
            onSelectTable={setSelectedId}
            onMoveTable={handleMoveTable}
            onMoveFinished={handleMoveFinished}
            onPlacePendingTable={(position) => {
              if (pendingTable) {
                addTable(pendingTable, position)
              }
            }}
            onCancelPendingTable={() => {
              setPendingTable(null)
              setFeedback(null)
            }}
          />

          <SummaryPanel tables={tables} />
        </div>

        <aside className={styles.sidebar}>
          <RoomControls
            roomSize={roomSize}
            tableCount={tables.length}
            onApplyRoomSize={handleApplyRoomSize}
            onOpenAddTable={() => setIsAddModalOpen(true)}
            onReloadInitialTables={handleReloadInitialTables}
          />

          <TableDetails
            table={selectedTable}
            hasClearanceIssue={
              selectedTable ? clearanceIssueIds.has(selectedTable.id) : false
            }
            onDelete={handleDeleteTable}
            onStatusChange={handleStatusChange}
          />
        </aside>
      </main>

      {isAddModalOpen ? (
        <AddTableModal
          open={isAddModalOpen}
          roomSize={roomSize}
          onClose={() => setIsAddModalOpen(false)}
          onAddAtCoordinates={handleAddAtCoordinates}
          onStartPlacement={handleStartPlacement}
        />
      ) : null}
    </div>
  )
}

export default App
