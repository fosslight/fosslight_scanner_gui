// NVD 취약점 검색 URL 생성
// NVD가 검색 페이지를 SPA(#/nvd/home)로 개편하여 keyword 파라미터를 사용한다 (2026-07 실측).
// 링크를 렌더러에서 생성하므로 기존 리포트 파일도 항상 최신 형식으로 열린다.
export function nvdSearchUrl(name: string, version: string): string {
  if (!name) return ''
  // "npm:accepts" 같은 패키지 매니저 프리픽스는 검색어에서 제거
  let query = name.split(':').pop() ?? name
  if (version) query += ` ${version}`
  return `https://nvd.nist.gov/vuln/search#/nvd/home?keyword=${encodeURIComponent(query)}&resultType=records`
}
