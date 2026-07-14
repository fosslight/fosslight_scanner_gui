// electron-builder NSIS 템플릿 패치 (postinstall에서 실행)
//
// assisted 설치는 템플릿이 SetDetailsPrint none으로 모든 상태 출력을 꺼버려서,
// 가장 오래 걸리는 압축 해제/복사 단계(수만 개 파일, 백신 검사로 수 분 소요)에
// 진행 표시가 전혀 없어 멈춘 것으로 오인된다.
// 1) SetDetailsPrint none → textonly : 프로그레스 바 위 상태 텍스트 활성화
// 2) Nsis7z::Extract → ExtractWithDetails : 압축 해제 진행률(%)을 상태 텍스트에 표시
// 3) CopyFiles 직전 DetailPrint : 복사 단계 진입을 상태 텍스트에 표시
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

patchFile(path.join('include', 'extractAppPackage.nsh'), [
  {
    from: 'Nsis7z::Extract "${FILE}"',
    to: 'Nsis7z::ExtractWithDetails "${FILE}" "$(installing) %s"',
    count: 2
  },
  {
    from: '    CopyFiles /SILENT "$PLUGINSDIR\\7z-out\\*" $OUTDIR',
    to: '    DetailPrint "$(installing)"\n    CopyFiles /SILENT "$PLUGINSDIR\\7z-out\\*" $OUTDIR',
    count: 1
  }
])

console.log('NSIS 템플릿 패치 완료')
