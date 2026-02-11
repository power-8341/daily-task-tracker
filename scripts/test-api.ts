/**
 * API 测试脚本
 * 测试所有API端点是否正常工作
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function testAPI() {
  console.log('🧪 开始API测试...\n');
  
  const tests = [];

  // 1. 测试 Stats API
  tests.push(async () => {
    console.log('📊 GET /api/stats');
    const res = await fetch(`${BASE_URL}/api/stats`);
    const data = await res.json();
    console.log('  ✓ Status:', res.status);
    console.log('  ✓ Total Agents:', data.data?.totalAgents);
    console.log('  ✓ Total Tasks:', data.data?.totalTasks);
    return res.ok;
  });

  // 2. 测试 Agents API - List
  tests.push(async () => {
    console.log('\n👥 GET /api/agents');
    const res = await fetch(`${BASE_URL}/api/agents`);
    const data = await res.json();
    console.log('  ✓ Status:', res.status);
    console.log('  ✓ Agents count:', data.data?.length);
    return res.ok;
  });

  // 3. 测试 Agents API - Get by ID
  tests.push(async () => {
    console.log('\n👤 GET /api/agents/agent_power');
    const res = await fetch(`${BASE_URL}/api/agents/agent_power`);
    const data = await res.json();
    console.log('  ✓ Status:', res.status);
    console.log('  ✓ Agent name:', data.data?.name);
    return res.ok;
  });

  // 4. 测试 Tasks API - List
  tests.push(async () => {
    console.log('\n📝 GET /api/tasks');
    const res = await fetch(`${BASE_URL}/api/tasks`);
    const data = await res.json();
    console.log('  ✓ Status:', res.status);
    console.log('  ✓ Tasks count:', data.data?.length);
    return res.ok;
  });

  // 5. 测试 Tasks API - Filter by agent
  tests.push(async () => {
    console.log('\n🔍 GET /api/tasks?agent=agent_daima');
    const res = await fetch(`${BASE_URL}/api/tasks?agent=agent_daima`);
    const data = await res.json();
    console.log('  ✓ Status:', res.status);
    console.log('  ✓ Filtered tasks:', data.data?.length);
    return res.ok;
  });

  // 6. 测试 Tasks API - Filter by status
  tests.push(async () => {
    console.log('\n🔍 GET /api/tasks?status=completed');
    const res = await fetch(`${BASE_URL}/api/tasks?status=completed`);
    const data = await res.json();
    console.log('  ✓ Status:', res.status);
    console.log('  ✓ Completed tasks:', data.data?.length);
    return res.ok;
  });

  // 7. 测试 Projects API - List
  tests.push(async () => {
    console.log('\n📁 GET /api/projects');
    const res = await fetch(`${BASE_URL}/api/projects`);
    const data = await res.json();
    console.log('  ✓ Status:', res.status);
    console.log('  ✓ Projects count:', data.data?.length);
    return res.ok;
  });

  // 8. 测试 Projects API - Get by ID
  tests.push(async () => {
    console.log('\n📂 GET /api/projects/proj_tracker');
    const res = await fetch(`${BASE_URL}/api/projects/proj_tracker`);
    const data = await res.json();
    console.log('  ✓ Status:', res.status);
    console.log('  ✓ Project name:', data.data?.name);
    console.log('  ✓ Tasks count:', data.data?.tasks?.length);
    return res.ok;
  });

  // 9. 测试 Pagination
  tests.push(async () => {
    console.log('\n📄 GET /api/tasks?page=1&pageSize=5');
    const res = await fetch(`${BASE_URL}/api/tasks?page=1&pageSize=5`);
    const data = await res.json();
    console.log('  ✓ Status:', res.status);
    console.log('  ✓ Page:', data.pagination?.page);
    console.log('  ✓ PageSize:', data.pagination?.pageSize);
    console.log('  ✓ Total:', data.pagination?.total);
    return res.ok && data.data?.length <= 5;
  });

  // 执行所有测试
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error: any) {
      console.log('  ❌ Error:', error?.message || String(error));
      failed++;
    }
  }

  console.log('\n' + '='.repeat(40));
  console.log('📋 测试结果:');
  console.log(`  ✅ 通过: ${passed}/${tests.length}`);
  console.log(`  ❌ 失败: ${failed}/${tests.length}`);
  
  if (failed === 0) {
    console.log('\n🎉 所有测试通过！');
  } else {
    console.log('\n⚠️ 部分测试失败');
    process.exit(1);
  }
}

// 如果没有服务器在运行，提示用户
console.log('📡 测试地址:', BASE_URL);
console.log('确保开发服务器已启动: npm run dev\n');

testAPI();
