Dim WshShell, dir
Set WshShell = CreateObject("WScript.Shell")
dir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
' Run PowerShell hidden, which runs npm run dev in the project directory
WshShell.Run "powershell -WindowStyle Hidden -NoProfile -Command ""Set-Location '" & dir & "'; $env:PATH = $env:PROGRAMFILES + '\nodejs;' + $env:PATH; npm run dev""", 0, False
