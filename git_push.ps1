$ErrorActionPreference = "Continue"
Set-Location "F:\Code\uniapp\demo"
& "D:\Downloads\Git\bin\git.exe" add -A
if ($LASTEXITCODE -eq 0) {
    Write-Host "Add successful"
    & "D:\Downloads\Git\bin\git.exe" commit -m "fix: 后端同时支持 image 和 file 字段名上传"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Commit successful"
        & "D:\Downloads\Git\bin\git.exe" push origin main
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Push successful"
        } else {
            Write-Host "Push failed"
        }
    } else {
        Write-Host "Commit failed"
    }
} else {
    Write-Host "Add failed"
}
