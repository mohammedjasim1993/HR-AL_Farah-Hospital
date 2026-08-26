; =====================================================================
; ZKTeco 9500 Biometric Agent & Driver Unified Installer Script (.iss)
; =====================================================================
; هذا السكريبت مخصص لبرنامج Inno Setup المجاني لإنتاج ملف تنصيبي واحد (.exe)
; يقوم بتثبيت تعريفات البصمة ZK9500 والوكيل المحلي وتشغيله تلقائياً مع إقلاع النظام.

[Setup]
AppId={{D37F8E80-4D2A-4B6A-9DE0-56FF03236DB4}
AppName=ZKTeco 9500 Biometric Agent and Drivers
AppVersion=1.0.0
AppPublisher=Laboratory Biometric Security
DefaultDirName={pf}\ZKTeco_Biometric_Agent
DefaultGroupName=ZKTeco Biometric Agent
DisableProgramGroupPage=yes
OutputDir=.
OutputBaseFilename=ZKTeco_9500_Full_Setup
Compression=lzma
SolidCompression=yes
PrivilegesRequired=admin
ArchitecturesInstallIn64BitMode=x64
SetupIconFile=compiler:Default.ico
UsePreviousAppDir=yes
DirExistsWarning=no

[Languages]
Name: "arabic"; MessagesFile: "compiler:Languages\Arabic.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Dirs]
Name: "{app}\drivers"

[Files]
; 1. ملفات الخدمة أو الوكيل المحلي (WebSocket Agent)
Source: "node.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "ZKTecoLocalAgent.vbs"; DestDir: "{app}"; Flags: ignoreversion
Source: "zkfpkeep.dll"; DestDir: "{app}"; Flags: ignoreversion
Source: "libzkfp.dll"; DestDir: "{app}"; Flags: ignoreversion
Source: "server.js"; DestDir: "{app}"; Flags: ignoreversion
Source: "package.json"; DestDir: "{app}"; Flags: ignoreversion
Source: "node_modules\*"; DestDir: "{app}\node_modules"; Flags: recursesubdirs createallsubdirs ignoreversion

; 2. حزمة ملفات تعاريف جهاز البصمة ZK9500 / SLK20R لتثبيتها صامتاً (64-بت فقط)
Source: "drivers\ZK9500_Driver_x64.exe"; DestDir: "{app}\drivers"; Flags: ignoreversion

[Icons]
Name: "{group}\ZKTeco Biometric Agent"; Filename: "{app}\ZKTecoLocalAgent.vbs"; IconFilename: "{app}\node.exe"
; تشغيل تلقائي مع بدء الويندوز لجميع المستخدمين
Name: "{commonstartup}\ZKTeco Biometric Agent"; Filename: "{app}\ZKTecoLocalAgent.vbs"; WorkingDir: "{app}"; IconFilename: "{app}\node.exe"

[Run]
; تشغيل الخدمة فوراً بعد انتهاء التنصيب بشكل صامت تماماً في الخلفية
Filename: "wscript.exe"; Parameters: """{app}\ZKTecoLocalAgent.vbs"""; Description: "تشغيل وكيل البصمة الذكي الآن (ZKTeco Biometric Agent)"; Flags: nowait postinstall skipifsilent

; تشغيل معالج تثبيت التعريفات فقط إذا كانت حقيقية (وليست وهمية/عطلانة) لتفادي خطأ Windows "This app can't run on your PC"
Filename: "{app}\drivers\ZK9500_Driver_x64.exe"; Description: "تثبيت تعريفات جهاز البصمة ZK9500 لنظام (64 بت)"; Flags: postinstall skipifsilent; Check: Is64BitDriverReal

[UninstallRun]
; إيقاف تشغيل البرنامج الذكي عند إلغاء التثبيت دون التأثير على أي عمليات node أخرى
Filename: "powershell.exe"; Parameters: "-WindowStyle Hidden -Command ""Get-Process node -ErrorAction SilentlyContinue | Where-Object {{$_.CommandLine -like '*server.js*'}} | Stop-Process -Force"""; RunOnceId: "StopAgent"; Flags: runhidden

[Code]
function GetLocalFileSize(const Path: String): Int64;
var
  FindRec: TFindRec;
begin
  Result := 0;
  if FindFirst(Path, FindRec) then
  begin
    try
      Result := FindRec.SizeLow;
    finally
      FindClose(FindRec);
    end;
  end;
end;

function Is64BitDriverReal(): Boolean;
begin
  Result := False;
  if Is64BitInstallMode then
  begin
    if GetLocalFileSize(ExpandConstant('{app}\drivers\ZK9500_Driver_x64.exe')) > 1048576 then
      Result := True;
  end;
end;

procedure CurStepChanged(CurStep: TSetupStep);
var
  IsDriverReal: Boolean;
begin
  if CurStep = ssPostInstall then
  begin
    IsDriverReal := False;
    if Is64BitInstallMode then
    begin
      if GetLocalFileSize(ExpandConstant('{app}\drivers\ZK9500_Driver_x64.exe')) > 1048576 then
        IsDriverReal := True;
    end;

    if not IsDriverReal then
    begin
      MsgBox('⚠️ [تنبيه هام] لم يتم تثبيت تعريفات البصمة تلقائياً لأن حزمة التثبيت لا تحتوي على ملفات التعريف الحقيقية.' + #13#10 +
             'يرجى تنزيل وتثبيت تعريف جهاز ZK9500 يدوياً لكي تعمل البصمة بنجاح.' + #13#10#13#10 +
             '⚠️ [Important Note] Fingerprint drivers were not installed because the real driver binaries are missing from this package.' + #13#10 +
             'Please download and install the ZK9500 driver manually to ensure the device operates correctly.', mbInformation, MB_OK);
    end;
  end;
end;
