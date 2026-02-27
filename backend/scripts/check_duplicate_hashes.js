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

async function checkDuplicateHashes() {
  try {
    // 读取 JSON 文件
    const rawData = JSON.parse(fs.readFileSync('F:/Code/uniapp/demo/cskaoyan_questions_converted.json', 'utf8'));
    const dataArray = rawData.data || rawData;
    
    // 统计每个科目中重复的哈希
    for (const book of dataArray) {
      const subjectName = book.name;
      const hashCount = {};
      let totalQuestions = 0;
      
      for (const chapter of (book.children || [])) {
        for (const section of (chapter.children || [])) {
          for (const qb of (section.question_banks || [])) {
            for (const question of (qb.questions || [])) {
              const hash = calculateQuestionHash(question);
              if (!hashCount[hash]) {
                hashCount[hash] = 0;
              }
              hashCount[hash]++;
              totalQuestions++;
            }
          }
        }
      }
      
      // 找出重复的哈希
      const duplicates = Object.entries(hashCount).filter(([hash, count]) => count > 1);
      
      console.log(`${subjectName}:`);
      console.log(`  总题目数: ${totalQuestions}`);
      console.log(`  唯一哈希数: ${Object.keys(hashCount).length}`);
      console.log(`  重复哈希数: ${duplicates.length}`);
      
      if (duplicates.length > 0) {
        const duplicateCount = duplicates.reduce((sum, [h, c]) => sum + c, 0);
        console.log(`  重复题目总数: ${duplicateCount}`);
        console.log(`  实际应导入: ${Object.keys(hashCount).length} 题`);
      }
      console.log('');
    }
    
  } catch (error) {
    console.error('查询失败:', error.message);
  } finally {
    process.exit(0);
  }
}

checkDuplicateHashes();
