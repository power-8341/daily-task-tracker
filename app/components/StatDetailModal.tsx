'use client'

import { X, TrendingUp, Users, CheckCircle2, Clock } from 'lucide-react'

interface AgentStat {
  agentId: string
  agentName: string
  totalTasks: number
  completedTasks: number
  completionRate: number
}

interface StatDetail {
  label: string
  value: number
  icon: typeof TrendingUp
  color: string
  description: string
  agentStats?: AgentStat[]
}

interface StatDetailModalProps {
  stat: StatDetail | null
  isOpen: boolean
  onClose: () => void
  onAgentClick: (agentId: string) => void
  getAgentAvatar?: (agentId: string) => string
}

// 根据代理名称映射颜色
const getAgentColor = (name: string): string => {
  const colorMap: Record<string, string> = {
    'Power': 'bg-blue-500',
    '代码哥': 'bg-green-500',
    '美化姐': 'bg-pink-500',
    '测试哥': 'bg-orange-500',
    '游资哥': 'bg-purple-500',
  }
  return colorMap[name] || 'bg-gray-500'
}

export default function StatDetailModal({ 
  stat, 
  isOpen, 
  onClose, 
  onAgentClick,
  getAgentAvatar 
}: StatDetailModalProps) {
  // 默认头像获取函数
  const getAvatar = getAgentAvatar || ((id: string) => '👤')
  if (!isOpen || !stat) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className={`p-5 ${stat.color.replace('text-', 'bg-').replace('600', '50')} border-b border-gray-100`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl ${stat.color.replace('text-', 'bg-').replace('600', '100')} flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{stat.label}</h3>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-600">{stat.description}</p>
        </div>

        {/* 代理统计列表 */}
        <div className="overflow-y-auto max-h-[50vh]">
          {stat.agentStats && stat.agentStats.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {stat.agentStats.map(agent => (
                <button
                  key={agent.agentId}
                  onClick={() => onAgentClick(agent.agentId)}
                  className="w-full px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className={`w-10 h-10 ${getAgentColor(agent.agentName)} rounded-full flex items-center justify-center text-lg`}>
                    {getAvatar(agent.agentId)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{agent.agentName}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-sm text-gray-500">
                      <span>{agent.completedTasks}/{agent.totalTasks} 完成</span>
                      <span className="text-gray-300">•</span>
                      <span>{agent.completionRate}%</span>
                    </div>
                  </div>
                  <div className="w-16">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${agent.completionRate}%` }}
                      />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>暂无详细数据</p>
            </div>
          )}
        </div>

        {/* 底部 */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            点击代理可查看详情
          </p>
        </div>
      </div>
    </div>
  )
}
