const mysqlPool = require('./config/mysql');

async function checkData() {
  try {
    // 查看新导入的教辅ID 8 (OS)
    console.log('=== 教辅ID=8 (408 1000 题 os) 的章节 ===');
    const [chapters8] = await mysqlPool.query('SELECT id, name, level, parent_id, question_count FROM computer1_tutorial_chapter WHERE tutorial_id = 8 ORDER BY id');
    chapters8.forEach(c => {
      console.log(`ID: ${c.id}, 名称: ${c.name}, level: ${c.level}, parent_id: ${c.parent_id}, 题目数: ${c.question_count}`);
    });
    
    // 查看题目关联
    console.log('\n=== 教辅ID=8的题目关联 ===');
    const [links8] = await mysqlPool.query('SELECT chapter_id, COUNT(*) as count FROM computer1_tutorial_question WHERE tutorial_id = 8 GROUP BY chapter_id');
    links8.forEach(l => {
      console.log(`章节ID: ${l.chapter_id}, 题目数: ${l.count}`);
    });
    
    // 查看新导入的教辅ID 9 (CN)
    console.log('\n=== 教辅ID=9 (408 1000 题 cn) 的章节 ===');
    const [chapters9] = await mysqlPool.query('SELECT id, name, level, parent_id, question_count FROM computer1_tutorial_chapter WHERE tutorial_id = 9 ORDER BY id');
    chapters9.forEach(c => {
      console.log(`ID: ${c.id}, 名称: ${c.name}, level: ${c.level}, parent_id: ${c.parent_id}, 题目数: ${c.question_count}`);
    });
    
    // 查看题目关联
    console.log('\n=== 教辅ID=9的题目关联 ===');
    const [links9] = await mysqlPool.query('SELECT chapter_id, COUNT(*) as count FROM computer1_tutorial_question WHERE tutorial_id = 9 GROUP BY chapter_id');
    links9.forEach(l => {
      console.log(`章节ID: ${l.chapter_id}, 题目数: ${l.count}`);
    });
    
  } catch (err) {
    console.error('错误:', err);
  } finally {
    process.exit(0);
  }
}

checkData();
