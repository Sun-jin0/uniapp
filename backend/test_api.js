const mysqlPool = require('./config/mysql');

async function testAPI() {
  try {
    const tutorialId = 4; // OS 全书习题
    
    // 模拟 getChapters API
    const [chapters] = await mysqlPool.query(
      'SELECT * FROM computer1_tutorial_chapter WHERE tutorial_id = ? ORDER BY sort_order ASC, id ASC',
      [tutorialId]
    );
    
    console.log('原始章节数据:');
    chapters.forEach(c => {
      console.log(`  ID: ${c.id}, name: ${c.name}, level: ${c.level}, parent_id: ${c.parent_id}`);
    });
    
    // 构建树形结构
    const chapterMap = {};
    const tree = [];
    
    chapters.forEach(chapter => {
      chapterMap[chapter.id] = { ...chapter, children: [] };
    });
    
    chapters.forEach(chapter => {
      if (chapter.parent_id && chapterMap[chapter.parent_id]) {
        chapterMap[chapter.parent_id].children.push(chapterMap[chapter.id]);
      } else if (!chapter.parent_id || chapter.parent_id === 0) {
        tree.push(chapterMap[chapter.id]);
      }
    });
    
    console.log('\n构建后的树形结构:');
    tree.forEach(chapter => {
      console.log(`章: ${chapter.name} (ID: ${chapter.id})`);
      chapter.children.forEach(section => {
        console.log(`  节: ${section.name} (ID: ${section.id})`);
      });
    });
    
  } catch (err) {
    console.error('错误:', err);
  } finally {
    process.exit(0);
  }
}

testAPI();
