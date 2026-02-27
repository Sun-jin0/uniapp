import katex from 'katex';
import renderMathInElement from 'katex/dist/contrib/auto-render';
import 'katex/dist/katex.min.css';

// 确保 katex 在全局可用，以便 auto-render 插件能找到它
if (typeof window !== 'undefined') {
  window.katex = katex;
  window.renderMathInElement = renderMathInElement;
}

// Towxml is only used in WeChat Mini Program, not in web environment

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
 * 预处理文本，将自定义标签转换为 Markdown
 * @param {string} text - 原始文本
 * @returns {string} - 处理后的 Markdown 文本
 */
function preprocessTextForMp(text) {
  if (!text || typeof text !== 'string') return '';
  
  let processed = text;
  
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
  
  // 2. 处理 \color 命令 - 转换为 HTML span 标签
  processed = processed
    .replace(/\\color\{#([0-9A-Fa-f]{6})\}\{([^}]+)\}/g, '<span style="color:#$1;">$2</span>')
    .replace(/\\bold\{([^}]+)\}/g, '**$1**')
    .replace(/\\mathbf\{([^}]+)\}/g, '**$1**');
  
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
      const cleanUrl = decodedUrl.replace(/(_yjs|_thumb|_small|_medium|_large)(\?.*)?$/i, '$2');
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
      const cleanUrl = decodedUrl.replace(/(_yjs|_thumb|_small|_medium|_large)(\?.*)?$/i, '$2');
      return `<img src="${cleanUrl}" alt="" style="max-width:100%;height:auto;display:block;margin:10px 0;" />`;
    }
  );
  
  // 4. 处理图片URL（如 http://ysj-question.oss-cn-hangzhou.aliyuncs.com/...）
  processed = processed.replace(
    /(https?:\/\/[^\s<>"]+\.(?:png|jpg|jpeg|gif|webp|svg|bmp))(?:_yjs|_thumb|_small|_medium|_large)?(?!["'])/gi,
    (match, url) => {
      // 去除 _yjs 等后缀
      const cleanUrl = url.replace(/(_yjs|_thumb|_small|_medium|_large)$/i, '');
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

  // 在 H5 环境中，towxml 未定义，返回简单的文本节点
  // 避免复杂的处理导致内存问题
  return {
    type: 'element',
    tag: 'div',
    children: [{ type: 'text', text: text.substring(0, 500) }]
  };
}

// H5 版本的 transformContextString 函数 - 简化版，避免内存问题
export function transformContextString(rawContextString) {
  if (typeof rawContextString !== 'string') return '';
  
  // 限制处理文本长度，避免内存溢出
  const MAX_LENGTH = 50000;
  let currentText = rawContextString;
  if (currentText.length > MAX_LENGTH) {
    console.warn('Text too long, truncating to', MAX_LENGTH, 'chars');
    currentText = currentText.substring(0, MAX_LENGTH) + '... (内容已截断)';
  }

  try {
    // 1. 先处理简单的文本替换（不需要正则的）
    currentText = currentText
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
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

    // 2. 处理数学公式 - 使用更简单的方法
    // 匹配 $...$ 和 $$...$$
    currentText = currentText.replace(/\$\$([\s\S]*?)\$\$/g, (match, expr) => {
      try {
        return katex.renderToString(expr, { throwOnError: false, displayMode: true });
      } catch (e) {
        return match;
      }
    });
    
    currentText = currentText.replace(/\$([\s\S]*?)\$/g, (match, expr) => {
      try {
        return katex.renderToString(expr, { throwOnError: false, displayMode: false });
      } catch (e) {
        return match;
      }
    });

    // 3. 处理图片 URL
    currentText = currentText.replace(
      /(https?:\/\/[^\s<>"]+\.(?:png|jpg|jpeg|gif|webp|svg|bmp))(?:_yjs|_thumb|_small|_medium|_large)?(?!["'])/gi,
      '<img src="$1" style="max-width:100%;height:auto;display:block;margin:10px 0;" onerror="this.style.display=\'none\'" />'
    );

    // 4. 将换行符转换为 <br>
    currentText = currentText.replace(/\n/g, '<br>');

    return currentText;
  } catch (error) {
    console.error('transformContextString error:', error);
    // 出错时返回原始文本的 HTML 转义版本
    return rawContextString.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
  }
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
