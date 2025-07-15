# Check if required Docker containers are running
$requiredContainers = @(
    'margincall-postgres',
    'margincall-backend',
    'margincall-python-service',
    'margincall-python-validation'
)

Write-Host "Checking Docker containers..."
$runningContainers = docker ps --format '{{.Names}}'
foreach ($container in $requiredContainers) {
    if ($runningContainers -notcontains $container) {
        Write-Host "[ERROR] Required container '$container' is not running. Please start all services with 'docker-compose up -d' before running this script." -ForegroundColor Red
        exit 1
    }
}
Write-Host "All required containers are running." -ForegroundColor Green

# API base URL
$apiUrl = "http://localhost:3000"

# Generate random user details
$rand = Get-Random -Minimum 1000 -Maximum 9999
$userEmail = "testuser$rand@margincall.local"
$userPassword = "TestPassword123!"
$userFirstName = "Test"
$userLastName = "User$rand"

Write-Host "Registering new user..."
$userRegBody = @{ email = $userEmail; password = $userPassword; firstName = $userFirstName; lastName = $userLastName } | ConvertTo-Json
$userRegResp = Invoke-RestMethod -Uri "$apiUrl/auth/register" -Method Post -Body $userRegBody -ContentType 'application/json'

Write-Host "User registration response:"
$userRegResp | ConvertTo-Json -Depth 5 | Write-Host

# Log user details for later use
Write-Host "--- USER DETAILS ---"
Write-Host "Email: $userEmail"
Write-Host "Password: $userPassword"
Write-Host "First Name: $userFirstName"
Write-Host "Last Name: $userLastName"
Write-Host "---------------------"

# Extract JWT token
$jwt = $userRegResp.access_token
if (-not $jwt) {
    Write-Host "[ERROR] No JWT token received. Exiting." -ForegroundColor Red
    exit 1
}

# Create a company for the user
$companyBody = @{ 
    ticker = "AAPL"; 
    name = "Apple Inc."; 
    metricsToTrack = @("regularMarketPrice", "totalCash", "currentRatio") 
} | ConvertTo-Json

Write-Host "Creating company for user..."
$companyResp = Invoke-RestMethod -Uri "$apiUrl/companies" -Method Post -Body $companyBody -ContentType 'application/json' -Headers @{ Authorization = "Bearer $jwt" }

Write-Host "Company creation response:"
$companyResp | ConvertTo-Json -Depth 5 | Write-Host

Write-Host "Script completed successfully." -ForegroundColor Green 