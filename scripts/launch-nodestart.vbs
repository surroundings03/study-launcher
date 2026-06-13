Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
projectDir = fso.GetParentFolderName(scriptDir)
shell.CurrentDirectory = projectDir
shell.Run "cmd.exe /c ""set PATH=C:\Program Files\nodejs;%PATH%&& ""C:\Program Files\nodejs\npm.cmd"" start""", 0, False
