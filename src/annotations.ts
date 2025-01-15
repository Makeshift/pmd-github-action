import * as core from '@actions/core'
import parser from 'fast-xml-parser'
import fs from 'fs'
import * as path from 'path'
import { chain, map } from 'ramda'
import decode from 'unescape'
import { Annotation, AnnotationLevel } from './github'
import {
  Duplication,
  File,
  isPMDCPDReportType,
  isPMDReportType,
  PMDReportType
} from './pmd'

const XML_PARSE_OPTIONS = {
  allowBooleanAttributes: true,
  ignoreAttributes: false,
  attributeNamePrefix: ''
}

function asArray<T>(arg: T[] | T | undefined): T[] {
  return !arg ? [] : Array.isArray(arg) ? arg : [arg]
}

function getWarningLevel(arg: string | number): AnnotationLevel {
  switch (arg) {
    case '1':
      return AnnotationLevel.failure
    case '2':
    case '3':
      return AnnotationLevel.warning
    default:
      return AnnotationLevel.notice
  }
}

export function annotationsForPath(resultFile: string): Annotation[] {
  core.info(`Creating annotations for ${resultFile}`)
  const root: string = process.env['GITHUB_WORKSPACE'] || ''

  const result: PMDReportType = parser.parse(
    fs.readFileSync(resultFile, 'UTF-8' as BufferEncoding),
    XML_PARSE_OPTIONS
  )

  if (isPMDReportType(result)) {
    return chain(file => {
      return map(violation => {
        const annotation: Annotation = {
          annotation_level: getWarningLevel(violation.priority),
          path: path.relative(root, file.name),
          start_line: Number(violation.beginline || 1),
          end_line: Number(violation.endline || violation.beginline || 1),
          title: `${violation.ruleset} ${violation.rule}`,
          message: decode(violation['#text'])
        }

        return annotation
      }, asArray(file.violation))
    }, asArray<File>(result.pmd?.file))
  } else if (isPMDCPDReportType(result)) {
    return chain(duplication => {
      return map(file => {
        const dupeList = duplication.file
          .map(f => {
            return `- \`${f.path}\`:${f.line}`
          })
          .join('\n')

        const annotation: Annotation = {
          annotation_level: AnnotationLevel.failure,
          path: path.relative(root, file.path),
          start_line: Number(file.line),
          end_line: Number(file.line) + Number(duplication.lines),
          title: 'Duplicate code found',
          message: `This code block was found duplicated in:
${dupeList}
\`\`\`ts
${file.codefragment}
\`\`\
`
        }

        return annotation
      }, asArray(duplication.file))
    }, asArray<Duplication>(result['pmd-cpd']?.duplication))
  }

  return []
}
