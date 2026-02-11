/**
 * API测试脚本
 * 
 * 测试内容:
 * 1. 代理详情API
 * 2. 任务筛选API
 * 3. 统计API
 * 4. 性能测试
 * 
 * Usage: npx ts-node tests/api-test.ts
 */

import { AgentRepo, TaskRepo, ProjectRepo, initDatabase, resetDatabase } from '../lib/db';
import { getAgentFullDetails, getOptimizedStats, createPerformanceIndexes } from '../lib/db-optimized';

// 测试配置
const TEST_CONFIG = {
  agentCount: 5,
  tasksPerAgent: 20,
  verbose: true
};

// 测试结果
interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

const results: TestResult[] = [];

// 测试辅助函数
async function runTest(name: string, fn: () => Promise<void>): Promise<void> {
  const start = Date.now();
  try {
    await fn();
    const duration = Date.now() - start;
    results.push({ name, passed: true, duration });
    console.log(`✅ ${name} (${duration}ms)`);
  } catch (error) {
    const duration = Date.now() - start;
    results.push({ 
      name, 
      passed: false, 
      duration,
      error: error instanceof Error ? error.message : String(error)
    });
    console.log(`❌ ${name} (${duration}ms)`);
    console.log(`   错误: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

// 初始化测试数据
function initTestData() {
  console.log('\n📝 初始化测试数据...\n');
  
  // 重置数据库
  resetDatabase();
  
  // 创建测试代理
  const agents = [
    { name: '代码哥', role: '全栈工程师', description: '负责后端开发' },
    { name: '美化姐', role: 'UI设计师', description: '负责界面设计' },
    { name: '测试哥', role: 'QA工程师', description: '负责测试' },
    { name: '游资哥', role: '股票分析师', description: '负责股票分析' },
    { name: 'Power', role: '协调者', description: '统筹协调' }
  ];
  
  const createdAgents = agents.map(agent => 
    AgentRepo.create({
      ...agent,
      avatar: '👤',
      personality: '',
      skills: [
        { skill_name: '测试技能1', proficiency: 8, status: 'practicing' },
        { skill_name: '测试技能2', proficiency: 5, status: 'learning' }
      ]
    })
  );
  
  console.log(`  创建 ${createdAgents.length} 个代理`);
  
  // 为每个代理创建任务
  const statuses = ['pending', 'in_progress', 'completed', 'completed', 'completed'] as const;
  const priorities = ['low', 'medium', 'high', 'urgent'] as const;
  const categories = ['开发', '设计', '测试', '分析', '管理'];
  
  let taskCount = 0;
  for (const agent of createdAgents) {
    for (let i = 0; i < TEST_CONFIG.tasksPerAgent; i++) {
      TaskRepo.create({
        title: `任务-${i + 1}`,
        agent_id: agent.id,
        project_id: null,
        category: categories[Math.floor(Math.random() * categories.length)],
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        description: `这是 ${agent.name} 的第 ${i + 1} 个任务`
      });
      taskCount++;
    }
  }
  
  console.log(`  创建 ${taskCount} 个任务`);
  
  // 创建测试项目
  const project = ProjectRepo.create({
    name: '测试项目',
    description: '用于测试的项目',
    status: 'active',
    team_members: createdAgents.map(a => a.id),
    progress: 50,
    start_date: new Date().toISOString(),
    end_date: null
  });
  
  console.log(`  创建 1 个项目`);
  
  return createdAgents;
}

// 测试用例
async function runTests() {
  console.log('🧪 开始API测试...\n');
  
  const agents = initTestData();
  
  // 创建性能索引
  createPerformanceIndexes();
  
  // ========== 测试1: 代理详情API ==========
  await runTest('代理详情API - 获取存在的代理', async () => {
    const agent = agents[0];
    const details = getAgentFullDetails(agent.id);
    
    assert(details !== null, '应该返回代理详情');
    assert(details!.id === agent.id, '代理ID应该匹配');
    assert(details!.name === agent.name, '代理名称应该匹配');
    assert(Array.isArray(details!.tasks), 'tasks应该是数组');
    assert(Array.isArray(details!.skills), 'skills应该是数组');
    assert(details!.stats.totalTasks >= 0, '应该有任务统计');
  });
  
  await runTest('代理详情API - 获取不存在的代理', async () => {
    const details = getAgentFullDetails('non-existent-id');
    assert(details === null, '应该返回null');
  });
  
  await runTest('代理详情API - 统计数据准确性', async () => {
    const agent = agents[0];
    const details = getAgentFullDetails(agent.id);
    
    const expectedTasks = TEST_CONFIG.tasksPerAgent;
    assert(details!.stats.totalTasks === expectedTasks, 
      `总任务数应该是 ${expectedTasks}, 实际是 ${details!.stats.totalTasks}`);
    assert(details!.stats.completionRate >= 0 && details!.stats.completionRate <= 100, 
      '完成率应该在0-100之间');
    assert(details!.tasks.length === expectedTasks, '任务列表长度应该匹配');
  });
  
  // ========== 测试2: 任务筛选API ==========
  await runTest('任务筛选API - 按agentId筛选', async () => {
    const agent = agents[1];
    const result = TaskRepo.findAll({ agent: agent.id });
    
    assert(result.total === TEST_CONFIG.tasksPerAgent, '应该返回该代理的所有任务');
    assert(result.tasks.every(t => t.agent_id === agent.id), '所有任务应该属于该代理');
  });
  
  await runTest('任务筛选API - 按状态筛选', async () => {
    const result = TaskRepo.findAll({ status: 'completed' });
    assert(result.tasks.every(t => t.status === 'completed'), '所有任务状态应该是completed');
  });
  
  await runTest('任务筛选API - 按优先级筛选', async () => {
    const result = TaskRepo.findAll({ priority: 'high' });
    assert(result.tasks.every(t => t.priority === 'high'), '所有任务优先级应该是high');
  });
  
  await runTest('任务筛选API - 组合筛选', async () => {
    const agent = agents[2];
    const result = TaskRepo.findAll({ 
      agent: agent.id, 
      status: 'completed',
      priority: 'medium'
    });
    
    assert(result.tasks.every(t => 
      t.agent_id === agent.id && 
      t.status === 'completed' && 
      t.priority === 'medium'
    ), '应该匹配所有筛选条件');
  });
  
  await runTest('任务筛选API - 分页功能', async () => {
    const result = TaskRepo.findAll({ page: 1, pageSize: 10 });
    assert(result.tasks.length <= 10, '每页数量应该不超过pageSize');
    
    const result2 = TaskRepo.findAll({ page: 2, pageSize: 10 });
    assert(result2.tasks.length <= 10, '第二页数量应该不超过pageSize');
  });
  
  // ========== 测试3: 统计API ==========
  await runTest('统计API - 基础统计', async () => {
    const stats = getOptimizedStats();
    
    assert(stats.totalAgents === TEST_CONFIG.agentCount, '代理总数应该正确');
    assert(stats.totalTasks === TEST_CONFIG.agentCount * TEST_CONFIG.tasksPerAgent, '任务总数应该正确');
    assert(stats.taskCompletionRate >= 0 && stats.taskCompletionRate <= 100, '完成率应该在0-100之间');
    assert(stats.agentStats.length === TEST_CONFIG.agentCount, '应该有所有代理的统计');
  });
  
  await runTest('统计API - 代理统计详情', async () => {
    const stats = getOptimizedStats();
    const agentStat = stats.agentStats[0];
    
    assert(agentStat.agentId !== undefined, '应该有agentId');
    assert(agentStat.agentName !== undefined, '应该有agentName');
    assert(agentStat.totalTasks >= 0, '应该有totalTasks');
    assert(agentStat.completedTasks >= 0, '应该有completedTasks');
    assert(agentStat.completionRate >= 0 && agentStat.completionRate <= 100, '完成率应该在0-100之间');
  });
  
  // ========== 测试4: 性能测试 ==========
  await runTest('性能测试 - 代理详情查询性能', async () => {
    const iterations = 100;
    const start = Date.now();
    
    for (let i = 0; i < iterations; i++) {
      getAgentFullDetails(agents[0].id);
    }
    
    const duration = Date.now() - start;
    const avgTime = duration / iterations;
    
    assert(avgTime < 10, `平均查询时间(${avgTime.toFixed(2)}ms)应该小于10ms`);
    console.log(`     平均查询时间: ${avgTime.toFixed(2)}ms (${iterations}次)`);
  });
  
  await runTest('性能测试 - 统计查询性能', async () => {
    const iterations = 50;
    const start = Date.now();
    
    for (let i = 0; i < iterations; i++) {
      getOptimizedStats();
    }
    
    const duration = Date.now() - start;
    const avgTime = duration / iterations;
    
    assert(avgTime < 20, `平均统计时间(${avgTime.toFixed(2)}ms)应该小于20ms`);
    console.log(`     平均统计时间: ${avgTime.toFixed(2)}ms (${iterations}次)`);
  });
  
  await runTest('性能测试 - 任务筛选性能', async () => {
    const iterations = 50;
    const start = Date.now();
    
    for (let i = 0; i < iterations; i++) {
      TaskRepo.findAll({ agent: agents[0].id, status: 'completed' });
    }
    
    const duration = Date.now() - start;
    const avgTime = duration / iterations;
    
    assert(avgTime < 15, `平均筛选时间(${avgTime.toFixed(2)}ms)应该小于15ms`);
    console.log(`     平均筛选时间: ${avgTime.toFixed(2)}ms (${iterations}次)`);
  });
}

// 生成测试报告
function generateReport() {
  console.log('\n📊 测试报告\n');
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  const totalTime = results.reduce((sum, r) => sum + r.duration, 0);
  
  console.log(`总测试数: ${total}`);
  console.log(`通过: ${passed} ✅`);
  console.log(`失败: ${failed} ❌`);
  console.log(`总耗时: ${totalTime}ms`);
  console.log(`通过率: ${((passed / total) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('\n失败详情:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
  }
  
  console.log('\n' + '='.repeat(50));
  
  // 性能总结
  console.log('\n⚡ 性能总结:');
  const perfTests = results.filter(r => r.name.includes('性能'));
  perfTests.forEach(r => {
    console.log(`  ${r.name}: ${r.duration}ms ${r.passed ? '✅' : '❌'}`);
  });
  
  return failed === 0;
}

// 主函数
async function main() {
  console.log('🚀 API测试开始\n');
  
  try {
    initDatabase();
    await runTests();
    const allPassed = generateReport();
    
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error('测试运行失败:', error);
    process.exit(1);
  }
}

main();
