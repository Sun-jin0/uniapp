const mysqlPool = require('../config/mysql');

async function addContentHashField() {
  const connection = await mysqlPool.getConnection();
  
  try {
    // 1. 添加 content_hash 字段
    await connection.query(`
      ALTER TABLE computer1_question 
      ADD COLUMN content_hash VARCHAR(32) NULL COMMENT '内容哈希（用于去重）' AFTER question_id
    `);
    console.log('✓ 添加 content_hash 字段成功');
    
    // 2. 为现有数据计算并更新 content_hash
    const [questions] = await connection.query(`
      SELECT question_id, stem, options, answer FROM computer1_question
    `);
    
    console.log(`正在为 ${questions.length} 道题目计算哈希...`);
    
    let updated = 0;
    for (const q of questions) {
      const crypto = require('crypto');
      let options = q.options;
      if (typeof options === 'string') {
        try {
          options = JSON.parse(options);
        } catch (e) {
          options = {};
        }
      }
      
      const content = JSON.stringify({
        stem: (q.stem || '').trim(),
        options: options || {},
        answer: (q.answer || '').trim()
      });
      const hash = crypto.createHash('md5').update(content).digest('hex');
      
      await connection.query(
        'UPDATE computer1_question SET content_hash = ? WHERE question_id = ?',
        [hash, q.question_id]
      );
      updated++;
      
      if (updated % 100 === 0) {
        console.log(`已处理 ${updated}/${questions.length}`);
      }
    }
    
    // 3. 添加索引
    await connection.query(`
      ALTER TABLE computer1_question ADD INDEX idx_content_hash (content_hash)
    `);
    console.log('✓ 添加索引成功');
    
    console.log(`\n完成！共更新 ${updated} 条记录`);
    
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('content_hash 字段已存在');
    } else {
      console.error('操作失败:', error.message);
    }
  } finally {
    connection.release();
  }
  
  process.exit(0);
}

addContentHashField();
