/**
 * @fileoverview markdown 插件
 * Include marked (https://github.com/markedjs/marked)
 * Include github-markdown-css (https://github.com/sindresorhus/github-markdown-css)
 */
import { marked }  from './marked.min'
let index = 0

function Markdown (vm) {
  this.vm = vm
  vm._ids = {}
}

/**
 * 预处理文本，处理 LaTeX 公式和 Markdown 的混合
 * 参考 src/utils/latex.js 中的 preprocessTextForMp 函数
 */
function preprocessText(content) {
  if (!content || typeof content !== 'string') {
    return { text: '', formulas: [] };
  }
  let processed = content;
  const formulas = [];
  
  // 1. 处理数据中已有的 <br> 标签 - 统一转换为换行符
  processed = processed.replace(/<br\s*\/?>\n?/gi, '\n');
  
  // 2. 处理公式内的 \color 命令
  processed = processColorInLatex(processed);
  
  // 3. 处理公式内的 \mathbf 命令
  processed = processed.replace(/\$\\mathbf\{([^}]*)\}\$/g, (match, content) => {
    return `<strong>${content}</strong>`;
  });
  
  // 4. 清理 LaTeX 公式内部的换行符（在 $...$ 之间）
  // 这一步很重要，因为换行符会导致 LaTeX 渲染出错
  // 使用占位符保护公式，避免被 marked 处理
  // 使用 HTML 注释作为占位符，这样 marked 不会处理它们
  // 先处理 $$...$$ 块级公式
  processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
    const cleaned = formula.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    formulas.push({ type: 'block', content: cleaned });
    return `<!--BLOCK_FORMULA_${formulas.length - 1}-->`;
  });
  // 再处理 $...$ 行内公式 - 使用非贪婪匹配，避免匹配到 $ 内部的 $
  processed = processed.replace(/\$([^$]+)\$/g, (match, formula) => {
    const cleaned = formula.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    formulas.push({ type: 'inline', content: cleaned });
    return `<!--INLINE_FORMULA_${formulas.length - 1}-->`;
  });
  
  // 5. 处理 《答案》等自定义标签
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
  
  // 6. 处理 \bold 和 \mathbf 命令（仅处理公式外的）
  processed = processed
    .replace(/\\bold\{([^}]+)\}/g, (match, content, offset, string) => {
      const beforeMatch = string.substring(0, offset);
      const dollarCount = (beforeMatch.match(/\$/g) || []).length;
      if (dollarCount % 2 === 1) {
        return match; // 在公式内，保留原样
      }
      return `**${content}**`;
    })
    .replace(/\\mathbf\{([^}]+)\}/g, (match, content, offset, string) => {
      const beforeMatch = string.substring(0, offset);
      const dollarCount = (beforeMatch.match(/\$/g) || []).length;
      if (dollarCount % 2 === 1) {
        return match; // 在公式内，保留原样
      }
      return `**${content}**`;
    });
  
  // 7. 处理 Markdown 格式图片 ![alt](url)
  processed = processed.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    (match, alt, url) => {
      let decodedUrl = url;
      try {
        decodedUrl = decodeURIComponent(url);
      } catch (e) {}
      let cleanUrl = decodedUrl.replace(/(_yjs|_thumb|_small|_medium|_large)(\?.*)?$/i, '$2');
      cleanUrl = cleanUrl.replace(/^http:\/\//i, 'https://');
      return `<img src="${cleanUrl}" alt="${alt}" style="max-width:100%;height:auto;display:block;margin:10px 0;" />`;
    }
  );
  
  // 8. 处理图片URL
  processed = processed.replace(
    /(https?:\/\/[^\s<>"]+\.(?:png|jpg|jpeg|gif|webp|svg|bmp))(?:_yjs|_thumb|_small|_medium|_large)?(?!["'])/gi,
    (match, url) => {
      let cleanUrl = url.replace(/(_yjs|_thumb|_small|_medium|_large)$/i, '');
      cleanUrl = cleanUrl.replace(/^http:\/\//i, 'https://');
      return `<img src="${cleanUrl}" style="max-width:100%;height:auto;display:block;margin:10px 0;" />`;
    }
  );
  
  // 9. 解码 HTML 实体
  processed = processed
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
  
  // 10. 自动识别选择题选项并添加换行
  // 格式：$\left( \mathrm{A/B/C/D} \right)$ 或 (A) (B) (C) (D) 等
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

  return { text: processed, formulas };
}

/**
 * 处理包含 \color 命令的公式
 */
function processColorInLatex(text) {
  if (!text) return text;
  
  let result = '';
  let i = 0;
  
  while (i < text.length) {
    if (text[i] === '$' && text.substring(i + 1).match(/^\s*\\color\{#([0-9A-Fa-f]{6})\}\s*\{/)) {
      const match = text.substring(i).match(/^\$\s*\\color\{#([0-9A-Fa-f]{6})\}\s*\{/);
      if (match) {
        const color = match[1];
        const braceStart = i + match[0].length - 1;
        const afterBrace = text.substring(braceStart);
        const braceResult = extractBracedContent(afterBrace);
        
        if (braceResult.length > 0) {
          const afterContent = text.substring(braceStart + braceResult.length);
          const afterMatch = afterContent.match(/^\s*\$/);
          if (afterMatch) {
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
 * 提取匹配的大括号内容
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

Markdown.prototype.onUpdate = function (content) {
  if (this.vm.markdown && content) {
    // 预处理文本，处理 LaTeX 和 Markdown 的混合
    const result = preprocessText(content);
    let processed = result.text;
    const formulas = result.formulas;
    
    // 解决中文标点符号后粗体失效的问题，增加零宽空格
    processed = processed.replace(/\*\*([^*]+)\*\*([，。！？；：])/g, '**$1**&#8203;$2')
    
    // 处理 --- 包裹的代码块（转换为标准代码块）
    processed = processed.replace(/---\s*\n([\s\S]*?)\n---/g, '\n\n```\n$1\n```\n\n')
    
    // 保护代码块，防止换行符被转换为 <br>
    const codeBlocks = [];
    processed = processed.replace(/```[\s\S]*?```|`[^`]*`/g, (match) => {
      const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
      codeBlocks.push(match);
      return placeholder;
    });
    
    // 配置 marked 选项
    marked.setOptions({
      breaks: true,  // 启用换行符转换为 <br>
      gfm: true,     // 启用 GitHub Flavored Markdown
      headerIds: false,  // 禁用自动添加 header id
      mangle: false  // 禁用自动转义
    })
    
    // 手动将换行符转换为 <br> 标签（marked 的 breaks 选项可能不总是生效）
    // 但代码块内的换行符不转换
    processed = processed.replace(/\n/g, '<br>\n')
    
    // 恢复代码块
    codeBlocks.forEach((block, index) => {
      processed = processed.replace(`__CODE_BLOCK_${index}__`, block);
    });
    
    let html = marked(processed);
    
    // 移除代码块内的 <br> 标签（代码块应该使用原始换行符）
    html = html.replace(/(<pre[^>]*>)([\s\S]*?)(<\/pre>)/gi, (match, open, content, close) => {
      const cleanedContent = content.replace(/<br\s*\/?>/gi, '');
      return open + cleanedContent + close;
    });
    html = html.replace(/(<code[^>]*>)([\s\S]*?)(<\/code>)/gi, (match, open, content, close) => {
      const cleanedContent = content.replace(/<br\s*\/?>/gi, '');
      return open + cleanedContent + close;
    });
    
    // 还原公式占位符
    html = html.replace(/<!--BLOCK_FORMULA_(\d+)-->/g, (match, index) => {
      const formula = formulas[parseInt(index)];
      if (formula) {
        return `$$${formula.content}$$`;
      }
      return match;
    });
    html = html.replace(/<!--INLINE_FORMULA_(\d+)-->/g, (match, index) => {
      const formula = formulas[parseInt(index)];
      if (formula) {
        return `$${formula.content}$`;
      }
      return match;
    });
    
    return html;
  }
}

Markdown.prototype.onParse = function (node, vm) {
  if (vm.options.markdown) {
    // 中文 id 需要转换，否则无法跳转
    if (vm.options.useAnchor && node.attrs && /[\u4e00-\u9fa5]/.test(node.attrs.id)) {
      const id = 't' + index++
      this.vm._ids[node.attrs.id] = id
      node.attrs.id = id
    }
    if (node.name === 'p' || node.name === 'table' || node.name === 'tr' || node.name === 'th' || node.name === 'td' || node.name === 'blockquote' || node.name === 'pre' || node.name === 'code') {
      node.attrs.class = `md-${node.name} ${node.attrs.class || ''}`
    }
  }
}

export default Markdown
