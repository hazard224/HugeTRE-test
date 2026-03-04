import { useRef, useState, useEffect, useCallback } from 'react'
import { Editor } from '@hugerte/hugerte-react'
import CodeEditor from './CodeEditor'
import './RichTextEditor.css'

export default function RichTextEditor({ value = '', onChange, backgroundColor = '#ffffff', onBackgroundColorChange }) {
  const [view, setView] = useState('wysiwyg') // 'wysiwyg', 'code'
  const [content, setContent] = useState('')
  const editorRef = useRef(null)
  const viewButtonsRef = useRef({ wysiwyg: null, code: null })
  const initialValueLoaded = useRef(false)
  const onChangeTimeoutRef = useRef(null)
  const backgroundColorRef = useRef(backgroundColor)
  const handleFormatCodeRef = useRef(null)
  const handleViewChangeRef = useRef(null)
  const noTbodyTableFingerprintsRef = useRef(new Set())

  // Update editor background color dynamically
  useEffect(() => {
    backgroundColorRef.current = backgroundColor
    if (editorRef.current && view === 'wysiwyg') {
      const iframeBody = editorRef.current.getBody()
      if (iframeBody) {
        iframeBody.style.backgroundColor = backgroundColor
      }
    }
  }, [backgroundColor, view])

  // Update view button states when view changes
  useEffect(() => {
    if (viewButtonsRef.current) {
      Object.keys(viewButtonsRef.current).forEach(key => {
        const buttonApi = viewButtonsRef.current[key]
        if (buttonApi) {
          buttonApi.setActive(key === view)
        }
      })
    }
  }, [view])

  // Load initial value only once on mount
  useEffect(() => {
    if (!initialValueLoaded.current) {
      setContent(value)
      initialValueLoaded.current = true
    }
  }, [value])

  // Debounced onChange to parent — stable reference via useCallback
  const debouncedOnChange = useCallback((newContent) => {
    if (onChangeTimeoutRef.current) {
      clearTimeout(onChangeTimeoutRef.current)
    }
    onChangeTimeoutRef.current = setTimeout(() => {
      onChange(newContent)
    }, 150)
  }, [onChange])

  const getTableFingerprint = useCallback((tableHtml = '') => {
    if (typeof document === 'undefined') {
      return ''
    }

    const container = document.createElement('div')
    container.innerHTML = tableHtml
    const table = container.querySelector('table')
    if (!table) {
      return ''
    }

    const normalizedTable = table.outerHTML
      .replace(/<tbody\b[^>]*>/gi, '')
      .replace(/<\/tbody>/gi, '')
      .replace(/\s+/g, ' ')
      .replace(/>\s+</g, '><')
      .trim()
      .toLowerCase()

    return normalizedTable
  }, [])

  const trackNoTbodyTablesFromSourceHtml = useCallback((html = '') => {
    const sourceTables = html.match(/<table\b[^>]*>[\s\S]*?<\/table>/gi) || []
    sourceTables.forEach((tableHtml) => {
      if (/<tbody\b/i.test(tableHtml)) {
        return
      }

      const fingerprint = getTableFingerprint(tableHtml)
      if (fingerprint) {
        noTbodyTableFingerprintsRef.current.add(fingerprint)
      }
    })
  }, [getTableFingerprint])

  // Normalize legacy/deprecated HTML tags and structure:
  //  1. Convert <s>/<del> → <strike>
  //  2. Convert line-through styled spans → <strike>
  //  3. Remove browser-injected <tbody> from tables that were pasted without one
  //  4. Unwrap auto-inserted <p> wrappers around inline-only content
  const normalizeHtml = useCallback((html = '') => {
    let normalized = html
      // Strike tag normalization
      .replace(/<\s*(s|del)\b([^>]*)>/gi, '<strike$2>')
      .replace(/<\/\s*(s|del)\s*>/gi, '</strike>')
      .replace(/<span\b([^>]*)style=(['"])([^'"]*)\2([^>]*)>([\s\S]*?)<\/span>/gi, (match, beforeStyle, quote, styleValue, afterStyle, innerHtml) => {
        if (!/text-decoration\s*:\s*line-through/i.test(styleValue)) {
          return match
        }
        return `<strike>${innerHtml}</strike>`
      })

    // Remove browser-injected <tbody> from tables originally pasted without one
    if (typeof document !== 'undefined') {
      const container = document.createElement('div')
      container.innerHTML = normalized

      const tables = container.querySelectorAll('table')
      tables.forEach((table) => {
        const fingerprint = getTableFingerprint(table.outerHTML)
        if (!fingerprint || !noTbodyTableFingerprintsRef.current.has(fingerprint)) {
          return
        }

        const tbodies = Array.from(table.children).filter((child) => child.tagName === 'TBODY')
        tbodies.forEach((tbody) => {
          while (tbody.firstChild) {
            table.insertBefore(tbody.firstChild, tbody)
          }
          table.removeChild(tbody)
        })
      })

      normalized = container.innerHTML
    }

    // Unwrap auto-inserted <p> tags around inline-only content
    return normalized.replace(/<p>\s*([\s\S]*?)\s*<\/p>/gi, (match, innerHtml) => {
      const hasBlockContent = /<\/?(address|article|aside|blockquote|center|details|dialog|div|dl|fieldset|figcaption|figure|footer|form|h[1-6]|header|hr|main|menu|nav|ol|p|pre|section|table|ul|li|tr|td|th)\b/i.test(innerHtml)
      return hasBlockContent ? match : innerHtml
    })
  }, [getTableFingerprint])

  // Handle editor content change
  const handleEditorChange = (newContent) => {
    // Only process HugeRTE changes when in WYSIWYG view
    if (view === 'wysiwyg') {
      const normalizedContent = normalizeHtml(newContent)
      setContent(normalizedContent)
      debouncedOnChange(normalizedContent)
    }
  }

  // Handle code editor change
  const handleCodeChange = (code) => {
    trackNoTbodyTablesFromSourceHtml(code)
    const normalizedContent = normalizeHtml(code)
    setContent(normalizedContent)
    debouncedOnChange(normalizedContent)
  }

  // Format HTML with proper indentation
  const handleFormatCode = () => {
    // Get the current content from the editor if in WYSIWYG mode
    const currentContent = view === 'wysiwyg' && editorRef.current 
      ? editorRef.current.getContent() 
      : content
    
    const formatted = formatHtml(currentContent)
    setContent(formatted)
    if (editorRef.current) {
      editorRef.current.setContent(formatted)
    }
  }

  // Handle view changes
  const handleViewChange = (newView) => {
    // Save current content before switching views
    if (view === 'wysiwyg' && editorRef.current) {
      setContent(normalizeHtml(editorRef.current.getContent()))
    } else if (newView === 'wysiwyg' && editorRef.current) {
      // When switching TO wysiwyg, update TinyMCE with code editor content
      trackNoTbodyTablesFromSourceHtml(content)
      const normalizedContent = normalizeHtml(content)
      setContent(normalizedContent)
      editorRef.current.setContent(normalizedContent)
    }
    setView(newView)
  }

  // Simple HTML formatter
  const formatHtml = (html) => {
    let formatted = ''
    let indent = 0
    const tab = '  '
    
    // Remove existing indentation and line breaks around tags
    html = html.replace(/>\s+</g, '><').trim()
    
    // Split by tags
    const tokens = html.split(/(<[^>]+>)/g).filter(token => token.length > 0)
    
    tokens.forEach(token => {
      if (token.match(/^<\/\w/)) {
        // Closing tag
        indent = Math.max(0, indent - 1)
        formatted += tab.repeat(indent) + token + '\n'
      } else if (token.match(/^<\w[^>]*[^/]>$/)) {
        // Opening tag — skip indent increment for void elements
        const tagName = token.match(/^<(\w+)/)?.[1]?.toLowerCase()
        const voidElements = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'])
        formatted += tab.repeat(indent) + token + '\n'
        if (!voidElements.has(tagName)) indent++
      } else if (token.match(/^<\w[^>]*\/>$/)) {
        // Self-closing tag
        formatted += tab.repeat(indent) + token + '\n'
      } else if (token.trim().length > 0) {
        // Text content
        formatted += tab.repeat(indent) + token.trim() + '\n'
      }
    })
    
    return formatted.trim()
  }

  // Keep handler refs current to avoid stale closures in HugeRTE setup callbacks
  useEffect(() => {
    handleFormatCodeRef.current = handleFormatCode
    handleViewChangeRef.current = handleViewChange
  })

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (onChangeTimeoutRef.current) {
        clearTimeout(onChangeTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="rich-text-editor">
      <div className={`editor-container ${view !== 'wysiwyg' ? 'toolbar-only' : ''}`}>
        <Editor
            tinymceScriptSrc="/TinyMCE-test/hugerte/hugerte.min.js"
            value={content}
            onEditorChange={handleEditorChange}
            init={{
              max_height: 550,
              min_height: 300,
              menubar: false,
              statusbar: false,
              toolbar: 'undo redo formatCode | bold italic underline strikethrough | fontfamily fontsize | textcolor texthighlight framebackcolor | alignleft aligncenter alignright | bullist numlist | table | viewWysiwyg viewCode',
              toolbar_mode: 'sliding',
              toolbar_sticky: false,
              forced_root_block: false,
              setup: (editor) => {
                editorRef.current = editor

                // Register Font Awesome icons for custom buttons
                editor.ui.registry.addIcon('fa-font', '<svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M349.1 114.7C343.9 103.3 332.5 96 320 96C307.5 96 296.1 103.3 290.9 114.7L123.5 480L112 480C94.3 480 80 494.3 80 512C80 529.7 94.3 544 112 544L200 544C217.7 544 232 529.7 232 512C232 494.3 217.7 480 200 480L193.9 480L215.9 432L424.2 432L446.2 480L440.1 480C422.4 480 408.1 494.3 408.1 512C408.1 529.7 422.4 544 440.1 544L528.1 544C545.8 544 560.1 529.7 560.1 512C560.1 494.3 545.8 480 528.1 480L516.6 480L349.2 114.7zM394.8 368L245.2 368L320 204.8L394.8 368z"/></svg>')
                editor.ui.registry.addIcon('fa-marker', '<svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M347 379L505.4 163.9L476.1 134.6L261 293L347 379zM160 384L160 384L160 312.3C160 297 167.2 282.7 179.5 273.7L452.6 72.4C460 66.9 469 64 478.2 64C489.6 64 500.5 68.5 508.6 76.6L563.4 131.4C571.5 139.5 576 150.4 576 161.9C576 171.1 573.1 180.1 567.6 187.5L366.4 460.5C357.4 472.8 343 480 327.8 480L256.1 480L230.7 505.4C218.2 517.9 197.9 517.9 185.4 505.4L134.7 454.7C122.2 442.2 122.2 421.9 134.7 409.4L160 384zM39 530.3L90.7 478.6L161.3 549.2L141.6 568.9C137.1 573.4 131 575.9 124.6 575.9L56 576C42.7 576 32 565.3 32 552L32 547.3C32 540.9 34.5 534.8 39 530.3z"/></svg>')
                editor.ui.registry.addIcon('fa-fill-drip', '<svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M341.7 135.6L277.3 200L310.7 233.4C323.2 245.9 323.2 266.2 310.7 278.7C298.2 291.2 277.9 291.2 265.4 278.7L232 245.3L135.6 341.7C132.7 344.6 130.5 348.2 129.3 352L450.8 352L504.5 298.3C509.4 293.4 512.1 286.8 512.1 280C512.1 273.2 509.4 266.5 504.5 261.7L378.3 135.6C373.5 130.7 366.9 128 360 128C353.1 128 346.5 130.7 341.7 135.6zM90.3 296.4L186.7 200L137.3 150.6C124.8 138.1 124.8 117.8 137.3 105.3C149.8 92.8 170.1 92.8 182.6 105.3L232 154.7L296.4 90.3C313.3 73.5 336.1 64 360 64C383.9 64 406.7 73.5 423.6 90.3L549.7 216.4C566.5 233.3 576 256.1 576 280C576 303.9 566.5 326.7 549.7 343.6L343.6 549.7C326.7 566.5 303.9 576 280 576C256.1 576 233.3 566.5 216.4 549.7L90.3 423.6C73.5 406.7 64 383.9 64 360C64 336.1 73.5 313.3 90.3 296.4zM544 608C508.7 608 480 579.3 480 544C480 518.8 512.6 464.4 531.2 435.3C537.2 425.9 550.7 425.9 556.7 435.3C575.4 464.4 607.9 518.8 607.9 544C607.9 579.3 579.2 608 543.9 608z"/></svg>')
                editor.ui.registry.addIcon('fa-pen-to-square', '<svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M471.6 21.7c-21.9-21.9-57.3-21.9-79.2 0L368 46.1 465.9 144 490.3 119.6c21.9-21.9 21.9-57.3 0-79.2L471.6 21.7zm-299.2 220c-6.1 6.1-10.8 13.6-13.5 21.9l-29.6 88.8c-2.9 8.6-.6 18.1 5.8 24.6s15.9 8.7 24.6 5.8l88.8-29.6c8.2-2.7 15.7-7.4 21.9-13.5L432 177.9 334.1 80 172.4 241.7zM96 64C43 64 0 107 0 160L0 416c0 53 43 96 96 96l256 0c53 0 96-43 96-96l0-96c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 96c0 17.7-14.3 32-32 32L96 448c-17.7 0-32-14.3-32-32l0-256c0-17.7 14.3-32 32-32l96 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L96 64z"/></svg>')
                editor.ui.registry.addIcon('fa-code', '<svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M360.8 1.2c-17-4.9-34.7 5-39.6 22l-128 448c-4.9 17 5 34.7 22 39.6s34.7-5 39.6-22l128-448c4.9-17-5-34.7-22-39.6zm64.6 136.1c-12.5 12.5-12.5 32.8 0 45.3l73.4 73.4-73.4 73.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l96-96c12.5-12.5 12.5-32.8 0-45.3l-96-96c-12.5-12.5-32.8-12.5-45.3 0zm-274.7 0c-12.5-12.5-32.8-12.5-45.3 0l-96 96c-12.5 12.5-12.5 32.8 0 45.3l96 96c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 150.6 182.6c12.5-12.5 12.5-32.8 0-45.3z"/></svg>')
                // Initialize body background color and set default left alignment after editor is ready
                editor.on('init', () => {
                  const iframeBody = editor.getBody()
                  if (iframeBody) {
                    iframeBody.style.backgroundColor = backgroundColor
                  }
                  
                  setTimeout(() => {
                    if (!editor.getContent()) {
                      editor.setContent('<p>&nbsp;</p>')
                    }
                    editor.execCommand('JustifyLeft')
                    editor.focus()
                  }, 50)
                })

                // Prevent alignment from being turned off - one must always be active
                editor.on('BeforeExecCommand', (e) => {
                  const alignCommands = ['JustifyLeft', 'JustifyCenter', 'JustifyRight']
                  if (alignCommands.includes(e.command)) {
                    // Check if this alignment is already active
                    const isActive = editor.queryCommandState(e.command)
                    if (isActive) {
                      // Prevent turning off the currently active alignment
                      e.preventDefault()
                    }
                  }
                })

                // Helper function to open color picker dialog
                const openColorDialog = (title, currentColor, onSubmit) => {
                  editor.windowManager.open({
                    title: title,
                    body: {
                      type: 'panel',
                      items: [
                        {
                          type: 'colorinput',
                          name: 'color',
                          label: 'Color'
                        }
                      ]
                    },
                    buttons: [
                      {
                        type: 'cancel',
                        text: 'Cancel'
                      },
                      {
                        type: 'submit',
                        text: 'Apply',
                        primary: true
                      }
                    ],
                    initialData: {
                      color: currentColor
                    },
                    onSubmit: (api) => {
                      const data = api.getData()
                      onSubmit(data.color)
                      api.close()
                    }
                  })
                }

                // Helper function to add color indicator to button
                const addColorIndicator = (buttonName, color) => {
                  const button = editor.editorContainer.querySelector(`button[aria-label*="${buttonName}"]`)
                  if (button) {
                    if (buttonName === 'Text color') {
                      // For text color, only apply to icon
                      const svg = button.querySelector('svg path')
                      if (svg) {
                        svg.style.fill = color
                      }
                    } else if (buttonName === 'Editor background color') {
                      // For editor background, apply to button AND iframe body
                      button.style.backgroundColor = color
                      const iframeBody = editor.getBody()
                      if (iframeBody) {
                        iframeBody.style.backgroundColor = color
                      }
                    } else {
                      // For highlighter, apply to button background
                      button.style.backgroundColor = color
                    }
                  }
                }

                // Register custom textcolor button (replaces forecolor)
                editor.ui.registry.addButton('textcolor', {
                  icon: 'fa-font',
                  tooltip: 'Text color',
                  onAction: () => {
                    const currentColor = editor.queryCommandValue('ForeColor') || '#000000'
                    openColorDialog('Text Color', currentColor, (color) => {
                      editor.execCommand('ForeColor', false, color)
                      setTimeout(() => addColorIndicator('Text color', color), 10)
                    })
                  },
                  onSetup: () => {
                    const updateColor = () => {
                      const color = editor.queryCommandValue('ForeColor') || '#000000'
                      addColorIndicator('Text color', color)
                    }
                    editor.on('NodeChange', updateColor)
                    setTimeout(updateColor, 100)
                    return () => editor.off('NodeChange', updateColor)
                  }
                })

                // Register custom texthighlight button (replaces backcolor)
                editor.ui.registry.addButton('texthighlight', {
                  icon: 'fa-marker',
                  tooltip: 'Text background color',
                  onAction: () => {
                    const currentColor = editor.queryCommandValue('HiliteColor') || '#ffff00'
                    openColorDialog('Text Background Color', currentColor, (color) => {
                      editor.execCommand('HiliteColor', false, color)
                      setTimeout(() => addColorIndicator('Text background color', color), 10)
                    })
                  },
                  onSetup: () => {
                    const updateColor = () => {
                      const color = editor.queryCommandValue('HiliteColor') || '#ffff00'
                      addColorIndicator('Text background color', color)
                    }
                    editor.on('NodeChange', updateColor)
                    setTimeout(updateColor, 100)
                    return () => editor.off('NodeChange', updateColor)
                  }
                })

                // Register framebackcolor button (fills entire editor frame)
                editor.ui.registry.addButton('framebackcolor', {
                  icon: 'fa-fill-drip',
                  tooltip: 'Editor background color',
                  onAction: () => {
                    openColorDialog('Editor Background Color', backgroundColorRef.current, (color) => {
                      // If color is empty or remove color is selected, default to white
                      const finalColor = color && color !== '' ? color : '#ffffff'
                      onBackgroundColorChange?.(finalColor)
                      setTimeout(() => addColorIndicator('Editor background color', finalColor), 10)
                    })
                  },
                  onSetup: () => {
                    setTimeout(() => addColorIndicator('Editor background color', backgroundColor), 100)
                    return () => {}
                  }
                })

                // Override alignment buttons to ensure proper state management
                const alignButtons = [
                  { name: 'alignleft', command: 'JustifyLeft', tooltip: 'Align left', icon: 'align-left' },
                  { name: 'aligncenter', command: 'JustifyCenter', tooltip: 'Align center', icon: 'align-center' },
                  { name: 'alignright', command: 'JustifyRight', tooltip: 'Align right', icon: 'align-right' }
                ]

                alignButtons.forEach(btn => {
                  editor.ui.registry.addToggleButton(btn.name, {
                    icon: btn.icon,
                    tooltip: btn.tooltip,
                    onAction: () => {
                      editor.execCommand(btn.command)
                    },
                    onSetup: (buttonApi) => {
                      const updateState = () => {
                        buttonApi.setActive(editor.queryCommandState(btn.command))
                      }
                      
                      // Initial state update
                      setTimeout(updateState, 100)
                      
                      // Listen for changes
                      editor.on('NodeChange', updateState)
                      
                      return () => editor.off('NodeChange', updateState)
                    }
                  })
                })

                // Register format code button
                editor.ui.registry.addButton('formatCode', {
                  icon: 'code-sample',
                  tooltip: 'Format Code',
                  onAction: () => handleFormatCodeRef.current?.()
                })

                // Register view switcher buttons
                editor.ui.registry.addToggleButton('viewWysiwyg', {
                  icon: 'fa-pen-to-square',
                  tooltip: 'WYSIWYG Editor',
                  onAction: () => handleViewChangeRef.current?.('wysiwyg'),
                  onSetup: (buttonApi) => {
                    viewButtonsRef.current.wysiwyg = buttonApi
                    buttonApi.setActive(view === 'wysiwyg')
                    return () => {
                      viewButtonsRef.current.wysiwyg = null
                    }
                  }
                })

                editor.ui.registry.addToggleButton('viewCode', {
                  icon: 'fa-code',
                  tooltip: 'Code View',
                  onAction: () => handleViewChangeRef.current?.('code'),
                  onSetup: (buttonApi) => {
                    viewButtonsRef.current.code = buttonApi
                    buttonApi.setActive(view === 'code')
                    return () => {
                      viewButtonsRef.current.code = null
                    }
                  }
                })
              },
              plugins: [
                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'paste',
                'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                'insertdatetime', 'media', 'table', 'help', 'wordcount'
              ],
              schema: 'html4',
              verify_html: false,
              extended_valid_elements: '*[*]',
              valid_children: '+body[style],+body[script]',
              convert_fonts_to_spans: false,
              convert_urls: false,
              remove_trailing_brs: false,
              entity_encoding: 'raw',
              table_toolbar: '',
              table_tab_navigation: true,
              table_advtab: true,
              table_cell_advtab: true,
              table_row_advtab: true,
              table_appearance_options: true,
              table_style_by_css: false,
              object_resizing: 'table',
              contextmenu: 'link image table',
              formats: {
                strikethrough: {
                  inline: 'strike',
                  exact: true
                }
              },
              paste_preprocess: (_plugin, args) => {
                args.content = args.content
                  .replace(/<\s*(s|del)\b([^>]*)>/gi, '<strike$2>')
                  .replace(/<\/\s*(s|del)\s*>/gi, '</strike>')

                trackNoTbodyTablesFromSourceHtml(args.content)
              },
              paste_postprocess: (_plugin, args) => {
                const root = args.node
                const spans = root.querySelectorAll('span[style]')

                spans.forEach((span) => {
                  const styleAttr = span.getAttribute('style') || ''
                  const hasLineThrough = /text-decoration\s*:\s*line-through/i.test(styleAttr)
                  if (!hasLineThrough) return

                  const strike = root.ownerDocument.createElement('strike')
                  while (span.firstChild) {
                    strike.appendChild(span.firstChild)
                  }
                  span.parentNode.replaceChild(strike, span)
                })
              },
              font_size_formats: '8pt 10pt 12pt 14pt 16pt 18pt 24pt 32pt 36pt 48pt',
              font_family_formats: 'Arial=arial,helvetica,sans-serif; Arial Black=arial black,avant garde; Book Antiqua=book antiqua,palatino; Comic Sans MS=comic sans ms,sans-serif; Courier New=courier new,courier; Georgia=georgia,palatino; Helvetica=helvetica; Impact=impact,chicago; Tahoma=tahoma,arial,helvetica,sans-serif; Times New Roman=times new roman,times; Trebuchet MS=trebuchet ms,geneva; Verdana=verdana,geneva',
              content_style: `
                body { 
                  font-family: Arial, sans-serif; 
                  font-size: 14px; 
                  margin: 10px;
                  background-color: ${backgroundColor};
                }
                nav, header, footer, article, section, aside, main, figure, figcaption {
                  display: block;
                  border: 1px dashed #ccc;
                  padding: 10px;
                  margin: 10px 0;
                }
                nav::before { content: 'nav'; display: block; font-size: 10px; color: #999; }
                header::before { content: 'header'; display: block; font-size: 10px; color: #999; }
                footer::before { content: 'footer'; display: block; font-size: 10px; color: #999; }
                article::before { content: 'article'; display: block; font-size: 10px; color: #999; }
                section::before { content: 'section'; display: block; font-size: 10px; color: #999; }
                aside::before { content: 'aside'; display: block; font-size: 10px; color: #999; }
                main::before { content: 'main'; display: block; font-size: 10px; color: #999; }
              `
            }}
          />
        </div>

      {view === 'code' && (
        <div className="code-view">
          <CodeEditor value={content} onChange={handleCodeChange} />
        </div>
      )}
    </div>
  )
}