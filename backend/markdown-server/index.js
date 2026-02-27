const express = require('express');
const mathjax = require('mathjax-node');

const app = express();
const PORT = 8001;

// 配置 mathjax-node
mathjax.config({
    MathJax: {
        tex2jax: { 
            inlineMath: [['$', '$'], ['\\(', '\\)']] 
        },
        SVG: {
            font: 'TeX'
        }
    }
});

mathjax.start();

// 处理 \color 命令，给 SVG 添加颜色
function processColorInSvg(svg, color) {
    if (!color) return svg;
    // 替换 currentColor 为指定颜色
    return svg
        .replace(/stroke="currentColor"/g, `stroke="#${color}"`)
        .replace(/fill="currentColor"/g, `fill="#${color}"`);
}

// LaTeX 渲染接口
app.get('/', async (req, res) => {
    const tex = req.query.tex;
    const yuml = req.query.yuml;
    
    if (tex) {
        try {
            let processedTex = tex;
            let color = null;
            
            // 检查是否包含 \color{#xxx}{...} 格式
            const colorMatch = tex.match(/^\\color\{#([0-9A-Fa-f]{6})\}\s*\{/);
            if (colorMatch) {
                color = colorMatch[1];
                // 提取内容（处理嵌套大括号）
                let depth = 0;
                let contentStart = colorMatch[0].length - 1;
                let contentEnd = contentStart;
                
                for (let i = contentStart; i < tex.length; i++) {
                    if (tex[i] === '{') depth++;
                    else if (tex[i] === '}') depth--;
                    
                    if (depth === 0) {
                        contentEnd = i;
                        break;
                    }
                }
                
                // 提取实际公式内容
                processedTex = tex.substring(contentStart + 1, contentEnd).trim();
            }
            
            // 将 \bold 转换为 \mathbf（MathJax 支持）
            processedTex = processedTex.replace(/\\bold\{/g, '\\mathbf{');
            
            // 渲染 LaTeX 公式
            const result = await mathjax.typeset({
                math: processedTex,
                format: 'TeX',
                svg: true,
                ex: 6,
                width: 100
            });
            
            let svg = result.svg;
            
            // 如果有颜色，处理 SVG
            if (color) {
                svg = processColorInSvg(svg, color);
            }
            
            res.setHeader('Content-Type', 'image/svg+xml');
            res.send(svg);
        } catch (error) {
            console.error('LaTeX render error:', error);
            res.status(500).send('LaTeX render error');
        }
    } else if (yuml) {
        // yuml 暂不支持，返回占位图
        res.setHeader('Content-Type', 'image/svg+xml');
        res.send(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><text x="10" y="50" font-size="14">yuml: ${yuml.substring(0, 20)}...</text></svg>`);
    } else {
        res.send('Hello');
    }
});

// 健康检查
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Markdown server is running on port ${PORT}`);
    console.log(`Test: http://localhost:${PORT}?tex=hello`);
});
