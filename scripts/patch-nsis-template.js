// electron-builder NSIS 템플릿 패치 (postinstall에서 실행)
//
// 1) SetDetailsPrint none → textonly : 프로그레스 바 위 상태 텍스트 활성화
//    (assisted 설치는 템플릿이 모든 상태 출력을 꺼버려 진행 표시가 없음)
// 2) extractUsing7za 매크로 교체 : TEMP 스테이징(해제 후 재복사) 대신 설치 폴더에
//    직접 해제 + 진행률(%) 표시. 43k개 파일을 두 번 쓰는 구조가 설치 시간의 병목
//    (파일 91%가 scancode 라이선스 데이터)이며, 스테이징의 "원자적 복사"는 설치
//    실패 시 재설치하면 되므로 실익이 없다. 템플릿 자체도 복사 실패 시 최후 수단으로
//    동일한 직접 해제를 사용한다.
const fs = require('fs')
const path = require('path')

const templatesDir = path.join(
  __dirname,
  '..',
  'node_modules',
  'app-builder-lib',
  'templates',
  'nsis'
)

function patchFile(file, replacements) {
  const filePath = path.join(templatesDir, file)
  let content = fs.readFileSync(filePath, 'utf8')
  for (const { from, to, count } of replacements) {
    if (content.includes(to)) continue // 이미 패치됨
    const found = content.split(from).length - 1
    if (found === 0) {
      throw new Error(`${file}: 패치 대상 문자열을 찾지 못했습니다: ${from}`)
    }
    if (count !== undefined && found !== count) {
      throw new Error(`${file}: "${from}" 발견 ${found}회 (기대 ${count}회) — 템플릿 변경 확인 필요`)
    }
    content = content.split(from).join(to)
  }
  fs.writeFileSync(filePath, content)
  console.log(`patched: ${file}`)
}

patchFile('installSection.nsh', [
  { from: '  SetDetailsPrint none', to: '  SetDetailsPrint textonly', count: 1 }
])

// extractUsing7za 매크로 전체를 직접 해제 버전으로 교체
const directExtractMacro = `!macro extractUsing7za FILE
  ; fosslight: TEMP 스테이징 없이 설치 폴더($OUTDIR)에 직접 해제
  ClearErrors
  Nsis7z::ExtractWithDetails "\${FILE}" "$(installing) %s"
!macroend`

const extractFile = path.join(templatesDir, 'include', 'extractAppPackage.nsh')
let extractContent = fs.readFileSync(extractFile, 'utf8')
if (!extractContent.includes('; fosslight:')) {
  const macroPattern = /!macro extractUsing7za FILE[\s\S]*?\n!macroend/
  if (!macroPattern.test(extractContent)) {
    throw new Error('extractAppPackage.nsh: extractUsing7za 매크로를 찾지 못했습니다 — 템플릿 변경 확인 필요')
  }
  extractContent = extractContent.replace(macroPattern, directExtractMacro)
  fs.writeFileSync(extractFile, extractContent)
  console.log('patched: include\\extractAppPackage.nsh (직접 해제)')
}

console.log('NSIS 템플릿 패치 완료')
