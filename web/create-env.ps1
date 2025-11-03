# PowerShell script to create .env file from parent directory's .env
$parentEnv = Join-Path (Split-Path $PSScriptRoot) ".env"
$webEnv = Join-Path $PSScriptRoot ".env"

if (Test-Path $parentEnv) {
    Write-Host "Reading parent .env file..." -ForegroundColor Green
    $content = Get-Content $parentEnv
    
    $supabaseUrl = ($content | Select-String "EXPO_PUBLIC_SUPABASE_URL").ToString() -replace "EXPO_PUBLIC_", "VITE_"
    $supabaseKey = ($content | Select-String "EXPO_PUBLIC_SUPABASE_ANON_KEY").ToString() -replace "EXPO_PUBLIC_", "VITE_"
    $openaiKey = ($content | Select-String "EXPO_PUBLIC_OPENAI_API_KEY").ToString() -replace "EXPO_PUBLIC_", "VITE_"
    
    $newContent = @()
    if ($supabaseUrl) { $newContent += $supabaseUrl }
    if ($supabaseKey) { $newContent += $supabaseKey }
    if ($openaiKey) { $newContent += $openaiKey }
    
    $newContent | Out-File -FilePath $webEnv -Encoding utf8
    Write-Host ".env file created successfully!" -ForegroundColor Green
    Write-Host "Location: $webEnv" -ForegroundColor Cyan
} else {
    Write-Host "Parent .env file not found. Please create .env manually." -ForegroundColor Yellow
    Write-Host "Copy .env.example to .env and fill in your credentials." -ForegroundColor Yellow
}

