/**
 * 数据库性能优化初始化脚本
 * 
 * 运行此脚本创建性能优化索引
 * Usage: npx ts-node scripts/init-performance.ts
 */

import { initDatabase } from '../lib/db';
import { createPerformanceIndexes, generatePerformanceReport } from '../lib/db-optimized';

console.log('🚀 初始化数据库性能优化...\n');

// 初始化数据库
try {
  initDatabase();
  console.log('✅ 数据库初始化完成\n');
} catch (error) {
  console.error('❌ 数据库初始化失败:', error);
  process.exit(1);
}

// 创建性能索引
try {
  console.log('📊 创建性能优化索引...');
  createPerformanceIndexes();
  console.log('');
} catch (error) {
  console.error('❌ 创建索引失败:', error);
  process.exit(1);
}

// 生成性能报告
try {
  console.log('📈 生成性能报告...\n');
  const report = generatePerformanceReport();
  
  console.log('=== 数据库性能报告 ===');
  console.log(`生成时间: ${report.timestamp}`);
  console.log(`\n📋 表数据量:`);
  report.tableSizes.forEach(table => {
    console.log(`  - ${table.name}: ${table.rowCount} 条记录`);
  });
  
  console.log(`\n🔍 现有索引 (${report.indexes.length}个):`);
  report.indexes.forEach(idx => {
    console.log(`  - ${idx.name} (${idx.table}.${idx.columns})`);
  });
  
  console.log('\n✅ 性能优化完成！');
} catch (error) {
  console.error('❌ 生成报告失败:', error);
  process.exit(1);
}
