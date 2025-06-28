Write-Host "Starting server for API tests..."
Set-Location "backend"
Start-Process -FilePath "node" -ArgumentList "index.js" -RedirectStandardOutput "server.log" -RedirectStandardError "server-error.log" -WindowStyle Hidden
$SERVER_PID = $LASTEXITCODE

Write-Host "Waiting for server to be ready..."
$MAX_RETRIES = 30
$RETRY_COUNT = 0

do {
    if ($RETRY_COUNT -eq $MAX_RETRIES) {
        Write-Host "Server failed to start. Server logs:"
        Get-Content "server.log" -ErrorAction SilentlyContinue
        Get-Content "server-error.log" -ErrorAction SilentlyContinue
        exit 1
    }
    $RETRY_COUNT++
    Write-Host "Attempt $RETRY_COUNT/$MAX_RETRIES - Waiting for server..."
    Start-Sleep -Seconds 2
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/books" -Method GET -ErrorAction Stop
        $serverReady = $true
    } catch {
        $serverReady = $false
    }
} while (-not $serverReady)

Write-Host "Server is ready!"

Write-Host "Running API tests..."

# Create a test user
$registerBody = @{
    username = "testuser"
    password = "testpass123"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method POST -ContentType "application/json" -Body $registerBody
    Write-Host "Registration response: $($registerResponse | ConvertTo-Json)"
} catch {
    Write-Host "Registration failed: $($_.Exception.Message)"
    exit 1
}

# Login and get token
$loginBody = @{
    username = "testuser"
    password = "testpass123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
    Write-Host "Login response: $($loginResponse | ConvertTo-Json)"
    $token = $loginResponse.token
} catch {
    Write-Host "Login failed: $($_.Exception.Message)"
    exit 1
}

if (-not $token) {
    Write-Host "Failed to get auth token"
    exit 1
}

# Test book creation
$bookBody = @{
    title = "Test Book"
    author = "Test Author"
    published_year = 2024
} | ConvertTo-Json

try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $bookResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/books" -Method POST -Headers $headers -Body $bookBody
    Write-Host "Book creation response: $($bookResponse | ConvertTo-Json)"
    $bookId = $bookResponse.id
} catch {
    Write-Host "Book creation failed: $($_.Exception.Message)"
    exit 1
}

if (-not $bookId) {
    Write-Host "Failed to create book"
    exit 1
}

# Test book retrieval
try {
    $booksResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/books" -Method GET -Headers @{"Authorization" = "Bearer $token"}
    Write-Host "Books retrieval response: $($booksResponse | ConvertTo-Json)"
    $booksCount = $booksResponse.Count
} catch {
    Write-Host "Books retrieval failed: $($_.Exception.Message)"
    exit 1
}

if ($booksCount -ne 1) {
    Write-Host "Expected 1 book, got $booksCount"
    exit 1
}

Write-Host "All tests passed successfully!"

Write-Host "Cleaning up..."
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {$_.MainWindowTitle -eq ""} | Stop-Process -Force 