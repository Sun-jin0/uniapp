# 批量替换 MP-WEIXIN 为 MP-WEIXIN || APP-PLUS

$files = @(
    'uni-preset-vue-vite/src/pages/math/math-question-detail.vue',
    'uni-preset-vue-vite/src/pages/computer/computer-question-detail.vue',
    'uni-preset-vue-vite/src/pages/math/math-practice-search.vue',
    'uni-preset-vue-vite/src/pages/math/math-generated-paper.vue',
    'uni-preset-vue-vite/src/pages/math/math-generated-paper-analysis.vue',
    'uni-preset-vue-vite/src/pages/computer/computer-generated-paper.vue',
    'uni-preset-vue-vite/src/pages/computer/computer-generated-paper-analysis.vue'
)

foreach ($file in $files) {
    $fullPath = Join-Path 'f:\Code\uniapp\demo' $file
    if (Test-Path $fullPath) {
        $content = Get-Content $fullPath -Raw
        $content = $content -replace '#ifdef MP-WEIXIN', '#ifdef MP-WEIXIN || APP-PLUS'
        $content = $content -replace '#ifndef MP-WEIXIN', '#ifndef MP-WEIXIN || APP-PLUS'
        Set-Content $fullPath $content -NoNewline
        Write-Host "已修复: $file"
    } else {
        Write-Host "文件不存在: $file"
    }
}

Write-Host "完成！"
