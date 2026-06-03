Dim WshShell, fso, dir, nodePath, cmd
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
dir = fso.GetParentFolderName(WScript.ScriptFullName)

' Try to find node.exe on common paths
Dim tries(3)
tries(0) = WshShell.ExpandEnvironmentStrings("%ProgramFiles%\nodejs\node.exe")
tries(1) = WshShell.ExpandEnvironmentStrings("%ProgramFiles(x86)%\nodejs\node.exe")
tries(2) = WshShell.ExpandEnvironmentStrings("%APPDATA%\nvm\current\node.exe")
tries(3) = "node.exe"   ' fallback: rely on PATH

nodePath = "node.exe"
Dim i
For i = 0 To 2
  If fso.FileExists(tries(i)) Then
    nodePath = tries(i)
    Exit For
  End If
Next

' WindowStyle 0 = hidden; bWaitOnReturn False = fire and forget
WshShell.Run """" & nodePath & """ """ & dir & "\launch.js""", 0, False
