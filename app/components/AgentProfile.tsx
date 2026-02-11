'use client'

import { useState, useEffect } from 'react'
import { 
  ArrowLeft, 
  Mail, 
  Share2, 
  Settings, 
  Trophy, 
  Target, 
  Clock, 
  Star,
  TrendingUp,
  Award,
  Zap,
  Calendar,
  CheckCircle2,
  Circle,
  Clock4
} from 'lucide-react'

// 类型定义
interface Skill {
  id: string
  skill_name: string
  proficiency: number
  status: 'learning' | 'practicing' | 'mastered'
  expected_date?: string
}

interface Achievement {
  id: string
  badge_name: string
  description: string
  earned_at: string
  icon?: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

interface Task {
  id: string
  title: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  created_at: string
  completed_at?: string
  category: string
}

interface Project {
  id: string
  name: string
  description: string
  status: string
  progress: number
}

interface AgentStats {
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  pendingTasks: number
  completionRate: number
  totalSkills: number
  masteredSkills: number
  learningSkills: number
  totalAchievements: number
  rareAchievements: number
}

interface AgentData {
  id: string
  name: string
  avatar: string
  role: string
  description: string
  personality: string
  skills: Skill[]
  achievements: Achievement[]
  tasks: Task[]
  projects: Project[]
  stats: AgentStats
}

interface AgentProfileProps {
  agentId: string
  onBack: () => void
  onMessage?: (agentId: string) => void
}

// 辅助函数
const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'legendary': return 'from-amber-400 via-orange-500 to-red-500'
    case 'epic': return 'from-purple-400 via-pink-500 to-rose-500'
    case 'rare': return 'from-blue-400 via-cyan-500 to-teal-500'
    default: return 'from-gray-300 via-gray-400 to-gray-500'
  }
}

const getRarityBg = (rarity: string) => {
  switch (rarity) {
    case 'legendary': return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'epic': return 'bg-purple-100 text-purple-700 border-purple-200'
    case 'rare': return 'bg-blue-100 text-blue-700 border-blue-200'
    default: return 'bg-gray-100 text-gray-600 border-gray-200'
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-700 border-green-200'
    case 'in_progress': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    case 'pending': return 'bg-gray-100 text-gray-600 border-gray-200'
    default: return 'bg-red-100 text-red-700 border-red-200'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed': return <CheckCircle2 className="w-4 h-4" />
    case 'in_progress': return <Clock4 className="w-4 h-4" />
    default: return <Circle className="w-4 h-4" />
  }
}

const getSkillStatusColor = (status: string) => {
  switch (status) {
    case 'mastered': return 'bg-green-500'
    case 'practicing': return 'bg-blue-500'
    default: return 'bg-amber-500'
  }
}

const getSkillStatusText = (status: string) => {
  switch (status) {
    case 'mastered': return '已掌握'
    case 'practicing': return '练习中'
    default: return '学习中'
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent': return 'text-red-600 bg-red-50'
    case 'high': return 'text-orange-600 bg-orange-50'
    case 'medium': return 'text-blue-600 bg-blue-50'
    default: return 'text-gray-600 bg-gray-50'
  }
}

// 生成示例数据（当API数据不可用时使用）
const generateSampleAgentData = (agentId: string): AgentData => {
  const agentNames: Record<string, { name: string; avatar: string; role: string; description: string }> = {
    'agent_power': { name: 'Power', avatar: '🤖', role: '系统协调者', description: '主AI助手，统筹协调所有代理任务，负责系统整体架构设计' },
    'agent_daima': { name: '代码哥', avatar: '👨‍💻', role: '全栈工程师', description: '全能编程专家，负责后端开发和系统架构优化' },
    'agent_meihua': { name: '美化姐', avatar: '🎨', role: 'UI/UX设计师', description: '界面美化和用户体验优化专家' },
    'agent_ceshi': { name: '测试哥', avatar: '🧪', role: 'QA工程师', description: '质量保证专家，负责功能测试和Bug修复' },
    'agent_youzi': { name: '游资哥', avatar: '📈', role: '数据分析师', description: '股票数据分析专家，AKShare深度用户' },
  }

  const agentInfo = agentNames[agentId] || { name: '未知代理', avatar: '👤', role: '未知角色', description: '暂无描述' }

  return {
    id: agentId,
    ...agentInfo,
    personality: '专注、高效、热爱学习',
    skills: [
      { id: '1', skill_name: 'TypeScript', proficiency: 9, status: 'mastered' },
      { id: '2', skill_name: 'React', proficiency: 8, status: 'mastered' },
      { id: '3', skill_name: 'Node.js', proficiency: 7, status: 'practicing' },
      { id: '4', skill_name: 'Python', proficiency: 6, status: 'practicing' },
      { id: '5', skill_name: 'Docker', proficiency: 5, status: 'learning' },
    ],
    achievements: [
      { id: '1', badge_name: '初出茅庐', description: '完成第一个任务', earned_at: '2026-01-15T10:00:00Z', rarity: 'common' },
      { id: '2', badge_name: '任务达人', description: '累计完成10个任务', earned_at: '2026-01-20T15:30:00Z', rarity: 'common' },
      { id: '3', badge_name: '速度之星', description: '一天内完成5个任务', earned_at: '2026-01-25T18:00:00Z', rarity: 'rare' },
      { id: '4', badge_name: '技能大师', description: '掌握3项技能', earned_at: '2026-02-01T12:00:00Z', rarity: 'rare' },
      { id: '5', badge_name: '完美执行', description: '连续7天完成任务', earned_at: '2026-02-05T09:00:00Z', rarity: 'epic' },
    ],
    tasks: [
      { id: '1', title: '优化数据库查询性能', status: 'completed', priority: 'high', created_at: '2026-02-10T09:00:00Z', completed_at: '2026-02-10T15:00:00Z', category: 'backend' },
      { id: '2', title: '设计新的UI组件库', status: 'completed', priority: 'high', created_at: '2026-02-09T10:00:00Z', completed_at: '2026-02-09T18:00:00Z', category: 'frontend' },
      { id: '3', title: '编写API文档', status: 'in_progress', priority: 'medium', created_at: '2026-02-10T14:00:00Z', category: 'documentation' },
      { id: '4', title: '修复登录Bug', status: 'pending', priority: 'urgent', created_at: '2026-02-11T08:00:00Z', category: 'bugfix' },
      { id: '5', title: '学习GraphQL', status: 'pending', priority: 'low', created_at: '2026-02-11T09:00:00Z', category: 'learning' },
    ],
    projects: [
      { id: '1', name: '成长网站V2', description: 'AI代理成长追踪系统', status: 'active', progress: 75 },
      { id: '2', name: '数据可视化', description: '图表和报表模块', status: 'active', progress: 40 },
    ],
    stats: {
      totalTasks: 25,
      completedTasks: 20,
      inProgressTasks: 3,
      pendingTasks: 2,
      completionRate: 80,
      totalSkills: 5,
      masteredSkills: 2,
      learningSkills: 1,
      totalAchievements: 5,
      rareAchievements: 2,
    }
  }
}

export default function AgentProfile({ agentId, onBack, onMessage }: AgentProfileProps) {
  const [agent, setAgent] = useState<AgentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'skills' | 'achievements'>('overview')
  const [expandedSkills, setExpandedSkills] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function fetchAgentDetails() {
      try {
        setLoading(true)
        const response = await fetch(`/api/agents/${agentId}/details`)
        
        if (!response.ok) {
          if (response.status === 404) {
            // 使用示例数据
            setAgent(generateSampleAgentData(agentId))
            return
          }
          throw new Error('Failed to fetch agent details')
        }

        const data = await response.json()
        setAgent(data.data)
      } catch (err) {
        console.error('Error fetching agent:', err)
        // 使用示例数据作为fallback
        setAgent(generateSampleAgentData(agentId))
      } finally {
        setLoading(false)
      }
    }

    fetchAgentDetails()
  }, [agentId])

  const toggleSkillExpand = (skillId: string) => {
    const newExpanded = new Set(expandedSkills)
    if (newExpanded.has(skillId)) {
      newExpanded.delete(skillId)
    } else {
      newExpanded.add(skillId)
    }
    setExpandedSkills(newExpanded)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
          <p className="text-red-500 text-lg">❌ 加载失败</p>
          <button 
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
          >
            返回
          </button>
        </div>
      </div>
    )
  }

  // 计算等级（基于完成任务数）
  const level = Math.floor(agent.stats.completedTasks / 5) + 1
  const experience = (agent.stats.completedTasks % 5) * 20
  const maxExperience = 100

  // 根据等级获取颜色
  const getLevelColor = (lvl: number) => {
    if (lvl >= 10) return 'from-amber-400 via-orange-500 to-red-500'
    if (lvl >= 7) return 'from-purple-400 via-pink-500 to-rose-500'
    if (lvl >= 4) return 'from-blue-400 via-cyan-500 to-teal-500'
    return 'from-green-400 via-emerald-500 to-teal-500'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button 
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">返回</span>
            </button>
            
            <div className="flex items-center gap-2">
              {onMessage && (
                <button 
                  onClick={() => onMessage(agentId)}
                  className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="发送消息"
                >
                  <Mail className="w-5 h-5" />
                </button>
              )}
              <button 
                className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="分享"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button 
                className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="设置"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* 个人信息卡片 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* 封面背景 */}
          <div className={`h-32 sm:h-48 bg-gradient-to-r ${getLevelColor(level)} relative`}>
            <div className="absolute inset-0 bg-black/10"></div>
            {/* 等级徽章 */}
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1 shadow-lg">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="font-bold text-gray-800">Lv.{level}</span>
            </div>
          </div>
          
          {/* 头像和基本信息 */}
          <div className="px-4 sm:px-6 pb-6">
            <div className="relative -mt-12 sm:-mt-16 mb-4 flex flex-col sm:flex-row sm:items-end gap-4">
              {/* 头像 */}
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-2xl shadow-lg flex items-center justify-center text-5xl sm:text-6xl border-4 border-white">
                {agent.avatar}
              </div>
              
              {/* 基本信息 */}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{agent.name}</h1>
                <p className="text-gray-500 flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-indigo-600">{agent.role}</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-sm">{agent.personality}</span>
                </p>
              </div>
            </div>
            
            {/* 简介 */}
            <p className="text-gray-600 text-sm sm:text-base mb-4">{agent.description}</p>
            
            {/* 经验条 */}
            <div className="bg-gray-100 rounded-xl p-3 sm:p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">升级进度</span>
                <span className="font-medium text-gray-900">{experience}/{maxExperience} XP</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${getLevelColor(level)} rounded-full transition-all duration-500`}
                  style={{ width: `${(experience / maxExperience) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">完成 {5 - (agent.stats.completedTasks % 5)} 个任务即可升级</p>
            </div>
          </div>
        </div>

        {/* 统计概览 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Target className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-xs sm:text-sm text-gray-500">总任务</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{agent.stats.totalTasks}</p>
            <p className="text-xs text-gray-500 mt-1">{agent.stats.completedTasks} 已完成</p>
          </div>
          
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-xs sm:text-sm text-gray-500">完成率</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{agent.stats.completionRate}%</p>
            <p className="text-xs text-gray-500 mt-1">{agent.stats.inProgressTasks} 进行中</p>
          </div>
          
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <Zap className="w-4 h-4 text-purple-600" />
              </div>
              <span className="text-xs sm:text-sm text-gray-500">技能</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{agent.stats.totalSkills}</p>
            <p className="text-xs text-gray-500 mt-1">{agent.stats.masteredSkills} 已掌握</p>
          </div>
          
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-xs sm:text-sm text-gray-500">成就</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{agent.stats.totalAchievements}</p>
            <p className="text-xs text-gray-500 mt-1">{agent.stats.rareAchievements} 稀有</p>
          </div>
        </div>

        {/* 标签页导航 */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-1 sm:p-2">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {[
              { id: 'overview', label: '概览', icon: Star },
              { id: 'tasks', label: '任务', icon: CheckCircle2 },
              { id: 'skills', label: '技能', icon: Zap },
              { id: 'achievements', label: '成就', icon: Trophy },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === id 
                    ? 'bg-indigo-500 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 标签页内容 */}
        <div className="min-h-[300px]">
          {/* 概览页 */}
          {activeTab === 'overview' && (
            <div className="space-y-4 sm:space-y-6">
              {/* 技能展示 */}
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-purple-500" />
                    技能掌握
                  </h3>
                  <button 
                    onClick={() => setActiveTab('skills')}
                    className="text-sm text-indigo-600 hover:text-indigo-700"
                  >
                    查看全部
                  </button>
                </div>
                <div className="space-y-3">
                  {agent.skills.slice(0, 3).map(skill => (
                    <div key={skill.id} className="flex items-center gap-3">
                      <span className="text-sm text-gray-700 w-24 truncate">{skill.skill_name}</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${getSkillStatusColor(skill.status)} rounded-full`}
                          style={{ width: `${skill.proficiency * 10}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-14 text-right">{skill.proficiency}/10</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 成就展示 */}
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    最近成就
                  </h3>
                  <button 
                    onClick={() => setActiveTab('achievements')}
                    className="text-sm text-indigo-600 hover:text-indigo-700"
                  >
                    查看全部
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {agent.achievements.slice(0, 5).map(achievement => (
                    <div 
                      key={achievement.id}
                      className="group relative bg-gray-50 rounded-xl p-3 text-center hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <div className={`w-12 h-12 mx-auto rounded-full bg-gradient-to-br ${getRarityColor(achievement.rarity)} flex items-center justify-center text-xl mb-2 group-hover:scale-110 transition-transform`}>
                        🏆
                      </div>
                      <p className="text-xs font-medium text-gray-900 truncate">{achievement.badge_name}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${getRarityBg(achievement.rarity)}`}>
                        {achievement.rarity === 'legendary' ? '传说' : achievement.rarity === 'epic' ? '史诗' : achievement.rarity === 'rare' ? '稀有' : '普通'}
                      </span>
                      
                      {/* 悬停提示 */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        <p className="font-medium">{achievement.badge_name}</p>
                        <p className="text-gray-300 text-[10px]">{achievement.description}</p>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 最近任务 */}
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-500" />
                    最近任务
                  </h3>
                  <button 
                    onClick={() => setActiveTab('tasks')}
                    className="text-sm text-indigo-600 hover:text-indigo-700"
                  >
                    查看全部
                  </button>
                </div>
                <div className="space-y-2">
                  {agent.tasks.slice(0, 3).map(task => (
                    <div key={task.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`${getStatusColor(task.status)} px-2 py-1 rounded-full text-xs flex items-center gap-1`}>
                        {getStatusIcon(task.status)}
                        {task.status === 'completed' ? '已完成' : task.status === 'in_progress' ? '进行中' : '待开始'}
                      </div>
                      <span className="flex-1 text-sm text-gray-800 truncate">{task.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(task.priority)}`}>
                        {task.priority === 'urgent' ? '紧急' : task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 任务页 */}
          {activeTab === 'tasks' && (
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">任务时间线</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {agent.tasks.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>暂无任务</p>
                  </div>
                ) : (
                  agent.tasks.map((task, index) => (
                    <div key={task.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            task.status === 'completed' ? 'bg-green-100 text-green-600' :
                            task.status === 'in_progress' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-gray-100 text-gray-400'
                          }`}>
                            {getStatusIcon(task.status)}
                          </div>
                          {index < agent.tasks.length - 1 && (
                            <div className="w-0.5 h-full bg-gray-200 my-1"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900">{task.title}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(task.status)}`}>
                              {task.status === 'completed' ? '已完成' : task.status === 'in_progress' ? '进行中' : task.status === 'pending' ? '待开始' : '已取消'}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(task.priority)}`}>
                              {task.priority === 'urgent' ? '紧急' : task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
                            </span>
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(task.created_at).toLocaleDateString('zh-CN')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 技能页 */}
          {activeTab === 'skills' && (
            <div className="space-y-3">
              {agent.skills.map(skill => (
                <div 
                  key={skill.id} 
                  className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
                >
                  <button
                    onClick={() => toggleSkillExpand(skill.id)}
                    className="w-full p-4 sm:p-5 flex items-center gap-4"
                  >
                    <div className={`w-12 h-12 rounded-xl ${getSkillStatusColor(skill.status)} bg-opacity-20 flex items-center justify-center flex-shrink-0`}>
                      <Zap className={`w-6 h-6 ${getSkillStatusColor(skill.status).replace('bg-', 'text-')}`} />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-gray-900">{skill.skill_name}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(skill.status)}`}>
                          {getSkillStatusText(skill.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${getSkillStatusColor(skill.status)} rounded-full transition-all duration-500`}
                            style={{ width: `${skill.proficiency * 10}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700 w-12 text-right">{skill.proficiency}/10</span>
                      </div>
                    </div>
                  </button>
                  
                  {expandedSkills.has(skill.id) && (
                    <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 border-t border-gray-100">
                      <div className="pt-4 space-y-2">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">掌握程度：</span>
                          {skill.proficiency >= 8 ? '精通 - 能够独立解决复杂问题' :
                           skill.proficiency >= 6 ? '熟练 - 能够独立完成常规任务' :
                           skill.proficiency >= 4 ? '进阶 - 需要一定指导' : '入门 - 正在学习中'}
                        </p>
                        {skill.expected_date && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">预期掌握日期：</span>
                            {new Date(skill.expected_date).toLocaleDateString('zh-CN')}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 成就页 */}
          {activeTab === 'achievements' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {agent.achievements.map(achievement => (
                <div 
                  key={achievement.id}
                  className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getRarityColor(achievement.rarity)} flex items-center justify-center text-2xl flex-shrink-0 shadow-lg`}>
                      🏆
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900">{achievement.badge_name}</h4>
                      <p className="text-sm text-gray-500 mt-0.5">{achievement.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${getRarityBg(achievement.rarity)}`}>
                          {achievement.rarity === 'legendary' ? '传说' : achievement.rarity === 'epic' ? '史诗' : achievement.rarity === 'rare' ? '稀有' : '普通'}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(achievement.earned_at).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
