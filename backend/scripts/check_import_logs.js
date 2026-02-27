const mysqlPool = require('../config/mysql');
const fs = require('fs');

async function checkImportLogs() {
  try {
    // 读取导入的 JSON 文件
    const jsonPath = 'F:/Code/uniapp/demo/cskaoyan_questions_converted.json';
    const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const jsonData = rawData.data || rawData;
    
    console.log('JSON 文件中的题目统计:');
    console.log('================');
    
    let totalQuestions = 0;
    const subjectStats = {};
    
    for (const subject of jsonData) {
      let subjectCount = 0;
      
      for (const chapter of (subject.children || [])) {
        for (const section of (chapter.children || [])) {
          for (const qb of (section.questionBanks || [])) {
            const count = (qb.questions || []).length;
            subjectCount += count;
          }
        }
      }
      
      subjectStats[subject.name] = subjectCount;
      totalQuestions += subjectCount;
      
      console.log(`${subject.name}: ${subjectCount} 题`);
    }
    
    console.log(`\n总计: ${totalQuestions} 题`);
    console.log('');
    
    // 对比数据库中的数量
    console.log('数据库 vs JSON 对比:');
    console.log('================');
    
    const nameMapping = {
      'DS 全书习题（800题）': '数据结构',
      '计组全书习题（737题）': '计算机组成原理',
      '计网全书习题（638题）': '计算机网络',
      'OS 全书习题（764题）': '操作系统'
    };
    
    for (const [dbName, jsonName] of Object.entries(nameMapping)) {
      const jsonCount = subjectStats[jsonName] || 0;
      
      const [rows] = await mysqlPool.query(
        'SELECT total_questions FROM computer1_tutorial WHERE name = ?',
        [dbName]
      );
      
      const dbCount = rows.length > 0 ? rows[0].total_questions : 0;
      const diff = jsonCount - dbCount;
      
      console.log(`${dbName}:`);
      console.log(`  JSON: ${jsonCount} 题`);
      console.log(`  数据库: ${dbCount} 题`);
      console.log(`  差异: ${diff} 题`);
      console.log('');
    }
    
  } catch (error) {
    console.error('查询失败:', error.message);
  } finally {
    process.exit(0);
  }
}

checkImportLogs();
