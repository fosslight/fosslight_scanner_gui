# FOSSLight Scanner GUI 설치 진단 스크립트 (electron-builder가 자동 포함)
# 1) 설치 중 파일 처리 내역을 기본으로 펼쳐 진행 여부를 확인할 수 있게 한다.
# 2) %LOCALAPPDATA%\fosslight-scanner-gui-install.log 에 설치 체크포인트를 기록한다.
# 3) Windows 경로 260자 제한을 초과할 설치 경로를 디렉터리 선택 단계에서 차단한다.
#    (내부 최장 상대 경로가 약 170자 — scancode 라이선스 데이터 파일명)

!include "LogicLib.nsh"
!include "FileFunc.nsh"

!define MAX_SAFE_INSTDIR_LEN 89

Var /GLOBAL LongPathWarned

!macro customHeader
  ShowInstDetails show
  ShowUninstDetails show
!macroend

Function WriteInstallLog
  Exch $R0
  Push $0
  Push $1
  Push $2
  Push $3
  Push $4
  Push $5
  Push $6
  Push $R1
  ${GetTime} "" "L" $0 $1 $2 $3 $4 $5 $6
  ClearErrors
  FileOpen $R1 "$LOCALAPPDATA\fosslight-scanner-gui-install.log" a
  ${IfNot} ${Errors}
    FileSeek $R1 0 END
    FileWrite $R1 "$2-$1-$0 $4:$5:$6 $R0$\r$\n"
    FileClose $R1
  ${EndIf}
  Pop $R1
  Pop $6
  Pop $5
  Pop $4
  Pop $3
  Pop $2
  Pop $1
  Pop $0
  Pop $R0
FunctionEnd

!macro customInit
  Push "===== 설치 시작: ${PRODUCT_NAME} v${VERSION} ====="
  Call WriteInstallLog
  ReadRegDWORD $0 HKLM "SYSTEM\CurrentControlSet\Control\FileSystem" "LongPathsEnabled"
  Push "LongPathsEnabled=$0, TEMP=$TEMP"
  Call WriteInstallLog
!macroend

# 설치 경로가 길면 CopyFiles가 260자 제한으로 실패하므로 선택 단계에서 차단
Function .onVerifyInstDir
  StrLen $0 "$INSTDIR"
  ${If} $0 > ${MAX_SAFE_INSTDIR_LEN}
    ${If} $LongPathWarned != "1"
      StrCpy $LongPathWarned "1"
      Push "설치 경로 길이 초과로 차단($0자): $INSTDIR"
      Call WriteInstallLog
      MessageBox MB_OK|MB_ICONEXCLAMATION "설치 경로가 너무 깁니다 ($0자).$\r$\n\
Windows 경로 길이 제한(260자)을 초과하여 설치가 실패할 수 있으므로$\r$\n\
${MAX_SAFE_INSTDIR_LEN}자 이하의 짧은 경로를 선택해주세요. (예: C:\FOSSLight)"
    ${EndIf}
    Abort
  ${EndIf}
FunctionEnd

# 파일 복사(압축 해제 → 설치 폴더 복사)가 끝난 직후 호출됨
!macro customInstall
  StrLen $0 "$INSTDIR"
  Push "파일 복사 완료. 설치 경로($0자): $INSTDIR"
  Call WriteInstallLog
!macroend

Function .onInstSuccess
  Push "설치 성공"
  Call WriteInstallLog
FunctionEnd

Function .onInstFailed
  Push "설치 실패 (파일 복사 실패 또는 사용자 취소 — 백신의 파일 잠금/경로 길이 확인 필요)"
  Call WriteInstallLog
FunctionEnd
