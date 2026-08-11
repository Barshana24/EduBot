import { PrismLight } from 'react-syntax-highlighter'

import python from 'react-syntax-highlighter/dist/esm/languages/prism/python'
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript'
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript'
import java from 'react-syntax-highlighter/dist/esm/languages/prism/java'
import c from 'react-syntax-highlighter/dist/esm/languages/prism/c'
import cpp from 'react-syntax-highlighter/dist/esm/languages/prism/cpp'
import csharp from 'react-syntax-highlighter/dist/esm/languages/prism/csharp'
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql'
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash'
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json'
import verilog from 'react-syntax-highlighter/dist/esm/languages/prism/verilog'
import vhdl from 'react-syntax-highlighter/dist/esm/languages/prism/vhdl'
import matlab from 'react-syntax-highlighter/dist/esm/languages/prism/matlab'
import markup from 'react-syntax-highlighter/dist/esm/languages/prism/markup'

/**
 * The full Prism build ships every grammar it knows and costs ~900KB.
 * Registering the languages an engineering tutor actually emits keeps
 * the entry bundle an order of magnitude smaller.
 */
const LANGUAGES = {
  python, javascript, typescript, java, c, cpp, csharp,
  sql, bash, json, verilog, vhdl, matlab, markup,
  js: javascript, ts: typescript, py: python,
  'c++': cpp, 'c#': csharp, html: markup, xml: markup, shell: bash, sh: bash,
}

for (const [name, grammar] of Object.entries(LANGUAGES)) {
  PrismLight.registerLanguage(name, grammar)
}

/**
 * Prism theme built on CSS variables so code blocks follow the light and
 * dark themes instead of being a black rectangle in a bright app.
 */
export const codeTheme: Record<string, React.CSSProperties> = {
  'code[class*="language-"]': { color: 'var(--ink)', background: 'none' },
  'pre[class*="language-"]': { color: 'var(--ink)', background: 'none' },
  comment: { color: 'var(--ink-faint)', fontStyle: 'italic' },
  prolog: { color: 'var(--ink-faint)' },
  doctype: { color: 'var(--ink-faint)' },
  cdata: { color: 'var(--ink-faint)' },
  punctuation: { color: 'var(--ink-soft)' },
  property: { color: 'var(--sky-dark)' },
  tag: { color: 'var(--sky-dark)' },
  constant: { color: 'var(--sky-dark)' },
  symbol: { color: 'var(--sky-dark)' },
  boolean: { color: 'var(--coral-dark)' },
  number: { color: 'var(--coral-dark)' },
  selector: { color: 'var(--mint-dark)' },
  'attr-name': { color: 'var(--mint-dark)' },
  string: { color: 'var(--mint-dark)' },
  char: { color: 'var(--mint-dark)' },
  builtin: { color: 'var(--brand)' },
  inserted: { color: 'var(--mint-dark)' },
  operator: { color: 'var(--ink-soft)' },
  entity: { color: 'var(--sky-dark)' },
  url: { color: 'var(--sky-dark)' },
  atrule: { color: 'var(--brand)' },
  'attr-value': { color: 'var(--mint-dark)' },
  keyword: { color: 'var(--brand)', fontWeight: 700 },
  function: { color: 'var(--brand-dark)' },
  'class-name': { color: 'var(--sun-dark)' },
  regex: { color: 'var(--coral-dark)' },
  important: { color: 'var(--coral-dark)', fontWeight: 'bold' },
  variable: { color: 'var(--sun-dark)' },
  deleted: { color: 'var(--coral-dark)' },
}

export default PrismLight
