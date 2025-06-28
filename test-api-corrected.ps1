Write-Host "Starting server for API tests..."
Set-Location backend
Start-Process -FilePath "node" -ArgumentList "index.js" -RedirectStandardOutput "server.log" -RedirectStandardError "server-error.log" -WindowStyle Hidden
Start-Sleep -Seconds 2

Write-Host "Waiting for server to be ready..."
$MAX_RETRIES = 30
$RETRY_COUNT = 0
do {
    if ($RETRY_COUNT -eq $MAX_RETRIES) {
        Write-Host "Server failed to start. Server logs:"
        if (Test-Path "server.log") { Get-Content server.log }
        if (Test-Path "server-error.log") { Get-Content server-error.log }
        exit 1
    }
    $RETRY_COUNT++
    Write-Host "Attempt $RETRY_COUNT/$MAX_RETRIES - Waiting for server..."
    Start-Sleep -Seconds 2
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/books" -Method GET -ErrorAction Stop
        # If we get here, server is up and endpoint is public (not expected)
        break
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 401) {
            # 401 Unauthorized means server is up and endpoint is protected
            break
        }
        # Otherwise, keep waiting
    }
} while ($true)

Write-Host "Server is ready!"

Write-Host "Running API tests..."
# Generate unique username
$TIMESTAMP = Get-Date -Format "yyyyMMddHHmmss"
$USERNAME = "testuser$TIMESTAMP"

# Create a test user
$registerBody = @{
    username = $USERNAME
    password = "testpass123"
} | ConvertTo-Json

try {
    $REGISTER_RESPONSE = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method POST -Body $registerBody -ContentType "application/json"
    Write-Host "Registration response: $($REGISTER_RESPONSE | ConvertTo-Json)"
} catch {
    Write-Host "Registration failed: $($_.Exception.Message)"
    exit 1
}

# Login and get token
$loginBody = @{
    username = $USERNAME
    password = "testpass123"
} | ConvertTo-Json

try {
    $LOGIN_RESPONSE = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "Login response: $($LOGIN_RESPONSE | ConvertTo-Json)"
} catch {
    Write-Host "Login failed: $($_.Exception.Message)"
    exit 1
}

$TOKEN = $LOGIN_RESPONSE.token
if (-not $TOKEN) {
    Write-Host "Failed to get auth token"
    exit 1
}

Write-Host "Got token: $TOKEN"

# Test book creation
$bookBody = @{
    title = "Test Book"
    author = "Test Author"
    published_year = 2024
} | ConvertTo-Json

try {
    $BOOK_RESPONSE = Invoke-RestMethod -Uri "http://localhost:3000/api/books" -Method POST -Body $bookBody -ContentType "application/json" -Headers @{Authorization = "Bearer $TOKEN"}
    Write-Host "Book creation response: $($BOOK_RESPONSE | ConvertTo-Json)"
} catch {
    Write-Host "Book creation failed: $($_.Exception.Message)"
    exit 1
}

$BOOK_ID = $BOOK_RESPONSE.id
if (-not $BOOK_ID) {
    Write-Host "Failed to create book"
    exit 1
}

# Test book retrieval
try {
    $BOOKS_RESPONSE = Invoke-RestMethod -Uri "http://localhost:3000/api/books" -Method GET -Headers @{Authorization = "Bearer $TOKEN"}
    Write-Host "Books retrieval response: $($BOOKS_RESPONSE | ConvertTo-Json)"
} catch {
    Write-Host "Book retrieval failed: $($_.Exception.Message)"
    exit 1
}

$BOOKS_COUNT = $BOOKS_RESPONSE.Count
if ($BOOKS_COUNT -ne 1) {
    Write-Host "Expected 1 book, got $BOOKS_COUNT"
    exit 1
}

Write-Host "All tests passed successfully!"

Write-Host "Cleaning up..."
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $nodeProcesses | Stop-Process -Force
} 