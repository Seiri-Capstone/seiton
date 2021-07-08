import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import axios from 'axios'

const initialState = []

export const fetchProject = createAsyncThunk(
  'project/fetchProject',
  async projectId => {
    // try catch here
    const response = await fetch(`/api/project/${projectId}`)

    // ultimately we want it to represent an array form
    return await response.json()
    // Get back sorted array
  }
)
// POST route for tasks with axios
export const createTask = createAsyncThunk('project/createTask', async body => {
  const { data: createdTask } = await axios.post('/api/task', body)
  return createdTask
})
// POST route for columns with axios
export const createColumn = createAsyncThunk(
  'project/createColumn',
  async body => {
    const { data: createdColumn } = await axios.post('/api/column', body)
    return createdColumn
  }
)

export const fetchReorderColumn = createAsyncThunk(
  'project/fetchReorderColumn',
  async thunkArg => {
    const { result, project } = thunkArg
    const { source, destination } = result
    const columnToMove = project.columns[source.index]
    const newColumns = Array.from(project.columns)
    newColumns.splice(source.index, 1) //take out column from previous columns
    newColumns.splice(destination.index, 0, columnToMove) //insert column into new columns
    const reorderedCol = await newColumns.map((column, idx) => {
      return { ...column, index: idx }
    })

    Promise.all(reorderedCol.map(column => axios.put('/api/column', column)))

    return reorderedCol
  }
)

export const fetchReorderTask = createAsyncThunk(
  'project/fetchReorderTask',
  async thunkArg => {
    const { tasks, sourceIdx, destIdx, columns, finishColId } = thunkArg
    const taskToMove = tasks[sourceIdx]
    tasks.splice(sourceIdx, 1)
    tasks.splice(destIdx, 0, taskToMove)
    const destColId = columns[finishColId].id

    const reorderedTask = tasks.map((task, idx) => {
      return { ...task, index: idx, columnId: destColId }
    }) //update index property

    /**
     * Promise all seems to be awaited?
     * no flicker or re-rendering issues
     */
    Promise.all(reorderedTask.map(task => axios.put('/api/task', task)))
    return reorderedTask
  }
)

export const fetchTaskOrderDiffCol = createAsyncThunk(
  'project/fetchTaskOrderDiffCol',
  async thunkArg => {
    const {
      startTasks,
      finishTasks,
      sourceIdx,
      destIdx,
      startColId,
      finishColId,
      columns
    } = thunkArg
    const taskToMove = startTasks[sourceIdx]
    startTasks.splice(sourceIdx, 1)
    finishTasks.splice(destIdx, 0, taskToMove)
    const destColId = columns[finishColId].id

    const updatedFinishTasks = finishTasks.map((task, idx) => {
      return { ...task, columnId: destColId, index: idx }
    })

    console.log('start', startTasks, startColId)
    console.log('finish', updatedFinishTasks, finishColId)

    Promise.all(updatedFinishTasks.map(task => axios.put('/api/task', task)))

    return { startTasks, finishTasks, startColId, finishColId }
  }
)

export const fetchEditTask = createAsyncThunk(
  'project/fetchEditTask',
  async task => {
    const res = await axios.put('/api/task', task)
    return res
  }
)

export const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    // updateColumn: (state, action) => (state.columns = action.payload.columns)
  },
  extraReducers: {
    [createTask.fulfilled]: (state, action) => {
      const { columnId } = action.payload
      // Parse columns from proxy state to an array
      // Get index of column for added task by columnId
      const updatedColId = JSON.parse(JSON.stringify(state.columns)).filter(
        col => col.id === columnId
      )[0].index
      state.columns[updatedColId].tasks.push(action.payload)
    },
    [createColumn.fulfilled]: (state, action) => {
      state.columns.push(action.payload)
    },
    [fetchProject.fulfilled]: (state, action) => {
      return action.payload
    },
    [fetchReorderColumn.fulfilled]: (state, action) => {
      state.columns = action.payload
    },
    [fetchReorderTask.fulfilled]: (state, action) => {
      const columns = state.columns
      const colId = action.payload[0].columnId

      columns.forEach(column => {
        if (column.id === colId) {
          column.tasks = action.payload
        }
      })
    },
    [fetchTaskOrderDiffCol.fulfilled]: (state, action) => {
      const { startTasks, finishTasks, startColId, finishColId } =
        action.payload
      const columns = state.columns
      columns.forEach((column, idx) => {
        if (idx === startColId) column.tasks = startTasks
        if (idx === finishColId) column.tasks = finishTasks
      })
    },
    [fetchEditTask.fulfilled]: (state, action) => {
      console.log('here')
      const colId = action.payload.data.columnId
      const taskId = action.payload.data.id
      const columns = state.columns
      //this can probably be refactored
      for (let i = 0; i < columns.length; i++) {
        for (let j = 0; j < columns[i].tasks.length; j++) {
          const tasks = columns[i].tasks
          if (tasks[j].id === taskId) {
            tasks[j] = action.payload.data
          }
        }
      }
    }
  }
})

export const { updateTaskOrderSameCol, updateTaskOrderDiffCol } =
  projectSlice.actions

export default projectSlice.reducer
