'use client'

import { useState, useEffect } from 'react'

interface Task {
  id: string
  content: string
  completed: boolean
  timestamp: number
}

export default function Home() {
  const [completedTasks, setCompletedTasks] = useState<Task[]>([])
  const [plannedTasks, setPlannedTasks] = useState<Task[]>([])
  const [newTask, setNewTask] = useState('')

  // 从 LocalStorage 加载
  useEffect(() => {
    const savedCompleted = localStorage.getItem('completedTasks')
    const savedPlanned = localStorage.getItem('plannedTasks')
    if (savedCompleted) setCompletedTasks(JSON.parse(savedCompleted))
    if (savedPlanned) setPlannedTasks(JSON.parse(savedPlanned))
  }, [])

  // 保存到 LocalStorage
  useEffect(() => {
    localStorage.setItem('completedTasks', JSON.stringify(completedTasks))
  }, [completedTasks])

  useEffect(() => {
    localStorage.setItem('plannedTasks', JSON.stringify(plannedTasks))
  }, [plannedTasks])

  // 添加新计划
  const addTask = () => {
    if (!newTask.trim()) return
    const task: Task = {
      id: Date.now().toString(),
      content: newTask,
      completed: false,
      timestamp: Date.now(),
    }
    setPlannedTasks([task, ...plannedTasks])
    setNewTask('')
  }

  // 完成任务（移到已完成）
  const completeTask = (id: string) => {
    const task = plannedTasks.find(t => t.id === id)
    if (task) {
      setPlannedTasks(plannedTasks.filter(t => t.id !== id))
      setCompletedTasks([{ ...task, completed: true }, ...completedTasks])
    }
  }

  // 删除任务
  const deleteTask = (id: string, isCompleted: boolean) => {
    if (isCompleted) {
      setCompletedTasks(completedTasks.filter(t => t.id !== id))
    } else {
      setPlannedTasks(plannedTasks.filter(t => t.id !== id))
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">🌟 每日任务追踪</h1>
            <span className="text-sm text-gray-500">{new Date().toLocaleDateString('zh-CN')}</span>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 输入区 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">💬 期待要做的事情</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTask()}
              placeholder="输入你想让 AI 做的事..."
              className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
            <button
              onClick={addTask}
              className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors text-sm"
            >
              添加
            </button>
          </div>
        </div>

        {/* 已完成 */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              ✅ 今日完成
              <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                {completedTasks.length}
              </span>
            </h2>
          </div>
          <div className="divide-y divide-gray-50">
            {completedTasks.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-400 text-sm">
                还没有完成的任务，去完成一些吧！
              </div>
            ) : (
              completedTasks.map((task) => (
                <div key={task.id} className="px-4 py-3 flex items-start gap-3 group hover:bg-gray-50">
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center mt-0.5 flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-700 text-sm line-through">{task.content}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(task.timestamp)}</p>
                  </div>
                  <button
                    onClick={() => deleteTask(task.id, true)}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* 下一步计划 */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              📝 下一步计划
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                {plannedTasks.length}
              </span>
            </h2>
          </div>
          <div className="divide-y divide-gray-50">
            {plannedTasks.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-400 text-sm">
                暂无计划，在上面添加你想做的事情吧！
              </div>
            ) : (
              plannedTasks.map((task) => (
                <div key={task.id} className="px-4 py-3 flex items-start gap-3 group hover:bg-gray-50">
                  <button
                    onClick={() => completeTask(task.id)}
                    className="w-5 h-5 rounded-full border-2 border-gray-300 hover:border-blue-500 flex items-center justify-center mt-0.5 flex-shrink-0 transition-colors"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-800 text-sm">{task.content}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(task.timestamp)}</p>
                  </div>
                  <button
                    onClick={() => deleteTask(task.id, false)}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* AI 回复区 */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm">🤖</span>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900">AI 助手</p>
              <p className="text-sm text-blue-700 mt-1">
                收到你的需求！我会帮你完成这些任务，完成后会自动移到"今日完成"区域。
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
