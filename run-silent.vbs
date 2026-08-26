Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)

Set processEnv = WshShell.Environment("PROCESS")
processEnv("PORT") = "4000"
processEnv("NODE_ENV") = "production"

WshShell.CurrentDirectory = scriptDir
WshShell.Run "cmd /c node dist\server.cjs", 0, False
