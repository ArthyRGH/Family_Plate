# Simple PowerShell HTTP Server
param (
    [int]$Port = 8000,
    [string]$Path = (Get-Location)
)

# Add the necessary assembly
Add-Type -AssemblyName System.Web

# Create a HTTP listener
$Listener = New-Object System.Net.HttpListener
$Listener.Prefixes.Add("http://localhost:$Port/")
$Listener.Start()

Write-Host "HTTP server listening on http://localhost:$Port/"
Write-Host "Serving files from $Path"
Write-Host "Press Ctrl+C to stop the server..."

try {
    while ($Listener.IsListening) {
        # Get a request
        $Context = $Listener.GetContext()
        $Request = $Context.Request
        $Response = $Context.Response

        # Get the requested URL and convert it to a file path
        $RequestedFile = $Request.Url.LocalPath.TrimStart('/')
        if ($RequestedFile -eq '') {
            $RequestedFile = 'index.html'
        }
        $FilePath = Join-Path -Path $Path -ChildPath $RequestedFile

        # Check if the file exists
        if (Test-Path -Path $FilePath -PathType Leaf) {
            # Get file content
            $Content = [System.IO.File]::ReadAllBytes($FilePath)
            
            # Set content type based on file extension
            $Extension = [System.IO.Path]::GetExtension($FilePath)
            switch ($Extension) {
                '.html' { $ContentType = 'text/html' }
                '.js'   { $ContentType = 'application/javascript' }
                '.css'  { $ContentType = 'text/css' }
                '.json' { $ContentType = 'application/json' }
                '.png'  { $ContentType = 'image/png' }
                '.jpg'  { $ContentType = 'image/jpeg' }
                '.gif'  { $ContentType = 'image/gif' }
                '.svg'  { $ContentType = 'image/svg+xml' }
                default { $ContentType = 'application/octet-stream' }
            }
            
            # Set response details
            $Response.ContentType = $ContentType
            $Response.ContentLength64 = $Content.Length
            $Response.StatusCode = 200
            
            # Write the response
            $Response.OutputStream.Write($Content, 0, $Content.Length)
        } else {
            # Return 404 if file not found
            $Response.StatusCode = 404
            $NotFoundMessage = "File not found: $RequestedFile"
            $NotFoundBytes = [System.Text.Encoding]::UTF8.GetBytes($NotFoundMessage)
            $Response.ContentType = 'text/plain'
            $Response.ContentLength64 = $NotFoundBytes.Length
            $Response.OutputStream.Write($NotFoundBytes, 0, $NotFoundBytes.Length)
        }
        
        # Close the response
        $Response.Close()
        
        # Write log
        Write-Host "$([datetime]::Now) - $($Request.HttpMethod) $($Request.Url.LocalPath) - $($Response.StatusCode)"
    }
} finally {
    # Stop the listener
    $Listener.Stop()
} 