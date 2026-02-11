'use client'

import { useState, useEffect } from 'react'
import AgentProfile from '../components/AgentProfile'
import StatDetailModal from '../components/StatDetailModal'
import { 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  Clock,
  Plus,
  Home,
  User,
  ClipboardList,
  BarChart3
} from 'lucide-react'

interface Agent {
  id: string
  name: string
  avatar: string
  role: string
  description: string
  skills: Array<{ skill_name: string; proficiency: number; status: string }>
  personality: string
}

interface Task {
  id: string
  title: string
  agent_id: string
  category: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  created_at: string
  completed_at: string | null
}

interface Project {
  id: string
  name: string
  description: string
  status: string
  progress: number
  team_members: string[]
}

interface AgentStat {
  agentId: string
  agentName: string
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  pendingTasks: number
  completionRate: number
  totalAchievements: number
  totalSkills: number
  masteredSkills: number
}

interface Stats {
  totalAgents: number
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  pendingTasks: number
  totalProjects: number
  activeProjects: number
  totalAchievements: number
  taskCompletionRate: number
  agentStats: AgentStat[]
}

const API_BASE = '/api'

// 根据代理名称映射颜色（支持动态ID）
const getAgentColor = (name: string): string => {
  const colorMap: Record<string, string> = {
    'Power': 'bg-gradient-to-br from-blue-400 to-blue-600',
    '代码哥': 'bg-gradient-to-br from-green-400 to-green-600',
    '美化姐': 'bg-gradient-to-br from-pink-400 to-pink-600',
    '测试哥': 'bg-gradient-to-br from-orange-400 to-orange-600',
    '游资哥': 'bg-gradient-to-br from-purple-400 to-purple-600',
  }
  return colorMap[name] || 'bg-gradient-to-br from-gray-400 to-gray-600'
}

const statusLabels: Record<string, string> = {
  'pending': '待开始',
  'in_progress': '进行中',
  'completed': '已完成',
  'cancelled': '已取消',
}

const statusColors: Record<string, string> = {
  'pending': 'bg-gray-100 text-gray-600 border-gray-200',
  'in_progress': 'bg-amber-50 text-amber-700 border-amber-200',
  'completed': 'bg-green-50 text-green-700 border-green-200',
  'cancelled': 'bg-red-50 text-red-700 border-red-200',
}

const priorityLabels: Record<string, string> = {
  'low': '低',
  'medium': '中',
  'high': '高',
  'urgent': '紧急',
}

const priorityColors: Record<string, string> = {
  'low': 'bg-gray-100 text-gray-600',
  'medium': 'bg-blue-50 text-blue-700',
  'high': 'bg-orange-50 text-orange-700',
  'urgent': 'bg-red-50 text-red-700',
}

// 统计卡片配置
const statConfig = [
  { 
    key: 'totalTasks', 
    label: '总任务', 
    icon: ClipboardList, 
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    description: '系统中所有任务的总数'
  },
  { 
    key: 'completedTasks', 
    label: '已完成', 
    icon: CheckCircle2, 
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    description: '已完成的任务数量'
  },
  { 
    key: 'inProgressTasks', 
    label: '进行中', 
    icon: Clock, 
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    description: '正在进行的任务'
  },
  { 
    key: 'taskCompletionRate', 
    label: '完成率', 
    icon: TrendingUp, 
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    description: '任务完成率百分比',
    suffix: '%'
  },
]

export default function V2Dashboard() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // 筛选状态
  const [filterAgent, setFilterAgent] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  
  // 页面导航状态
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [selectedStat, setSelectedStat] = useState<any>(null)
  const [isStatModalOpen, setIsStatModalOpen] = useState(false)

  // 获取数据
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        
        // 并行获取所有数据
        const [agentsRes, tasksRes, projectsRes, statsRes] = await Promise.all([
          fetch(`${API_BASE}/agents`),
          fetch(`${API_BASE}/tasks?pageSize=100`),
          fetch(`${API_BASE}/projects`),
          fetch(`${API_BASE}/stats`)
        ])

        if (!agentsRes.ok || !tasksRes.ok || !projectsRes.ok || !statsRes.ok) {
          throw new Error('Failed to fetch data')
        }

        const [agentsData, tasksData, projectsData, statsData] = await Promise.all([
          agentsRes.json(),
          tasksRes.json(),
          projectsRes.json(),
          statsRes.json()
        ])

        setAgents(agentsData.data?.agents || agentsData.data || [])
        setTasks(tasksData.data || [])
        setProjects(projectsData.data || [])
        setStats(statsData.data || null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        // 使用示例数据
        loadSampleData()
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // 示例数据（API失败时使用）
  const loadSampleData = () => {
    const sampleAgents: Agent[] = [
      {
        id: 'agent_power',
        name: 'Power',
        avatar: '🤖',
        role: '系统协调者',
        description: '主AI助手，统筹协调所有代理任务',
        personality: '冷静、高效',
        skills: [{ skill_name: '系统架构', proficiency: 9, status: 'mastered' }]
      },
      {
        id: 'agent_daima',
        name: '代码哥',
        avatar: '👨‍💻',
        role: '全栈工程师',
        description: '全能编程专家，负责后端开发',
        personality: '专注、严谨',
        skills: [{ skill_name: 'TypeScript', proficiency: 9, status: 'mastered' }]
      },
      {
        id: 'agent_meihua',
        name: '美化姐',
        avatar: '🎨',
        role: 'UI/UX设计师',
        description: '界面美化和用户体验优化专家',
        personality: '创意、细致',
        skills: [{ skill_name: 'UI设计', proficiency: 8, status: 'mastered' }]
      },
      {
        id: 'agent_ceshi',
        name: '测试哥',
        avatar: '🧪',
        role: 'QA工程师',
        description: '质量保证专家，负责功能测试',
        personality: '细心、负责',
        skills: [{ skill_name: '自动化测试', proficiency: 7, status: 'practicing' }]
      },
      {
        id: 'agent_youzi',
        name: '游资哥',
        avatar: '📈',
        role: '数据分析师',
        description: '股票数据分析专家，AKShare深度用户',
        personality: '敏锐、理性',
        skills: [{ skill_name: '数据分析', proficiency: 8, status: 'mastered' }]
      },
    ]

    const sampleTasks: Task[] = [
      { id: '1', title: '设计系统架构', agent_id: 'agent_power', category: 'architecture', status: 'completed', priority: 'high', created_at: '2026-02-10T09:00:00Z', completed_at: '2026-02-10T15:00:00Z' },
      { id: '2', title: '开发API接口', agent_id: 'agent_daima', category: 'backend', status: 'completed', priority: 'high', created_at: '2026-02-10T10:00:00Z', completed_at: '2026-02-10T18:00:00Z' },
      { id: '3', title: '设计UI组件', agent_id: 'agent_meihua', category: 'design', status: 'in_progress', priority: 'high', created_at: '2026-02-11T09:00:00Z', completed_at: null },
      { id: '4', title: '编写测试用例', agent_id: 'agent_ceshi', category: 'testing', status: 'pending', priority: 'medium', created_at: '2026-02-11T10:00:00Z', completed_at: null },
      { id: '5', title: '股票数据调研', agent_id: 'agent_youzi', category: 'research', status: 'in_progress', priority: 'medium', created_at: '2026-02-11T08:00:00Z', completed_at: null },
    ]

    const sampleProjects: Project[] = [
      { id: '1', name: '成长网站V2', description: 'AI代理成长追踪系统', status: 'active', progress: 75, team_members: ['agent_power', 'agent_daima', 'agent_meihua', 'agent_ceshi'] },
      { id: '2', name: '股票数据模块', description: 'V3.0股票分析功能', status: 'planning', progress: 20, team_members: ['agent_youzi', 'agent_power'] },
    ]

    const sampleStats: Stats = {
      totalAgents: 5,
      totalTasks: 25,
      completedTasks: 15,
      inProgressTasks: 5,
      pendingTasks: 5,
      totalProjects: 2,
      activeProjects: 1,
      totalAchievements: 12,
      taskCompletionRate: 60,
      agentStats: sampleAgents.map(agent => ({
        agentId: agent.id,
        agentName: agent.name,
        totalTasks: 5,
        completedTasks: 3,
        inProgressTasks: 1,
        pendingTasks: 1,
        completionRate: 60,
        totalAchievements: 2,
        totalSkills: 3,
        masteredSkills: 2,
      }))
    }

    setAgents(sampleAgents)
    setTasks(sampleTasks)
    setProjects(sampleProjects)
    setStats(sampleStats)
  }

  // 筛选任务
  const filteredTasks = tasks.filter(task => {
    if (filterAgent && task.agent_id !== filterAgent) return false
    if (filterStatus && task.status !== filterStatus) return false
    return true
  })

  // 获取代理名称
  const getAgentName = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId)
    return agent?.name || agentId
  }

  // 获取代理头像
  const getAgentAvatar = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId)
    return agent?.avatar || '👤'
  }

  // 格式化日期
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 处理统计卡片点击
  const handleStatClick = (statConfig: any) => {
    if (!stats) return
    
    const statData = {
      label: statConfig.label,
      value: stats[statConfig.key as keyof Stats] as number,
      icon: statConfig.icon,
      color: statConfig.color,
      description: statConfig.description,
      agentStats: stats.agentStats
    }
    
    setSelectedStat(statData)
    setIsStatModalOpen(true)
  }

  // 处理代理点击（从弹窗）
  const handleAgentClickFromModal = (agentId: string) => {
    setIsStatModalOpen(false)
    setSelectedAgentId(agentId)
  }

  // 如果选中代理，显示代理详情页
  if (selectedAgentId) {
    return (
      <AgentProfile 
        agentId={selectedAgentId} 
        onBack={() => setSelectedAgentId(null)}
        onMessage={(id) => console.log('Message agent:', id)}
      />
    )
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </main>
    )
  }

  if (error && agents.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
          <p className="text-red-500 text-lg">❌ 加载失败</p>
          <p className="text-gray-600 mt-2">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
          >
            重试
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">🤖 AI 助手成长追踪 V2.0</h1>
              <p className="text-sm text-gray-500 mt-1">可扩展的多代理任务管理系统</p>
            </div>
            <div className="flex gap-4 sm:text-right">
              <div className="text-center sm:text-right">
                <p className="text-xs text-gray-500">总任务</p>
                <p className="text-xl font-bold text-indigo-600">{stats?.totalTasks || 0}</p>
              </div>
              <div className="text-center sm:text-right">
                <p className="text-xs text-gray-500">完成率</p>
                <p className="text-xl font-bold text-green-600">{stats?.taskCompletionRate || 0}%</p>
              </div>
              <div className="text-center sm:text-right">
                <p className="text-xs text-gray-500">代理数</p>
                <p className="text-xl font-bold text-purple-600">{stats?.totalAgents || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 sm:space-y-8">
        {/* 统计概览卡片 - 可点击 */}
        <section>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {statConfig.map((stat) => {
              const Icon = stat.icon
              const value = stats?.[stat.key as keyof Stats] as number || 0
              
              return (
                <button
                  key={stat.key}
                  onClick={() => handleStatClick(stat)}
                  className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-5 text-left hover:shadow-md hover:border-indigo-200 transition-all group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 ${stat.bgColor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color}`} />
                    </div>
                    <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">查看详情 →</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500">{stat.label}</p>
                  <p className={`text-2xl sm:text-3xl font-bold ${stat.color} mt-0.5`}>
                    {value}{stat.suffix || ''}
                  </p>
                </button>
              )
            })}
          </div>
        </section>

        {/* 代理团队卡片 - 支持5个代理 */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">👥 代理团队</h2>
            <span className="text-xs sm:text-sm text-gray-500">{agents.length} 位成员</span>
          </div>
          
          {/* 响应式网格：手机2列，平板3列，桌面5列 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {agents.map(agent => {
              const agentStat = stats?.agentStats.find(s => s.agentId === agent.id)
              const isActive = filterAgent === agent.id
              
              return (
                <div 
                  key={agent.id}
                  onClick={() => setSelectedAgentId(agent.id)}
                  className={`bg-white rounded-xl sm:rounded-2xl shadow-sm border p-3 sm:p-4 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${
                    isActive ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200'
                  }`}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-12 h-12 sm:w-16 sm:h-16 ${getAgentColor(agent.name)} rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shadow-lg mb-3`}>
                      {agent.avatar}
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate w-full">{agent.name}</h3>
                    <p className="text-xs text-gray-500 truncate w-full">{agent.role}</p>
                  </div>
                  
                  {/* 任务统计 */}
                  {agentStat && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-gray-500">完成率</span>
                        <span className="font-medium text-gray-900">{agentStat.completionRate}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-500"
                          style={{ width: `${agentStat.completionRate}%` }}
                        />
                      </div>
                      <p className="text-[10px] sm:text-xs text-gray-400 mt-1.5 text-center">
                        {agentStat.completedTasks}/{agentStat.totalTasks} 任务
                      </p>
                    </div>
                  )}

                  {/* 技能标签 */}
                  {agent.skills && agent.skills.length > 0 && (
                    <div className="mt-2 flex flex-wrap justify-center gap-1">
                      {agent.skills.slice(0, 2).map((skill, idx) => (
                        <span 
                          key={idx}
                          className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full"
                        >
                          {skill.skill_name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* 项目概览 */}
        <section>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">📁 项目概览</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {projects.map(project => (
              <div key={project.id} className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{project.name}</h3>
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{project.description}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                    project.status === 'active' ? 'bg-green-50 text-green-700 border border-green-200' :
                    project.status === 'completed' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                    'bg-gray-50 text-gray-600 border border-gray-200'
                  }`}>
                    {project.status === 'active' ? '进行中' : 
                     project.status === 'completed' ? '已完成' : '规划中'}
                  </span>
                </div>
                
                <div className="mt-4">
                  <div className="flex justify-between text-xs sm:text-sm mb-1.5">
                    <span className="text-gray-500">进度</span>
                    <span className="font-medium text-gray-900">{project.progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-1">
                  <span className="text-xs text-gray-400">团队:</span>
                  <div className="flex -space-x-1">
                    {project.team_members.slice(0, 4).map(memberId => (
                      <div 
                        key={memberId} 
                        className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs"
                        title={getAgentName(memberId)}
                      >
                        {getAgentAvatar(memberId)}
                      </div>
                    ))}
                    {project.team_members.length > 4 && (
                      <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs text-gray-500">
                        +{project.team_members.length - 4}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 任务列表 */}
        <section className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-4 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="font-semibold text-gray-900 text-base sm:text-lg">📝 任务列表</h2>
              
              {/* 筛选器 */}
              <div className="flex gap-2 flex-wrap">
                <select 
                  value={filterAgent}
                  onChange={(e) => setFilterAgent(e.target.value)}
                  className="text-xs sm:text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">所有代理</option>
                  {agents.map(agent => (
                    <option key={agent.id} value={agent.id}>{agent.name}</option>
                  ))}
                </select>

                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="text-xs sm:text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">所有状态</option>
                  <option value="pending">待开始</option>
                  <option value="in_progress">进行中</option>
                  <option value="completed">已完成</option>
                </select>

                {(filterAgent || filterStatus) && (
                  <button
                    onClick={() => { setFilterAgent(''); setFilterStatus('') }}
                    className="text-xs sm:text-sm px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    清除
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-50">
            {filteredTasks.length === 0 ? (
              <div className="px-4 py-12 text-center text-gray-400">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>暂无任务</p>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div key={task.id} className="px-4 py-4 flex items-start gap-3 hover:bg-gray-50 transition-colors">
                  <button
                    onClick={() => setSelectedAgentId(task.agent_id)}
                    className={`w-10 h-10 ${getAgentColor(getAgentName(task.agent_id))} rounded-full flex items-center justify-center flex-shrink-0 hover:scale-110 transition-transform`}
                  >
                    <span className="text-white text-sm">
                      {getAgentAvatar(task.agent_id)}
                    </span>
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-gray-800 font-medium text-sm sm:text-base">{task.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColors[task.priority]}`}>
                        {priorityLabels[task.priority]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 mt-1 text-xs sm:text-sm text-gray-500 flex-wrap">
                      <button 
                        onClick={() => setSelectedAgentId(task.agent_id)}
                        className="hover:text-indigo-600 transition-colors"
                      >
                        {getAgentName(task.agent_id)}
                      </button>
                      <span className="hidden sm:inline text-gray-300">•</span>
                      <span>{formatDate(task.created_at)}</span>
                      {task.category !== 'general' && (
                        <>
                          <span className="hidden sm:inline text-gray-300">•</span>
                          <span className="text-gray-400">{task.category}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap border ${statusColors[task.status]}`}>
                    {statusLabels[task.status]}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* 系统信息 */}
        <footer className="text-center text-xs text-gray-400 pt-4 pb-4">
          <p>成长网站 V2.0 | Next.js + SQLite | 支持无限代理扩展</p>
          <p className="mt-1">数据更新时间: {new Date().toLocaleString('zh-CN')}</p>
        </footer>
      </div>

      {/* 统计详情弹窗 */}
      <StatDetailModal
        stat={selectedStat}
        isOpen={isStatModalOpen}
        onClose={() => setIsStatModalOpen(false)}
        onAgentClick={handleAgentClickFromModal}
        getAgentAvatar={getAgentAvatar}
      />

      {/* 移动端底部导航 */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50 safe-area-pb">
        <div className="flex items-center justify-around">
          <button className="flex flex-col items-center gap-0.5 p-2 text-indigo-600">
            <Home className="w-5 h-5" />
            <span className="text-[10px]">首页</span>
          </button>
          <button 
            onClick={() => {
              const firstAgent = agents[0]
              if (firstAgent) setSelectedAgentId(firstAgent.id)
            }}
            className="flex flex-col items-center gap-0.5 p-2 text-gray-500"
          >
            <User className="w-5 h-5" />
            <span className="text-[10px]">代理</span>
          </button>
          <button className="flex flex-col items-center justify-center w-12 h-12 -mt-4 bg-indigo-500 rounded-full shadow-lg text-white hover:bg-indigo-600 transition-colors">
            <Plus className="w-6 h-6" />
          </button>
          <button className="flex flex-col items-center gap-0.5 p-2 text-gray-500">
            <ClipboardList className="w-5 h-5" />
            <span className="text-[10px]">任务</span>
          </button>
          <button className="flex flex-col items-center gap-0.5 p-2 text-gray-500">
            <BarChart3 className="w-5 h-5" />
            <span className="text-[10px]">统计</span>
          </button>
        </div>
      </nav>
    </main>
  )
}
