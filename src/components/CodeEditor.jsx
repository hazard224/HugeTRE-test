import { useRef } from 'react'
import Editor from 'react-simple-code-editor'
import Prism from 'prismjs'
import 'prismjs/components/prism-markup'
import 'prismjs/components/prism-css'
import 'prismjs/themes/prism.css'

/**
 * Code editor with HTML + CSS syntax highlighting and auto-indentation
 */
export default function CodeEditor({ value, onChange }) {
  const editorRef = useRef(null)

  /**
   * Handle Tab key to insert spaces instead of moving focus
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const textarea = e.target
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const spaces = '  ' // 2 spaces for indentation

      // Insert spaces at cursor position
      const newValue = value.substring(0, start) + spaces + value.substring(end)
      onChange(newValue)

      // Move cursor after the inserted spaces
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + spaces.length
      }, 0)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const textarea = e.target
      const start = textarea.selectionStart
      const lines = value.substring(0, start).split('\n')
      const currentLine = lines[lines.length - 1]
      
      // Get indentation of current line
      const indent = currentLine.match(/^\s*/)[0]
      
      // Check if current line ends with opening tag
      const endsWithOpenTag = currentLine.trim().match(/<(\w+)[^>]*>$/) && 
                              !currentLine.trim().match(/<\/\w+>$/) &&
                              !currentLine.trim().match(/<\w+[^>]*\/>$/)
      
      // Add extra indentation if line ends with opening tag
      const newIndent = endsWithOpenTag ? indent + '  ' : indent
      
      // Insert newline with proper indentation
      const newValue = value.substring(0, start) + '\n' + newIndent + value.substring(textarea.selectionEnd)
      onChange(newValue)

      // Move cursor after the indentation
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1 + newIndent.length
      }, 0)
    }
  }

  /**
   * Enhanced HTML highlighting that includes CSS inside style tags
   */
  const highlightWithCss = (code) => {
    // First highlight as HTML to get structure
    let highlighted = Prism.highlight(code, Prism.languages.markup, 'markup')
    
    // Find and enhance style tag contents with CSS highlighting
    const styleRegex = /(<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;<\/span>style<\/span><span class="token punctuation">&gt;<\/span><\/span>)([\s\S]*?)(<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;\/<\/span>style<\/span><span class="token punctuation">&gt;<\/span><\/span>)/gi
    
    highlighted = highlighted.replace(styleRegex, (match, openTag, cssContent, closeTag) => {
      // Decode HTML entities temporarily for CSS highlighting
      const decoded = cssContent
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
      
      // Highlight as CSS (strip existing span tags first if any)
      const stripped = decoded.replace(/<\/?span[^>]*>/g, '')
      const cssHighlighted = Prism.highlight(stripped, Prism.languages.css, 'css')
      
      // Re-encode for HTML
      const reencoded = cssHighlighted
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
      
      return openTag + reencoded + closeTag
    })
    
    return highlighted
  }

  return (
    <div className="code-editor-wrapper">
      <Editor
        ref={editorRef}
        value={value}
        onValueChange={onChange}
        onKeyDown={handleKeyDown}
        highlight={highlightWithCss}
        padding={10}
        style={{
          fontFamily: 'Arial, sans-serif',
          fontSize: 14,
          backgroundColor: '#ffffff',
          color: '#24292e',
          minHeight: '500px',
          borderRadius: '4px',
          border: '1px solid #d0d7de',
        }}
        textareaClassName="code-textarea"
      />
    </div>
  )
}
