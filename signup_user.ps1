$Url = "https://txbbyemgtitvltdvewzo.supabase.co/auth/v1/signup"
$AnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4YmJ5ZW1ndGl0dmx0ZHZld3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2ODk2MzQsImV4cCI6MjA4NTI2NTYzNH0.HSRFTW8PssND3T91VXywvSPgUPEc_VC7TbZwUAsuauk"
$Body = @{
    email = "alexandregmari@gmail.com"
    password = "Password123!"
    data = @{
        full_name = "Alexandre Mari"
    }
} | ConvertTo-Json

try {
    $Response = Invoke-RestMethod -Uri $Url -Method Post -Headers @{ "apikey" = $AnonKey; "Content-Type" = "application/json" } -Body $Body
    Write-Output "SUCCESS: $($Response.id)"
    # Also output full object to see if user is embedded or top level
    $Response | ConvertTo-Json -Depth 5
} catch {
    Write-Output "ERROR: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $Stream = $_.Exception.Response.GetResponseStream()
        $Reader = New-Object System.IO.StreamReader($Stream)
        $Reader.ReadToEnd()
    }
}
