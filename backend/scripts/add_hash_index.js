const mysqlPool = require('../config/mysql');

async function addIndex() {
  try {
    await mysqlPool.query(`
      ALTER TABLE computer1_question ADD INDEX idx_content_hash (content_hash)
    `);
    console.log('✓ 添加索引成功');
  } catch (error) {
    if (error.code === 'ER_DUP_KEYNAME') {
      console.log('索引已存在');
    } else {
      console.error('添加索引失败:', error.message);
    }
  }
  process.exit(0);
}

addIndex();
