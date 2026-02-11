/**
 * 数据迁移脚本
 * V2.0 数据库迁移 - 将现有任务数据迁移到新的表结构
 * 
 * 使用方法:
 *   npx ts-node scripts/migrate-data.ts
 * 
 * 迁移步骤:
 * 1. 初始化新数据库表结构
 * 2. 创建代理数据 (Power, 代码哥, 美化姐, 测试哥)
 * 3. 创建示例项目
 * 4. 将20条任务数据迁移到tasks表
 */

import { 
  initDatabase, 
  resetDatabase,
  AgentRepo, 
  ProjectRepo, 
  TaskRepo,
  closeDb 
} from '../lib/db';

// 原有历史数据（来自page.tsx）
const historyData = [
  {
    date: '2026-02-10',
    summary: '创建代码哥 Skill，开发每日任务追踪网站',
    tasks: [
      { id: 't1', content: '创建 daima-ge Skill 完整配置', agent: 'Power', status: '已完成', timestamp: '10:00' },
      { id: 't2', content: '配置 GITHUB_TOKEN 和 VERCEL_TOKEN', agent: 'Power', status: '已完成', timestamp: '10:30' },
      { id: 't3', content: '开发每日任务追踪网站核心功能', agent: '代码哥', status: '已完成', timestamp: '14:00' },
      { id: 't4', content: '创建 GitHub 仓库并推送代码', agent: '代码哥', status: '已完成', timestamp: '15:30' },
      { id: 't5', content: '部署网站到 Vercel', agent: '代码哥', status: '已完成', timestamp: '18:45' },
      { id: 't6', content: '上传工作日志到 GitHub', agent: 'Power', status: '已完成', timestamp: '19:00' },
    ]
  },
  {
    date: '2026-02-09',
    summary: 'OpenClaw 初始化配置，安装多个技能',
    tasks: [
      { id: 't7', content: '完成 OpenClaw 基础配置', agent: 'Power', status: '已完成', timestamp: '09:00' },
      { id: 't8', content: '设置时区为 Asia/Shanghai', agent: 'Power', status: '已完成', timestamp: '09:15' },
      { id: 't9', content: '配置飞书渠道连接', agent: 'Power', status: '已完成', timestamp: '10:00' },
      { id: 't10', content: '安装 QQ Bot 插件', agent: 'Power', status: '已完成', timestamp: '10:30' },
      { id: 't11', content: '安装钉钉插件', agent: 'Power', status: '已完成', timestamp: '11:00' },
      { id: 't12', content: '安装企业微信插件', agent: 'Power', status: '已完成', timestamp: '11:30' },
      { id: 't13', content: '安装 session-memory 技能', agent: 'Power', status: '已完成', timestamp: '14:00' },
      { id: 't14', content: '安装 qqbot-cron 智能提醒技能', agent: 'Power', status: '已完成', timestamp: '14:30' },
      { id: 't15', content: '安装 agent-browser 浏览器自动化技能', agent: 'Power', status: '已完成', timestamp: '15:00' },
      { id: 't16', content: '阅读 OpenClaw 官方文档并总结', agent: 'Power', status: '已完成', timestamp: '16:15' },
    ]
  },
  {
    date: '2026-02-08',
    summary: '系统初始化，基础环境配置',
    tasks: [
      { id: 't17', content: '初始化 OpenClaw 工作空间', agent: 'Power', status: '已完成', timestamp: '09:00' },
      { id: 't18', content: '创建基础配置文件', agent: 'Power', status: '已完成', timestamp: '10:00' },
    ]
  }
];

// 代理配置
interface AgentSkill {
  skill_name: string;
  proficiency: number;
  status: 'mastered' | 'practicing' | 'learning';
}

interface AgentConfig {
  id: string;
  name: string;
  avatar: string;
  role: string;
  description: string;
  personality: string;
  skills: AgentSkill[];
}

const agentsConfig: AgentConfig[] = [
  {
    id: 'agent_power',
    name: 'Power',
    avatar: '🤖',
    role: '主 AI 助手',
    description: '统筹协调所有任务，负责系统配置和项目管理',
    personality: '严谨、高效、有条理',
    skills: [
      { skill_name: '系统配置', proficiency: 9, status: 'mastered' as const },
      { skill_name: '项目管理', proficiency: 8, status: 'mastered' as const },
      { skill_name: '协调沟通', proficiency: 9, status: 'mastered' as const }
    ]
  },
  {
    id: 'agent_daima',
    name: '代码哥',
    avatar: '👨‍💻',
    role: '全能编程专家',
    description: '负责代码编写、架构设计和部署运维',
    personality: '专注、细致、追求代码质量',
    skills: [
      { skill_name: '前端开发', proficiency: 9, status: 'mastered' as const },
      { skill_name: '后端开发', proficiency: 8, status: 'mastered' as const },
      { skill_name: 'DevOps', proficiency: 7, status: 'practicing' as const }
    ]
  },
  {
    id: 'agent_meihua',
    name: '美化姐',
    avatar: '🎨',
    role: 'UI/UX 设计师',
    description: '负责界面美化、用户体验优化和视觉设计',
    personality: '创意、追求完美、注重细节',
    skills: [
      { skill_name: 'UI设计', proficiency: 9, status: 'mastered' as const },
      { skill_name: 'UX设计', proficiency: 8, status: 'practicing' as const },
      { skill_name: '动效设计', proficiency: 6, status: 'learning' as const }
    ]
  },
  {
    id: 'agent_ceshi',
    name: '测试哥',
    avatar: '🧪',
    role: '质量保证工程师',
    description: '负责功能测试、Bug修复和质量把控',
    personality: '细心、耐心、善于发现问题',
    skills: [
      { skill_name: '功能测试', proficiency: 8, status: 'mastered' as const },
      { skill_name: '自动化测试', proficiency: 7, status: 'practicing' as const },
      { skill_name: '性能测试', proficiency: 6, status: 'learning' as const }
    ]
  }
];

// 项目配置
const projectsConfig = [
  {
    id: 'proj_openclaw',
    name: 'OpenClaw 初始化',
    description: 'OpenClaw 系统初始化、插件安装和基础配置',
    status: 'completed' as const,
    team_members: ['agent_power'],
    progress: 100,
    start_date: '2026-02-08',
    end_date: '2026-02-09'
  },
  {
    id: 'proj_tracker',
    name: '每日任务追踪网站',
    description: '开发每日任务追踪网站，记录和管理团队工作',
    status: 'active' as const,
    team_members: ['agent_power', 'agent_daima'],
    progress: 80,
    start_date: '2026-02-10',
    end_date: null
  }
];

// 状态映射
const statusMap: Record<string, 'pending' | 'in_progress' | 'completed' | 'cancelled'> = {
  '待开始': 'pending',
  '进行中': 'in_progress',
  '已完成': 'completed'
};

// 代理名称到ID映射
const agentNameToId: Record<string, string> = {
  'Power': 'agent_power',
  '代码哥': 'agent_daima',
  '美化姐': 'agent_meihua',
  '测试哥': 'agent_ceshi'
};

/**
 * 主迁移函数
 */
async function migrate() {
  console.log('🚀 开始数据迁移...\n');

  try {
    // 1. 初始化数据库
    console.log('📦 初始化数据库表结构...');
    initDatabase();
    console.log('✅ 数据库初始化完成\n');

    // 2. 创建代理
    console.log('👥 创建代理数据...');
    for (const agentConfig of agentsConfig) {
      const agent = AgentRepo.create({
        id: agentConfig.id,
        name: agentConfig.name,
        avatar: agentConfig.avatar,
        role: agentConfig.role,
        description: agentConfig.description,
        skills: agentConfig.skills,
        personality: agentConfig.personality
      });
      console.log(`  ✓ 创建代理: ${agent.name} (${agent.id})`);
    }
    console.log('');

    // 3. 创建技能详情
    console.log('🎯 创建技能数据...');
    // 技能已经在Agent创建时作为JSON存储，这里不需要重复创建
    console.log('  ✓ 技能数据已嵌入Agent记录\n');

    // 4. 创建项目
    console.log('📁 创建项目数据...');
    for (const projectConfig of projectsConfig) {
      const project = ProjectRepo.create({
        id: projectConfig.id,
        name: projectConfig.name,
        description: projectConfig.description,
        status: projectConfig.status,
        team_members: projectConfig.team_members,
        progress: projectConfig.progress,
        start_date: projectConfig.start_date,
        end_date: projectConfig.end_date
      });
      console.log(`  ✓ 创建项目: ${project.name} (${project.id})`);
    }
    console.log('');

    // 5. 迁移任务数据
    console.log('📝 迁移任务数据...');
    let taskCount = 0;
    
    for (const dailyLog of historyData) {
      // 根据日期确定项目
      const projectId = dailyLog.date === '2026-02-10' ? 'proj_tracker' : 'proj_openclaw';
      
      for (const task of dailyLog.tasks) {
        // 将时间转换为ISO格式
        const [hours, minutes] = task.timestamp.split(':').map(Number);
        const createdAt = new Date(`${dailyLog.date}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00+08:00`);
        
        // 创建任务
        TaskRepo.create({
          id: task.id,
          title: task.content,
          agent_id: agentNameToId[task.agent],
          category: 'general',
          project_id: projectId,
          priority: 'medium',
          status: statusMap[task.status] || 'pending',
          completed_at: task.status === '已完成' ? createdAt.toISOString() : null
        });
        
        taskCount++;
        console.log(`  ✓ 迁移任务: ${task.content.substring(0, 40)}${task.content.length > 40 ? '...' : ''}`);
      }
    }
    console.log('');

    // 6. 创建成就数据（示例）
    console.log('🏆 创建成就数据...');
    console.log('  ✓ 成就系统已初始化（暂无数据）\n');

    // 7. 输出统计
    console.log('📊 迁移完成统计:');
    console.log(`  • 代理数量: ${agentsConfig.length}`);
    console.log(`  • 项目数量: ${projectsConfig.length}`);
    console.log(`  • 任务数量: ${taskCount}`);
    console.log(`  • 成就数量: 0`);
    console.log('');

    console.log('✅ 数据迁移完成！');
    console.log(`📁 数据库位置: ${process.cwd()}/data/growth.db`);

  } catch (error) {
    console.error('❌ 迁移失败:', error);
    process.exit(1);
  } finally {
    closeDb();
  }
}

// 执行迁移
migrate();
