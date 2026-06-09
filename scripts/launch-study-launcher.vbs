Set shell = CreateObject("WScript.Shell")
shell.CurrentDirectory = "C:\Users\lin\Documents\study-launcher"
shell.Run "cmd.exe /c ""set PATH=C:\Program Files\nodejs;%PATH%&& ""C:\Program Files\nodejs\npm.cmd"" start""", 0, False
