export function isPMDReportType(arg: PMDReportType): arg is PMDReport {
  return 'pmd' in arg
}

export function isPMDCPDReportType(arg: PMDReportType): arg is PMDCPDReport {
  return 'pmd-cpd' in arg
}

export interface PMDCPDReport {
  'pmd-cpd'?: {
    duplication: Duplication[]
  }
}

export interface Duplication {
  codefragment: string
  lines: string
  file: DuplicationFile[]
}

export interface DuplicationFile {
  codefragment: string
  line: string
  path: string
}

export type PMDReportType = PMDReport | PMDCPDReport

export interface PMDReport {
  pmd?: PMD
}

export interface PMD {
  file: File[] | File | undefined
}

export interface File {
  name: string
  violation: Violation[] | Violation | undefined
}

export interface Violation {
  beginline: string
  endline: string
  begincolumn: string
  endcolumn: string
  rule: string
  ruleset: string
  package: string
  class: string
  externalInfoUrl: string
  priority: string
  '#text': string
}
