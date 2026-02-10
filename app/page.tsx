'use client'

import { useState } from 'react'

interface Task {
  id: string
  content: string
  agent: 'Power' | '代码哥' | '美化姐' | '测试哥'
  status: '已完成' | '进行中' | '待开始'
  timestamp: string
}

interface DailyLog {
  date: string
  tasks: Task[]
  summary: string
}

// 历史任务数据
const historyData: DailyLog[] = [
  {
    date: '2026-02-10',
    summary: '创建代码哥 Skill，开发每日任务追踪网站',
    tasks: [
      { id: '1', content: '创建 daima-ge Skill 完整配置', agent: 'Power', status: '已完成', timestamp: '10:00' },
      { id: '2', content: '配置 GITHUB_TOKEN 和 VERCEL_TOKEN', agent: 'Power', status: '已完成', timestamp: '10:30' },
      { id: '3', content: '开发每日任务追踪网站核心功能', agent: '代码哥', status: '已完成', timestamp: '14:00' },
      { id: '4', content: '创建 GitHub 仓库并推送代码', agent: '代码哥', status: '已完成', timestamp: '15:30' },
      { id: '5', content: '部署网站到 Vercel', agent: '代码哥', status: '已完成', timestamp: '18:45' },
      { id: '6', content: '上传工作日志到 GitHub', agent: 'Power', status: '已完成', timestamp: '19:00' },
    ]
  },
  {
    date: '2026-02-09',
    summary: 'OpenClaw 初始化配置，安装多个技能',
    tasks: [
      { id: '1', content: '完成 OpenClaw 基础配置', agent: 'Power', status: '已完成', timestamp: '09:00' },
      { id: '2', content: '设置时区为 Asia/Shanghai', agent: 'Power', status: '已完成', timestamp: '09:15' },
      { id: '3', content: '配置飞书渠道连接', agent: 'Power', status: '已完成', timestamp: '10:00' },
      { id: '4', content: '安装 QQ Bot 插件', agent: 'Power', status: '已完成', timestamp: '10:30' },
      { id: '5', content: '安装钉钉插件', agent: 'Power', status: '已完成', timestamp: '11:00' },
      { id: '6', content: '安装企业微信插件', agent: 'Power', status: '已完成', timestamp: '11:30' },
      { id: '7', content: '安装 session-memory 技能', agent: 'Power', status: '已完成', timestamp: '14:00' },
      { id: '8', content: '安装 qqbot-cron 智能提醒技能', agent: 'Power', status: '已完成', timestamp: '14:30' },
      { id: '9', content: '安装 agent-browser 浏览器自动化技能', agent: 'Power', status: '已完成', timestamp: '15:00' },
      { id: '10', content: '阅读 OpenClaw 官方文档并总结', agent: 'Power', status: '已完成', timestamp: '16:15' },
    ]
  },
  {
    date: '2026-02-08',
    summary: '系统初始化，基础环境配置',
    tasks: [
      { id: '1', content: '初始化 OpenClaw 工作空间', agent: 'Power', status: '已完成', timestamp: '09:00' },
      { id: '2', content: '创建基础配置文件', agent: 'Power', status: '已完成', timestamp: '10:00' },
    ]
  }
]

const agentColors: Record<string, string> = {
  'Power': 'bg-blue-500',
  '代码哥': 'bg-green-500',
  '美化姐': 'bg-pink-500',
  '测试哥': 'bg-orange-500',
}

const statusColors: Record<string, string> = {
  '已完成': 'bg-green-100 text-green-700',
  '进行中': 'bg-yellow-100 text-yellow-700',
  '待开始': 'bg-gray-100 text-gray-600',
}

export default function Home() {
  const [selectedDate, setSelectedDate] = useState('2026-02-10')
  const [filterAgent, setFilterAgent] = useState<string | null>(null)

  const currentLog = historyData.find(log => log.date === selectedDate) || historyData[0]
  
  const filteredTasks = filterAgent 
    ? currentLog.tasks.filter(t => t.agent === filterAgent)
    : currentLog.tasks

  const completedCount = currentLog.tasks.filter(t => t.status === '已完成').length
  const totalCount = currentLog.tasks.length

  // 统计各代理任务数
  const agentStats = currentLog.tasks.reduce((acc, task) => {
    acc[task.agent] = (acc[task.agent] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">🤖 AI 助手工作汇报</h1>
              <p className="text-sm text-gray-500 mt-1">Power & 代理团队每日任务追踪</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">今日完成</p>
              <p className="text-2xl font-bold text-green-600">{completedCount}/{totalCount}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* 日期选择器 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">📅 历史任务查询</h2>
          <div className="flex gap-2 flex-wrap">
            {historyData.map(log => (
              <button
                key={log.date}
                onClick={() => setSelectedDate(log.date)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  selectedDate === log.date
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {log.date}
              </button>
            ))}
          </div>
        </div>

        {/* 代理团队统计 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(agentStats).map(([agent, count]) => (
            <button
              key={agent}
              onClick={() => setFilterAgent(filterAgent === agent ? null : agent)}
              className={`bg-white rounded-2xl shadow-sm border p-4 text-center transition-all ${
                filterAgent === agent ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
              }`}
            >
              <div className={`w-10 h-10 ${agentColors[agent]} rounded-full flex items-center justify-center mx-auto mb-2`}>
                <span className="text-white text-lg">
                  {agent === 'Power' ? '🤖' : agent === '代码哥' ? '👨‍💻' : agent === '美化姐' ? '🎨' : '🧪'}
                </span>
              </div>
              <p className="font-semibold text-gray-900">{agent}</p>
              <p className="text-2xl font-bold text-blue-600">{count}</p>
              <p className="text-xs text-gray-500">任务</p>
            </button>
          ))}
        </div>

        {/* 当日摘要 */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white">📊</span>
            </div>
            <div>
              <p className="font-semibold text-blue-900">{selectedDate} 工作摘要</p>
              <p className="text-sm text-blue-700 mt-1">{currentLog.summary}</p>
            </div>
          </div>
        </div>

        {/* 任务列表 */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              ✅ 任务清单
              {filterAgent && (
                <span className="text-sm font-normal text-gray-500">
                  ({filterAgent} 的任务)
                </span>
              )}
            </h2>
            {filterAgent && (
              <button
                onClick={() => setFilterAgent(null)}
                className="text-sm text-blue-500 hover:text-blue-600"
              >
                显示全部
              </button>
            )}
          </div>
          <div className="divide-y divide-gray-50">
            {filteredTasks.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-400 text-sm">
                该代理暂无任务
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div key={task.id} className="px-4 py-3 flex items-start gap-3 hover:bg-gray-50">
                  <div className={`w-8 h-8 ${agentColors[task.agent]} rounded-full flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white text-xs">
                      {task.agent === 'Power' ? '🤖' : task.agent === '代码哥' ? '💻' : task.agent === '美化姐' ? '🎨' : '🧪'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-gray-800 text-sm">{task.content}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{task.agent}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">{task.timestamp}</span>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${statusColors[task.status]}`}>
                    {task.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* 团队介绍 */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-900 mb-4">👥 代理团队</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white">🤖</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Power</p>
                <p className="text-sm text-gray-600">主 AI 助手，统筹协调所有任务</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-xl">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white">👨‍💻</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">代码哥</p>
                <p className="text-sm text-gray-600">全能编程专家，代码编写和部署</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-pink-50 rounded-xl">
              <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white">🎨</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">美化姐</p>
                <p className="text-sm text-gray-600">UI/UX 设计师，界面美化和优化</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-xl">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white">🧪</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">测试哥</p>
                <p className="text-sm text-gray-600">质量保证，功能测试和 Bug 修复</p>
              </div>
            </div>
          </div>
        </section>

        {/* 数据更新时间 */}
        <div className="text-center text-xs text-gray-400">
          数据更新时间: {new Date().toLocaleString('zh-CN')}
        </div>
      </div>
    </main>
  )
}
