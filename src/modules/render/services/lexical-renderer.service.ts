import { Injectable } from '@nestjs/common'
import { createHeadlessEditor } from '@lexical/headless'
import { $generateHtmlFromNodes } from '@lexical/html'
import type { SerializedEditorState } from 'lexical'
import sanitizeHtml from 'sanitize-html'
import { DomEnv } from '../providers/dom-env.provider'
import { serverNodes as nodes } from '../lexical/nodes'
import { editorTheme } from '../lexical/theme'

@Injectable()
export class LexicalRendererService {
  constructor(private readonly dom: DomEnv) {}

  toHtml(serialized: SerializedEditorState | string) {
    const editor = createHeadlessEditor({ namespace: 'Renderer', nodes, theme: editorTheme })
    const str = typeof serialized === 'string' ? serialized : JSON.stringify(serialized)
    const state = editor.parseEditorState(str)

    let html = ''
    editor.setEditorState(state)
    state.read(() => {
      html = $generateHtmlFromNodes(editor)
    })
    html = this.handleCodeBlocks(html)

    return sanitizeHtml(html, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat([
        'img',
        'table',
        'thead',
        'tbody',
        'tr',
        'th',
        'td',
        'pre',
        'code',
      ]),
      allowedAttributes: {
        a: ['href', 'name', 'target', 'rel'],
        img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
        code: ['class', 'data-gutter', 'data-highlight-language', 'data-language', 'spellcheck'],
        pre: ['class', 'spellcheck', 'data-language', 'data-gutter', 'data-highlight-language'],
        '*': ['style', 'class', 'data-*'],
      },
      allowedStyles: {
        '*': {
          color: [
            /^#[0-9a-fA-F]{3,8}$/,
            /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/i,
            /^rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*(0|1|0?\.\d+)\s*\)$/i,
          ],
          'background-color': [
            /^#[0-9a-fA-F]{3,8}$/,
            /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/i,
            /^rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*(0|1|0?\.\d+)\s*\)$/i,
          ],
          'text-align': [/^left$|^right$|^center$|^justify$/],
        },
      },
      transformTags: {
        a: (tagName, attribs) => ({
          tagName: 'a',
          attribs: { ...attribs, rel: 'noopener noreferrer' },
        }),
      },
    })
  }

  private handleCodeBlocks(rawHtml: string): string {
    const doc = globalThis.document as Document | undefined
    if (!doc) return rawHtml

    const container = doc.createElement('div')
    container.innerHTML = rawHtml

    container.querySelectorAll('pre').forEach(pre => {
      if (!pre.classList.contains('EditorTheme__code')) {
        pre.classList.add('EditorTheme__code')
      }

      const preClass = pre.getAttribute('class') || ''
      const matchLangClass = preClass.match(/language-([\w-]+)/i)
      const langFromPre = pre.getAttribute('data-language')
      const lang = (
        langFromPre ||
        (matchLangClass ? matchLangClass[1] : '') ||
        'plaintext'
      ).toLowerCase()

      const brCount = pre.querySelectorAll('br').length
      let lineCount = brCount + 1
      if (lineCount <= 1) {
        const text = pre.textContent || ''
        lineCount = Math.max(1, text.split('\n').length)
      }
      const gutter = Array.from({ length: lineCount }, (_, i) => String(i + 1)).join('\n')

      pre.setAttribute('data-language', lang)
      pre.setAttribute('data-highlight-language', lang)
      pre.setAttribute('data-gutter', gutter)
      pre.setAttribute('spellcheck', 'false')

      const code = pre.querySelector('code')
      if (code) {
        code.setAttribute('data-language', lang)
        code.setAttribute('data-highlight-language', lang)
        code.setAttribute('spellcheck', 'false')
        code.classList.add(`language-${lang}`)
      }
    })

    return container.innerHTML
  }
}
