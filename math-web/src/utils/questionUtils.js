import { transformContextString } from './latex';

/**
 * 处理题干，识别填空题标识并渲染 LaTeX
 * @param {string} stem 题干字符串
 * @returns {string} 处理后的 HTML 字符串
 */
export const processStem = (stem) => {
  if (!stem) return '';
  
  // 0. 规范化 HTML 实体 (处理大写实体如 &NBSP;)
  let processedStem = stem.replace(/&[A-Za-z0-9]+;/g, (match) => match.toLowerCase());

  // 1. 代码块保护与美化 (处理 <pre> 和 <code>)
  const codePlaceholders = [];
  processedStem = processedStem.replace(/<(pre|code)[^>]*>([\s\S]*?)<\/\1>/gi, (match, tag, content) => {
    const isPre = tag.toLowerCase() === 'pre';
    const placeholder = `__CODE_BLOCK_PLACEHOLDER_${codePlaceholders.length}__`;
    
    // 提取核心内容并清理 HTML 标签
    let codeContent = content
      .replace(/<(p|div)[^>]*>/gi, '\n') // 换行标签转为换行符
      .replace(/<[^>]+>/g, '')           // 移除其他所有标签
      .replace(/&lt;/g, '<')             // 解码常见实体，防止二次转义
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");
    
    // 转义 HTML
    codeContent = codeContent.replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[m]);

    // 缩进优化：将 4 个或 2 个空格的缩进减小，或者处理 tab
    // 计算机代码常见的 4 空格缩进在移动端太占空间，改为 2 空格
    codeContent = codeContent.replace(/^(\s{4,})/gm, (match) => {
      return '  '.repeat(Math.ceil(match.length / 4));
    });
    // 处理 Tab
    codeContent = codeContent.replace(/\t/g, '  ');

    // 浅色主题代码块样式
    const styledCode = isPre 
      ? `<div style="overflow-x: auto; background: #e0f2f1; border-radius: 8px; margin: 12px 0; -webkit-overflow-scrolling: touch; border: 1px solid #b2dfdb;">
          <pre style="display: inline-block; min-width: 100%; box-sizing: border-box; margin: 0; padding: 16px; color: #333; font-family: 'Consolas', 'Monaco', 'Courier New', monospace; font-size: 15px; line-height: 1.5; white-space: pre; word-break: normal; tab-size: 4;">${codeContent}</pre>
         </div>`
      : `<code style="background: #e0f2f1; color: #333; padding: 2px 6px; border-radius: 4px; font-family: 'Consolas', 'Monaco', monospace; word-break: break-all; border: 1px solid #b2dfdb; margin: 0 4px; font-size: 15px;">${codeContent}</code>`;
    
    codePlaceholders.push({ placeholder, styledCode });
    return placeholder;
  });
  
  // 2. 提取填空题标识 (支持多种格式)
  const blankRegex = /[\$＄][\*＊][\$＄](\d+)[\$＄][\*＊][\$＄]|[\$＄][\*＊](\d+)[\*＊][\$＄]|[\*＊](\d+)[\*＊]/g;
  
  // 转换标识为下划线样式
  processedStem = processedStem.replace(blankRegex, (match, p1, p2, p3) => {
    const num = p1 || p2 || p3;
    return `<span class="blank-placeholder"><span class="blank-index">(${num})</span><span class="blank-underline"></span></span>`;
  });
  
  // 3. LaTeX 渲染
  processedStem = transformContextString(processedStem);

  // 4. 还原代码块
  codePlaceholders.forEach(({ placeholder, styledCode }) => {
    processedStem = processedStem.replace(placeholder, styledCode);
  });

  return processedStem;
};

/**
 * 统计题干中的填空位数量
 * @param {string} stem 题干字符串
 * @returns {number} 填空位数量
 */
export const countBlanks = (stem) => {
  if (!stem) return 0;
  const blankRegex = /[\$＄][\*＊][\$＄](\d+)[\$＄][\*＊][\$＄]|[\$＄][\*＊](\d+)[\*＊][\$＄]|[\*＊](\d+)[\*＊]/g;
  let count = 0;
  let match;
  while ((match = blankRegex.exec(stem)) !== null) {
    count++;
  }
  return count;
};
