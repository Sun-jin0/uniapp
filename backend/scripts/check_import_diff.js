const mysqlPool = require('../config/mysql');

async function checkImportDiff() {
  try {
    // 查看每个教辅的预期题目数和实际题目数
    const tutorials = [
      { name: 'DS 全书习题（800题）', expected: 800, actual: 798 },
      { name: '计组全书习题（737题）', expected: 737, actual: 737 },
      { name: '计网全书习题（638题）', expected: 638, actual: 637 },
      { name: 'OS 全书习题（764题）', expected: 764, actual: 762 }
    ];
    
    console.log('教辅导入差异分析:');
    console.log('================');
    
    for (const t of tutorials) {
      const [rows] = await mysqlPool.query(
        'SELECT id FROM computer1_tutorial WHERE name = ?',
        [t.name]
      );
      
      if (rows.length > 0) {
        const tutorialId = rows[0].id;
        
        // 获取该教辅关联的唯一题目数
        const [countResult] = await mysqlPool.query(
          'SELECT COUNT(DISTINCT question_id) as count FROM computer1_tutorial_question WHERE tutorial_id = ?',
          [tutorialId]
        );
        
        const actualCount = countResult[0].count;
        const diff = t.expected - actualCount;
        
        console.log(`${t.name}:`);
        console.log(`  预期: ${t.expected} 题`);
        console.log(`  实际: ${actualCount} 题`);
        console.log(`  差异: ${diff} 题 (${diff > 0 ? '少了' : '正确'})`);
        
        if (diff > 0) {
          // 查找重复的题目（同一题目在同一教辅中多次出现）
          const [dupResult] = await mysqlPool.query(`
            SELECT chapter_id, question_id, COUNT(*) as cnt
            FROM computer1_tutorial_question
            WHERE tutorial_id = ?
            GROUP BY chapter_id, question_id
            HAVING cnt > 1
          `, [tutorialId]);
          
          if (dupResult.length > 0) {
            console.log(`  发现 ${dupResult.length} 个重复关联（同一题目在同一小节中多次出现）`);
          }
        }
        console.log('');
      }
    }
    
    // 统计总共创建了多少道唯一题目
    const [totalQuestions] = await mysqlPool.query(
      'SELECT COUNT(*) as count FROM computer1_question WHERE content_hash IS NOT NULL'
    );
    console.log(`题库中总共有 ${totalQuestions[0].count} 道唯一题目`);
    
  } catch (error) {
    console.error('查询失败:', error.message);
  } finally {
    process.exit(0);
  }
}

checkImportDiff();
