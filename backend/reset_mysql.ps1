Write-Host "Stopping MySQL service..."
Stop-Service -Name MySQL80 -Force
Start-Sleep -Seconds 3

Write-Host "Creating password reset file..."
$resetFile = "C:\mysql-reset.txt"
"ALTER USER 'root'@'localhost' IDENTIFIED BY 'aquagrid123';" | Out-File -FilePath $resetFile -Encoding ASCII

Write-Host "Starting MySQL in safe mode to reset password..."
$mysqld = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe"
$defaults = "C:\ProgramData\MySQL\MySQL Server 8.0\my.ini"
$proc = Start-Process -FilePath $mysqld -ArgumentList "--defaults-file=`"$defaults`"", "--init-file=`"$resetFile`"" -PassThru -WindowStyle Hidden

Write-Host "Waiting 15 seconds for the password reset to complete..."
Start-Sleep -Seconds 15

Write-Host "Shutting down the safe mode process..."
Stop-Process -Id $proc.Id -Force
Start-Sleep -Seconds 5

Write-Host "Restarting the normal MySQL service..."
Start-Service -Name MySQL80

Write-Host "Cleaning up..."
Remove-Item $resetFile

Write-Host "Done! The MySQL root password is now: aquagrid123"
