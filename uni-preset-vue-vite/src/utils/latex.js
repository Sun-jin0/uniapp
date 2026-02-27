import katex from 'katex';
import renderMathInElement from 'katex/dist/contrib/auto-render';
import 'katex/dist/katex.min.css';

// 确保 katex 在全局可用，以便 auto-render 插件能找到它
if (typeof window !== 'undefined') {
  window.katex = katex;
  window.renderMathInElement = renderMathInElement;
}

// #ifdef MP-WEIXIN
// 导入 Towxml 用于微信小程序
const towxml = require("../wxcomponents/towxml/index");
// #endif

function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * 提取匹配的大括号内容
 * @param {string} str - 从 { 开始的字符串
 * @returns {object} - { content: 内容, length: 消耗的字符数 }
 */
function extractBracedContent(str) {
  if (!str || str[0] !== '{') return { content: '', length: 0 };
  
  let depth = 0;
  let i = 0;
  
  while (i < str.length) {
    if (str[i] === '{') depth++;
    else if (str[i] === '}') depth--;
    
    i++;
    
    if (depth === 0) break;
  }
  
  return {
    content: str.substring(1, i - 1),
    length: i
  };
}

/**
 * 处理包含 \color 命令的公式
 * 将 $\color{#xxx}{内容}$ 保留为公式格式，让后端 markdown-server 处理颜色
 * @param {string} text - 原始文本
 * @returns {string} - 处理后的文本
 */
function processColorInLatex(text) {
  if (!text) return text;
  
  let result = '';
  let i = 0;
  
  while (i < text.length) {
    // 检查是否是 $\color{#xxx}{...}$ 模式（允许 $ 和 \color 之间有空白字符）
    if (text[i] === '$' && text.substring(i + 1).match(/^\s*\\color\{#([0-9A-Fa-f]{6})\}\s*\{/)) {
      const match = text.substring(i).match(/^\$\s*\\color\{#([0-9A-Fa-f]{6})\}\s*\{/);
      if (match) {
        const color = match[1];
        const braceStart = i + match[0].length - 1;
        const afterBrace = text.substring(braceStart);
        const braceResult = extractBracedContent(afterBrace);
        
        if (braceResult.length > 0) {
          // 检查大括号后面是否紧跟 $ 符号（允许有空白字符）
          const afterContent = text.substring(braceStart + braceResult.length);
          const afterMatch = afterContent.match(/^\s*\$/);
          if (afterMatch) {
            // 保留公式格式，让后端处理颜色
            // 格式: $\color{#xxx}{内容}$
            result += `$\\color{#${color}}{${braceResult.content.trim()}}$`;
            i = braceStart + braceResult.length + afterMatch[0].length;
            continue;
          }
        }
      }
    }
    
    result += text[i];
    i++;
  }
  
  return result;
}

/**
 * 预处理文本，将自定义标签转换为 Markdown
 * @param {string} text - 原始文本
 * @returns {string} - 处理后的 Markdown 文本
 */
function preprocessTextForMp(text) {
  if (!text || typeof text !== 'string') return '';
  
  let processed = text;
  
  // 0. 预处理 LaTeX 公式边界
  // 注意：不再移除公式边界的换行符，因为这会破坏选项之间的换行
  
  // 0.1 先处理数据中已有的 <br> 标签 - 统一转换为换行符
  // 同时处理 <br> 后面可能跟着的换行符，避免产生连续换行
  processed = processed.replace(/<br\s*\/?>\n?/gi, '\n');
  
  // 0.2 处理公式内的 \color 命令
  processed = processColorInLatex(processed);
  
  // 0.3 处理公式内的 \mathbf 命令
  processed = processed.replace(/\$\\mathbf\{([^}]*)\}\$/g, (match, content) => {
    return `<strong>${content}</strong>`;
  });
  
  // 0.4 清理 LaTeX 公式内部的换行符（在 $...$ 之间）
  // 这一步很重要，因为换行符会导致 LaTeX 渲染服务出错
  processed = processed.replace(/\$([^$]+)\$/g, (match, formula) => {
    // 移除公式内的换行符，保留空格
    const cleaned = formula.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    return `$${cleaned}$`;
  });
  processed = processed.replace(/\$\$([^$]+)\$\$/g, (match, formula) => {
    const cleaned = formula.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    return `$$${cleaned}$$`;
  });
  
  // 1. 处理 《答案》等自定义标签 - 转换为 HTML，使用 data-type 属性标记类型
  // 这样 Towxml 可以正确解析，然后通过 CSS 样式显示颜色
  processed = processed
    .replace(/《答案》/g, '<span class="custom-answer">【答案】</span>')
    .replace(/《\/答案》/g, '')
    .replace(/《分析》/g, '<span class="custom-analysis">【思路分析】</span>')
    .replace(/《\/分析》/g, '')
    .replace(/《点评》/g, '<span class="custom-comment">【点评】</span>')
    .replace(/《\/点评》/g, '')
    .replace(/《注释》/g, '<span class="custom-note">')
    .replace(/《\/注释》/g, '</span>')
    .replace(/《步骤》/g, '<span class="custom-step">【步骤】</span>')
    .replace(/《\/步骤》/g, '');
  
  // 2. 处理 \bold 和 \mathbf 命令（仅处理公式外的）
  // 注意：公式内的 \bold 和 \mathbf 会被保留，让后端处理
  // 只有当它们不在 $...$ 内时才转换为 Markdown 格式
  processed = processed
    .replace(/\\bold\{([^}]+)\}/g, (match, content, offset, string) => {
      // 检查是否在公式内
      const beforeMatch = string.substring(0, offset);
      const dollarCount = (beforeMatch.match(/\$/g) || []).length;
      if (dollarCount % 2 === 1) {
        // 在公式内，保留原样
        return match;
      }
      return `**${content}**`;
    })
    .replace(/\\mathbf\{([^}]+)\}/g, (match, content, offset, string) => {
      // 检查是否在公式内
      const beforeMatch = string.substring(0, offset);
      const dollarCount = (beforeMatch.match(/\$/g) || []).length;
      if (dollarCount % 2 === 1) {
        // 在公式内，保留原样
        return match;
      }
      return `**${content}**`;
    });
  
  // 3. 处理 Markdown 格式图片 ![alt](url) - 转换为 HTML img 标签
  processed = processed.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    (match, alt, url) => {
      // 解码 URL（处理被编码的字符）
      let decodedUrl = url;
      try {
        decodedUrl = decodeURIComponent(url);
      } catch (e) {
        // 解码失败则使用原 URL
      }
      // 去除 _yjs 等后缀
      let cleanUrl = decodedUrl.replace(/(_yjs|_thumb|_small|_medium|_large)(\?.*)?$/i, '$2');
      // 微信小程序要求 HTTPS，将 HTTP 转换为 HTTPS
      cleanUrl = cleanUrl.replace(/^http:\/\//i, 'https://');
      return `<img src="${cleanUrl}" alt="${alt}" style="max-width:100%;height:auto;display:block;margin:10px 0;" />`;
    }
  );
  
  // 3.1 处理 ! `url` 格式（带反引号的图片标记）
  processed = processed.replace(
    /!\s*`\s*(https?:\/\/[^\s`]+\.(?:png|jpg|jpeg|gif|webp|svg|bmp)(?:_yjs|_thumb|_small|_medium|_large)?)\s*`/gi,
    (match, url) => {
      // 解码 URL（处理被编码的字符）
      let decodedUrl = url;
      try {
        decodedUrl = decodeURIComponent(url);
      } catch (e) {
        // 解码失败则使用原 URL
      }
      // 去除 _yjs 等后缀
      let cleanUrl = decodedUrl.replace(/(_yjs|_thumb|_small|_medium|_large)(\?.*)?$/i, '$2');
      // 微信小程序要求 HTTPS，将 HTTP 转换为 HTTPS
      cleanUrl = cleanUrl.replace(/^http:\/\//i, 'https://');
      return `<img src="${cleanUrl}" alt="" style="max-width:100%;height:auto;display:block;margin:10px 0;" />`;
    }
  );
  
  // 4. 处理图片URL（如 http://ysj-question.oss-cn-hangzhou.aliyuncs.com/...）
  processed = processed.replace(
    /(https?:\/\/[^\s<>"]+\.(?:png|jpg|jpeg|gif|webp|svg|bmp))(?:_yjs|_thumb|_small|_medium|_large)?(?!["'])/gi,
    (match, url) => {
      // 去除 _yjs 等后缀
      let cleanUrl = url.replace(/(_yjs|_thumb|_small|_medium|_large)$/i, '');
      // 微信小程序要求 HTTPS，将 HTTP 转换为 HTTPS
      cleanUrl = cleanUrl.replace(/^http:\/\//i, 'https://');
      return `<img src="${cleanUrl}" style="max-width:100%;height:auto;display:block;margin:10px 0;" />`;
    }
  );
  
  // 5. 解码 HTML 实体
  processed = processed
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
  
  // 6. 自动识别选择题选项并添加换行
  // 格式：$\left( \mathrm{A/B/C/D} \right)$ 或 (A) (B) (C) (D) 等
  // 在选项前添加换行符，确保每个选项单独一行
  processed = processed.replace(
    /([^\n])(\$\s*\\left\(\s*\\mathrm\{[A-D]\}\s*\\right\)\s*\$)/g,
    (match, before, option) => {
      return `${before}\n${option}`;
    }
  );
  processed = processed.replace(
    /([^\n])(\([A-D]\))/g,
    (match, before, option) => {
      if (before.match(/[A-D]$/)) {
        return match;
      }
      return `${before}\n${option}`;
    }
  );
  processed = processed.replace(
    /([^\n])([A-D]\.)/g,
    (match, before, option) => {
      if (before.match(/[A-D]$/)) {
        return match;
      }
      return `${before}\n${option}`;
    }
  );
  
  // 7. 不再手动转换换行符，让 towxml 的 markdown 解析器（breaks: true）自动处理
  // towxml 会自动将换行符转换为 <br> 标签
  
  return processed;
}

/**
 * 使用 Towxml 解析包含 LaTeX 公式的文本
 * 适用于微信小程序
 * @param {string} text - 包含 LaTeX 公式的文本
 * @returns {Object} - Towxml 可用的 nodes 对象
 */
export function parseTextWithLatexForMp(text) {
  if (!text || typeof text !== 'string') {
    return {};
  }

  try {
    // 1. 预处理文本
    let processedText = preprocessTextForMp(text);
    
    // 2. 使用 Towxml 解析为 Markdown/LaTeX
    // Towxml 会自动处理 $...$ 和 $$...$$ 中的 LaTeX 公式
    const result = towxml(processedText, 'markdown');
    
    return result || {};
  } catch (error) {
    console.error('parseTextWithLatexForMp error:', error);
    // 出错时返回原始文本作为纯文本节点
    return {
      type: 'element',
      tag: 'div',
      children: [{ type: 'text', text: text }]
    };
  }
}

// H5 版本的 transformContextString 函数保持不变
export function transformContextString(rawContextString) {
  if (typeof rawContextString !== 'string') return '';

  const placeholders = [];
  const createPlaceholder = (content, type = 'html') => {
    const p = `__LATEX_JS_${type.toUpperCase()}_PH_${placeholders.length}__`;
    placeholders.push({ p, content, type });
    return p;
  };

  let currentText = rawContextString.trim().replace(/\t/g, ' ').replace(/ {2,}/g, ' ');
  
  // 1. 提取并保护所有数学公式 (在反转义 HTML 之前，避免公式内的符号被破坏)
  let mathRegex;
  try {
    mathRegex = /(\$\$[\s\S]*?\$\$)|((?<!\\)\$([\s\S]+?)(?<!\\)\$)|(\\\[[\s\S]*?\\\])|(\\\([\s\S]*?\\\))/g;
  } catch (e) {
    mathRegex = /(\$\$[\s\S]*?\$\$)|(\$([\s\S]+?)\$)|(\\\[[\s\S]*?\\\])|(\\\([\s\S]*?\\\))/g;
  }
  
  currentText = currentText.replace(mathRegex, (match, p1, p2, p3, p4, p5) => {
    let expression = '';
    let displayMode = false;
    
    if (p1) { // $$...$$
      expression = p1.slice(2, -2);
      displayMode = true;
    } else if (p2) { // $...$
      expression = p3;
      displayMode = false;
    } else if (p4) { // \[...\]
      expression = p4.slice(2, -2);
      displayMode = true;
    } else if (p5) { // \(...\)
      expression = p5.slice(2, -2);
      displayMode = false;
    }
    
    if (!expression.trim()) return match;
    
    try {
      const rendered = katex.renderToString(expression, {
        throwOnError: false,
        displayMode: displayMode,
        strict: false
      });
      return createPlaceholder(rendered, 'math');
    } catch (e) {
      console.warn('KaTeX render error:', e);
      return match;
    }
  });

  // 2. 反转义 HTML 实体
  currentText = currentText
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");

  // 3. 处理 《答案》等自定义标签
  currentText = currentText
    .replace(/《答案》/g, '<span style="color:#009688;font-weight:bold;">【答案】</span>')
    .replace(/《\/答案》/g, '')
    .replace(/《分析》/g, '<span style="color:#009688;font-weight:bold;">【思路分析】</span>')
    .replace(/《\/分析》/g, '')
    .replace(/《点评》/g, '<span style="color:#FF5405;font-weight:bold;">【点评】</span>')
    .replace(/《\/点评》/g, '')
    .replace(/《注释》/g, '<span style="color:#666;font-style:italic;">')
    .replace(/《\/注释》/g, '</span>')
    .replace(/《步骤》/g, '<span style="color:#FF5405;font-weight:bold;">')
    .replace(/《\/步骤》/g, '</span>');

  // 4. 处理 \color 和 \bold 命令
  currentText = currentText
    .replace(/\\color\{#([0-9A-Fa-f]{6})\}\{([^}]+)\}/g, '<span style="color:#$1;">$2</span>')
    .replace(/\\bold\{([^}]+)\}/g, '<b>$1</b>')
    .replace(/\\mathbf\{([^}]+)\}/g, '<b>$1</b>');

  // 5. 处理 Markdown 格式图片 ![alt](url) - 转换为 HTML img 标签
  // 先去除 _yjs 等后缀
  currentText = currentText.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    (match, alt, url) => {
      // 解码 URL（处理被编码的字符）
      let decodedUrl = url;
      try {
        decodedUrl = decodeURIComponent(url);
      } catch (e) {
        // 解码失败则使用原 URL
      }
      // 去除 _yjs 等后缀
      let cleanUrl = decodedUrl.replace(/(_yjs|_thumb|_small|_medium|_large)(\?.*)?$/i, '$2');
      // 将 HTTP 转换为 HTTPS
      cleanUrl = cleanUrl.replace(/^http:\/\//i, 'https://');
      return `<img src="${cleanUrl}" alt="${alt}" style="max-width:100%;height:auto;display:block;margin:10px 0;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,0.1);" onerror="this.style.display='none'" />`;
    }
  );

  // 5.1 处理 ! `url` 格式（带反引号的图片标记）
  currentText = currentText.replace(
    /!\s*`\s*(https?:\/\/[^\s`]+\.(?:png|jpg|jpeg|gif|webp|svg|bmp)(?:_yjs|_thumb|_small|_medium|_large)?)\s*`/gi,
    (match, url) => {
      // 解码 URL（处理被编码的字符）
      let decodedUrl = url;
      try {
        decodedUrl = decodeURIComponent(url);
      } catch (e) {
        // 解码失败则使用原 URL
      }
      // 去除 _yjs 等后缀
      let cleanUrl = decodedUrl.replace(/(_yjs|_thumb|_small|_medium|_large)(\?.*)?$/i, '$2');
      // 将 HTTP 转换为 HTTPS
      cleanUrl = cleanUrl.replace(/^http:\/\//i, 'https://');
      return `<img src="${cleanUrl}" alt="" style="max-width:100%;height:auto;display:block;margin:10px 0;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,0.1);" onerror="this.style.display='none'" />`;
    }
  );

  // 6. 处理图片URL（如 http://ysj-question.oss-cn-hangzhou.aliyuncs.com/...）
  // 使用否定前瞻避免匹配已经包含在 <img src="..."> 中的URL
  currentText = currentText.replace(
    /(https?:\/\/[^\s<>"]+\.(?:png|jpg|jpeg|gif|webp|svg|bmp))(?:_yjs|_thumb|_small|_medium|_large)?(?!["'])/gi,
    (match, url) => {
      // 去除 _yjs 等后缀
      let cleanUrl = url.replace(/(_yjs|_thumb|_small|_medium|_large)$/i, '');
      // 将 HTTP 转换为 HTTPS
      cleanUrl = cleanUrl.replace(/^http:\/\//i, 'https://');
      return `<img src="${cleanUrl}" style="max-width:100%;height:auto;display:block;margin:10px 0;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,0.1);" onerror="this.style.display='none'" />`;
    }
  );

  // 7. 还原占位符
  placeholders.forEach(({ p, content }) => {
    currentText = currentText.replace(p, content);
  });

  // 8. 将换行符转换为 <br>
  currentText = currentText.replace(/\n/g, '<br>');

  return currentText;
}

/**
 * 包装 LaTeX 命令（将未包裹的命令用 $...$ 包裹）
 * @param {string} text - 原始文本
 * @returns {string} - 处理后的文本
 */
export function wrapLatexCommands(text) {
  if (!text || typeof text !== 'string') return '';
  
  // 匹配常见的 LaTeX 命令，如果它们没有被 $ 包裹，则添加 $ 包裹
  const latexCommands = [
    '\\left', '\\right', '\\frac', '\\sum', '\\int', '\\lim', '\\infty',
    '\\alpha', '\\beta', '\\gamma', '\\delta', '\\epsilon', '\\zeta',
    '\\eta', '\\theta', '\\iota', '\\kappa', '\\lambda', '\\mu',
    '\\nu', '\\xi', '\\pi', '\\rho', '\\sigma', '\\tau',
    '\\upsilon', '\\phi', '\\chi', '\\psi', '\\omega',
    '\\Gamma', '\\Delta', '\\Theta', '\\Lambda', '\\Xi', '\\Pi',
    '\\Sigma', '\\Upsilon', '\\Phi', '\\Psi', '\\Omega',
    '\\sin', '\\cos', '\\tan', '\\cot', '\\sec', '\\csc',
    '\\arcsin', '\\arccos', '\\arctan', '\\ln', '\\log', '\\exp',
    '\\sqrt', '\\vec', '\\overrightarrow', '\\cdot', '\\times',
    '\\div', '\\pm', '\\mp', '\\leq', '\\geq', '\\neq',
    '\\approx', '\\equiv', '\\sim', '\\propto', '\\perp',
    '\\parallel', '\\angle', '\\triangle', '\\square', '\\circ',
    '\\degree', '\\prime', '\\partial', '\\nabla', '\\hbar',
    '\\ell', '\\Re', '\\Im', '\\wp', '\\aleph', '\\imath',
    '\\jmath', '\\varphi', '\\varepsilon', '\\vartheta',
    '\\varpi', '\\varrho', '\\varsigma',
    '\\rightarrow', '\\leftarrow', '\\Rightarrow', '\\Leftarrow',
    '\\leftrightarrow', '\\Leftrightarrow', '\\mapsto',
    '\\to', '\\gets', '\\longrightarrow', '\\longleftarrow',
    '\\subset', '\\supset', '\\subseteq', '\\supseteq',
    '\\in', '\\ni', '\\notin', '\\cup', '\\cap',
    '\\setminus', '\\emptyset', '\\forall', '\\exists',
    '\\nexists', '\\neg', '\\wedge', '\\vee', '\\top',
    '\\bot', '\\vdash', '\\models', '\\land', '\\lor',
    '\\lnot', '\\implies', '\\iff',
    '\\ldots', '\\cdots', '\\vdots', '\\ddots', '\\dots',
    '\\quad', '\\qquad', '\\,', '\\:', '\\;', '\\!', '\\ ',
    '\\big', '\\Big', '\\bigg', '\\Bigg',
    '\\bigl', '\\bigr', '\\Bigl', '\\Bigr',
    '\\biggl', '\\biggr', '\\Biggl', '\\Biggr',
    '\\begin', '\\end', '\\mathbf', '\\mathbb', '\\mathcal',
    '\\mathfrak', '\\mathscr', '\\mathrm', '\\mathit',
    '\\mathsf', '\\mathtt', '\\textbf',
    '\\textit', '\\textsf', '\\texttt', '\\emph',
    '\\underline', '\\overline', '\\widehat', '\\widetilde',
    '\\overbrace', '\\underbrace', '\\overset', '\\underset',
    '\\stackrel', '\\binom', '\\tbinom', '\\dbinom',
    '\\pmatrix', '\\bmatrix', '\\vmatrix', '\\Bmatrix',
    '\\matrix', '\\smallmatrix', '\\substack',
    '\\operatorname', '\\DeclareMathOperator', '\\text',
    '\\mbox', '\\hbox', '\\vbox', '\\vcenter',
    '\\raisebox', '\\lower', '\\moveleft', '\\moveright',
    '\\hspace', '\\vspace', '\\hfill', '\\vfill',
    '\\hrule', '\\vrule', '\\hline', '\\cline',
    '\\multicolumn', '\\rowcolor', '\\columncolor',
    '\\color', '\\textcolor', '\\colorbox', '\\fcolorbox',
    '\\pagecolor', '\\definecolor',
    '\\textup', '\\textsl', '\\textsc',
    '\\strike', '\\sout',
    '\\xlongequal', '\\underset', '\\overset'
  ];
  
  // 构建正则表达式，匹配未被 $ 包裹的 LaTeX 命令
  const commandPattern = new RegExp(
    `(?<![$\\])(${latexCommands.join('|')})(?![$])`,
    'g'
  );
  
  // 查找所有需要包裹的 LaTeX 片段
  let result = text;
  const matches = [];
  let match;
  
  while ((match = commandPattern.exec(text)) !== null) {
    const startPos = match.index;
    let endPos = startPos + match[0].length;
    
    // 跳过空白字符
    while (endPos < text.length && /\s/.test(text[endPos])) {
      endPos++;
    }
    
    // 如果后面跟着 {，找到匹配的 }
    if (text[endPos] === '{') {
      let braceDepth = 1;
      endPos++;
      while (endPos < text.length && braceDepth > 0) {
        if (text[endPos] === '{') braceDepth++;
        else if (text[endPos] === '}') braceDepth--;
        endPos++;
      }
    }
    
    matches.push({ start: startPos, end: endPos, text: text.slice(startPos, endPos) });
  }
  
  // 从后往前替换，避免位置偏移
  for (let i = matches.length - 1; i >= 0; i--) {
    const { start, end, text: matchText } = matches[i];
    result = result.slice(0, start) + '$' + matchText + '$' + result.slice(end);
  }
  
  return result;
}

/**
 * 处理文本中的 LaTeX 公式
 * @param {string} text - 原始文本
 * @returns {string} - 处理后的文本
 */
export function processLatexInText(text) {
  if (!text || typeof text !== 'string') return '';
  
  // 1. 首先包装未包裹的 LaTeX 命令
  let processed = wrapLatexCommands(text);
  
  // 2. 处理特殊字符和转义
  processed = processed
    .replace(/\\&/g, '&amp;')
    .replace(/\\%/g, '%')
    .replace(/\\#/g, '#')
    .replace(/\\_/g, '_')
    .replace(/\\\{/g, '{')
    .replace(/\\\}/g, '}')
    .replace(/\\\$/g, '$');
  
  return processed;
}

/**
 * 检查文本是否包含 LaTeX 公式
 * @param {string} text - 文本
 * @returns {boolean} - 是否包含 LaTeX
 */
export function containsLatex(text) {
  if (!text || typeof text !== 'string') return false;
  
  // 匹配 $...$ 或 $$...$$ 或 \[...\] 或 \(...\)
  const latexPattern = /\$\$[\s\S]*?\$\$|\$[^\$]+\$|\\\[[\s\S]*?\\\]|\\\([^\)]+\\\)/;
  return latexPattern.test(text);
}

/**
 * 带重试机制的 KaTeX 渲染（用于 H5）
 * @param {string} element - DOM 元素选择器或元素
 * @param {Object} options - 渲染选项
 * @returns {Promise} - 渲染结果
 */
export function katexRenderWithRetry(element, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      if (typeof window === 'undefined' || !window.katex) {
        reject(new Error('KaTeX not available'));
        return;
      }
      
      const maxRetries = options.maxRetries || 3;
      let retries = 0;
      
      const attempt = () => {
        try {
          if (window.renderMathInElement) {
            window.renderMathInElement(element, {
              delimiters: [
                { left: '$$', right: '$$', display: true },
                { left: '$', right: '$', display: false },
                { left: '\\(', right: '\\)', display: false },
                { left: '\\[', right: '\\]', display: true }
              ],
              throwOnError: false,
              ...options
            });
            resolve();
          } else {
            throw new Error('renderMathInElement not available');
          }
        } catch (error) {
          retries++;
          if (retries < maxRetries) {
            setTimeout(attempt, 100);
          } else {
            reject(error);
          }
        }
      };
      
      attempt();
    } catch (error) {
      reject(error);
    }
  });
}
