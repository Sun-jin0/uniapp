const fs = require('fs');

const data = JSON.parse(fs.readFileSync('f:\\Code\\uniapp\\demo\\数据库相关\\cskaoyan_questions_converted.json', 'utf8'));

console.log('数据结构检查:');
console.log('data 是数组:', Array.isArray(data.data));
console.log('data.length:', data.data.length);

if (data.data.length > 0) {
  const book = data.data[0];
  console.log('\n第一本书:', book.name);
  console.log('book.children 长度:', book.children?.length);
  
  if (book.children && book.children.length > 0) {
    const chapter = book.children[0];
    console.log('\n第一章:', chapter.name);
    console.log('chapter.children 长度:', chapter.children?.length);
    console.log('chapter.question_banks:', chapter.question_banks);
    
    if (chapter.children && chapter.children.length > 0) {
      const section = chapter.children[0];
      console.log('\n第一节:', section.name);
      console.log('section.question_banks 长度:', section.question_banks?.length);
      
      if (section.question_banks && section.question_banks.length > 0) {
        const qb = section.question_banks[0];
        console.log('题库:', qb.title);
        console.log('questions 长度:', qb.questions?.length);
      }
    }
  }
}
