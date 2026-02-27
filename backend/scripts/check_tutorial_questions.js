const mysqlPool = require('../config/mysql');

async function checkTutorialQuestions() {
  try {
    // 查看每个教辅的题目关联数量
    const [tutorialCounts] = await mysqlPool.query(`
      SELECT 
        t.id,
        t.name,
        t.version,
        COUNT(DISTINCT tq.question_id) as question_count,
        COUNT(DISTINCT tq.chapter_id) as chapter_count
      FROM computer1_tutorial t
      LEFT JOIN computer1_tutorial_question tq ON t.id = tq.tutorial_id
      GROUP BY t.id
      ORDER BY t.id DESC
      LIMIT 10
    `);
    
    console.log('教辅题目统计:');
    console.log('================');
    tutorialCounts.forEach(t => {
      console.log(`${t.name} (${t.version}): ${t.question_count} 题, ${t.chapter_count} 个章节`);
    });
    
    // 查看最新的教辅的章节题目分布
    if (tutorialCounts.length > 0) {
      const latestTutorialId = tutorialCounts[0].id;
      const [chapterCounts] = await mysqlPool.query(`
        SELECT 
          tc.id,
          tc.name,
          tc.level,
          COUNT(tq.question_id) as question_count
        FROM computer1_tutorial_chapter tc
        LEFT JOIN computer1_tutorial_question tq ON tc.id = tq.chapter_id
        WHERE tc.tutorial_id = ?
        GROUP BY tc.id
        ORDER BY tc.id ASC
      `, [latestTutorialId]);
      
      console.log('\n最新教辅章节分布:');
      console.log('================');
      chapterCounts.forEach(c => {
        console.log(`${c.name} (level=${c.level}): ${c.question_count} 题`);
      });
    }
    
  } catch (error) {
    console.error('查询失败:', error.message);
  } finally {
    process.exit(0);
  }
}

checkTutorialQuestions();
