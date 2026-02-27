const mysqlPool = require('../config/mysql');
const crypto = require('crypto');
const fs = require('fs');

const calculateQuestionHash = (question) => {
  const content = JSON.stringify({
    stem: (question.stem || '').trim(),
    answer: (question.answer || '').trim()
  });
  return crypto.createHash('md5').update(content).digest('hex');
};

async function findDuplicateQuestions() {
  try {
    // 读取 JSON 文件
    const rawData = JSON.parse(fs.readFileSync('F:/Code/uniapp/demo/cskaoyan_questions_converted.json', 'utf8'));
    const jsonData = rawData.data || rawData;
    
    // 统计 JSON 中的题目哈希
    const jsonHashes = {};
    let totalJsonQuestions = 0;
    
    for (const book of jsonData) {
      for (const chapter of (book.children || [])) {
        for (const section of (chapter.children || [])) {
          for (const qb of (section.questionBanks || [])) {
            for (const question of (qb.questions || [])) {
              const hash = calculateQuestionHash(question);
              if (!jsonHashes[hash]) {
                jsonHashes[hash] = 0;
              }
              jsonHashes[hash]++;
              totalJsonQuestions++;
            }
          }
        }
      }
    }
    
    console.log(`JSON 中总题目数: ${totalJsonQuestions}`);
    console.log(`JSON 中唯一题目数: ${Object.keys(jsonHashes).length}`);
    console.log('');
    
    // 统计数据库中的题目哈希
    const [dbQuestions] = await mysqlPool.query(
      'SELECT question_id, content_hash FROM computer1_question WHERE content_hash IS NOT NULL'
    );
    
    const dbHashSet = new Set(dbQuestions.map(q => q.content_hash));
    
    console.log(`数据库中总题目数: ${dbQuestions.length}`);
    console.log('');
    
    // 检查哪些 JSON 中的题目不在数据库中
    let missingCount = 0;
    for (const hash of Object.keys(jsonHashes)) {
      if (!dbHashSet.has(hash)) {
        missingCount++;
      }
    }
    
    console.log(`JSON 中有但数据库中没有的题目数: ${missingCount}`);
    
    // 检查重复哈希的题目
    const duplicateHashes = Object.entries(jsonHashes)
      .filter(([hash, count]) => count > 1)
      .sort((a, b) => b[1] - a[1]);
    
    console.log(`\n在多个教辅中重复出现的题目数: ${duplicateHashes.length}`);
    if (duplicateHashes.length > 0) {
      console.log('重复次数最多的题目:');
      duplicateHashes.slice(0, 5).forEach(([hash, count]) => {
        console.log(`  哈希: ${hash.substring(0, 16)}... 出现 ${count} 次`);
      });
    }
    
  } catch (error) {
    console.error('查询失败:', error.message);
  } finally {
    process.exit(0);
  }
}

findDuplicateQuestions();
