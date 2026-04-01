const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

const UPLOAD_URL = 'https://s3.hi168.com/hi168-26998-7111ilq6/upload';
const ICONS_DIR = 'f:/Code/uniapp/demo/普通奖池';

const icons = [
  { file: 'legendary.png', tier: 'legendary' },
  { file: 'epic.png', tier: 'epic' },
  { file: 'rare.png', tier: 'rare' },
  { file: 'common.png', tier: 'common' }
];

async function uploadIcon(icon) {
  const filePath = path.join(ICONS_DIR, icon.file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`文件不存在: ${filePath}`);
    return null;
  }

  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));

  try {
    const response = await axios.post(UPLOAD_URL, form, {
      headers: {
        ...form.getHeaders(),
        'Accept': 'application/json'
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    if (response.data && response.data.url) {
      console.log(`${icon.tier} 图标上传成功: ${response.data.url}`);
      return response.data.url;
    }
  } catch (error) {
    console.error(`${icon.tier} 图标上传失败:`, error.message);
  }
  return null;
}

async function uploadAllIcons() {
  const results = {};
  
  for (const icon of icons) {
    const url = await uploadIcon(icon);
    if (url) {
      results[icon.tier] = url;
    }
  }

  console.log('\n上传结果:');
  console.log(JSON.stringify(results, null, 2));
  
  // 生成 SQL 更新语句
  console.log('\n-- 更新数据库的 SQL 语句:');
  Object.entries(results).forEach(([tier, url]) => {
    console.log(`UPDATE cards SET icon_url = '${url}' WHERE tier = '${tier}';`);
  });
}

uploadAllIcons();
