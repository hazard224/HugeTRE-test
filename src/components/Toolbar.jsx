import { useState, useCallback, useEffect } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faUndo,
  faRedo,
  faRemoveFormat,
  faBold,
  faItalic,
  faUnderline,
  faStrikethrough,
  faAlignLeft,
  faAlignCenter,
  faAlignRight,
  faAlignJustify,
  faListUl,
  faListOl,
  faTable,
  faLink,
  faUnlink,
  faCode,
  faEdit,
  faFont,
  faHighlighter,
  faFillDrip,
  faIndent,
} from "@fortawesome/free-solid-svg-icons"
import Select from 'react-select'
import CreatableSelect from 'react-select/creatable'

export default function Toolbar({
  editorRef,
  showHtml,
  setShowHtml,
  textColor,
  setTextColor,
  highlightColor,
  setHighlightColor,
  backgroundColor,
  setBackgroundColor,
  fontFamily,
  setFontFamily,
  fontSize,
  setFontSize,
  onFormatCode,
}) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const [tablePopoverOpen, setTablePopoverOpen] = useState(false)
  const [tablePopoverPos, setTablePopoverPos] = useState({ top: 0, left: 0 })
  const [hoveredCell, setHoveredCell] = useState({ rows: 0, cols: 0 })

  // Active state tracking for toolbar buttons
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    alignLeft: true, // Default alignment
    alignCenter: false,
    alignRight: false,
    alignJustify: false,
    bulletList: false,
    orderedList: false,
  })

  const editor = editorRef.current

  // Update active formats when editor selection changes
  useEffect(() => {
    if (!editor) return

    const updateActiveFormats = () => {
      const alignLeft = editor.queryCommandState('JustifyLeft')
      const alignCenter = editor.queryCommandState('JustifyCenter')
      const alignRight = editor.queryCommandState('JustifyRight')
      const alignJustify = editor.queryCommandState('JustifyFull')
      
      // If no alignment is explicitly set, default to left
      const hasAlignment = alignLeft || alignCenter || alignRight || alignJustify
      
      setActiveFormats({
        bold: editor.queryCommandState('Bold'),
        italic: editor.queryCommandState('Italic'),
        underline: editor.queryCommandState('Underline'),
        strikethrough: editor.queryCommandState('Strikethrough'),
        alignLeft: hasAlignment ? alignLeft : true,
        alignCenter: alignCenter,
        alignRight: alignRight,
        alignJustify: alignJustify,
        bulletList: editor.queryCommandState('InsertUnorderedList'),
        orderedList: editor.queryCommandState('InsertOrderedList'),
      })
    }

    // Update on selection change
    editor.on('NodeChange', updateActiveFormats)
    editor.on('SelectionChange', updateActiveFormats)
    
    // Initial update
    updateActiveFormats()

    return () => {
      editor.off('NodeChange', updateActiveFormats)
      editor.off('SelectionChange', updateActiveFormats)
    }
  }, [editor])

  // Execute TinyMCE command
  const execCommand = useCallback((command, value = null) => {
    if (editor) {
      editor.execCommand(command, false, value)
      editor.focus()
    }
  }, [editor])



  // Font options
  const fontFamilyOptions = [
    { value: 'Arial', label: 'Arial' },
    { value: 'Arial Black', label: 'Arial Black' },
    { value: 'Comic Sans MS', label: 'Comic Sans MS' },
    { value: 'Courier New', label: 'Courier New' },
    { value: 'Georgia', label: 'Georgia' },
    { value: 'Helvetica', label: 'Helvetica' },
    { value: 'Impact', label: 'Impact' },
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'Trebuchet MS', label: 'Trebuchet MS' },
    { value: 'Verdana', label: 'Verdana' },
  ]

  const fontSizeOptions = [
    { value: '8px', label: '8px' },
    { value: '10px', label: '10px' },
    { value: '12px', label: '12px' },
    { value: '14px', label: '14px' },
    { value: '16px', label: '16px' },
    { value: '18px', label: '18px' },
    { value: '24px', label: '24px' },
    { value: '32px', label: '32px' },
    { value: '48px', label: '48px' },
  ]

  // Font handlers
  const handleFontFamilyChange = useCallback((option) => {
    if (option && editor) {
      setFontFamily(option.value)
      execCommand('FontName', option.value)
    }
  }, [editor, execCommand, setFontFamily])

  const handleFontSizeChange = useCallback((option) => {
    if (option && editor) {
      const size = option.value
      setFontSize(size)
      // Use inline style for font size
      editor.formatter.register('fontsize', {
        inline: 'span',
        styles: { 'font-size': size },
      })
      editor.formatter.apply('fontsize')
      editor.focus()
    }
  }, [editor, setFontSize])

  // Link handlers
  const handleLinkClick = () => {
    setLinkUrl('')
    setLinkDialogOpen(true)
  }

  const handleLinkInsert = () => {
    if (linkUrl && editor) {
      editor.execCommand('mceInsertLink', false, linkUrl)
      setLinkDialogOpen(false)
      setLinkUrl('')
      editor.focus()
    }
  }

  // Table handlers
  const handleTableClick = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setTablePopoverPos({ top: rect.bottom + 4, left: rect.left })
    setTablePopoverOpen(true)
  }, [])

  const handleTableInsert = useCallback((rows, cols) => {
    if (editor) {
      // Build table HTML manually to avoid TinyMCE dialog
      let tableHTML = '<table style="border-collapse: collapse; width: 100%;">'
      for (let r = 0; r < rows; r++) {
        tableHTML += '<tr>'
        for (let c = 0; c < cols; c++) {
          tableHTML += '<td style="border: 1px solid #ccc; padding: 8px;">&nbsp;</td>'
        }
        tableHTML += '</tr>'
      }
      tableHTML += '</table><p>&nbsp;</p>'
      
      // Insert the table HTML directly
      editor.insertContent(tableHTML)
      setTablePopoverOpen(false)
      editor.focus()
    }
  }, [editor])

  return (
    <div className="toolbar">
      {/* View Toggle */}
      <div className="toolbar-group">
        <button
          className={`toolbar-button ${showHtml === 'wysiwyg' ? 'active' : ''}`}
          onClick={() => setShowHtml('wysiwyg')}
          title="WYSIWYG"
        >
          <FontAwesomeIcon icon={faEdit} />
        </button>
        <button
          className={`toolbar-button ${showHtml === 'code' ? 'active' : ''}`}
          onClick={() => setShowHtml('code')}
          title="Code"
        >
          <FontAwesomeIcon icon={faCode} />
        </button>
        <button
          className={`toolbar-button ${showHtml === 'preview' ? 'active' : ''}`}
          onClick={() => setShowHtml('preview')}
          title="Preview"
        >
          Preview
        </button>
        {showHtml === 'code' && (
          <button
            className="toolbar-button"
            onClick={onFormatCode}
            title="Format Code"
          >
            <FontAwesomeIcon icon={faIndent} />
          </button>
        )}
      </div>

      {/* History and Formatting - Only visible in WYSIWYG mode */}
      {editor && showHtml === 'wysiwyg' && (
      <>
      <div className="toolbar-group">
        <button
          onClick={() => execCommand('Undo')}
          title="Undo"
          className="toolbar-button"
        >
          <FontAwesomeIcon icon={faUndo} />
        </button>
        <button
          onClick={() => execCommand('Redo')}
          title="Redo"
          className="toolbar-button"
        >
          <FontAwesomeIcon icon={faRedo} />
        </button>
        <button
          onClick={() => execCommand('RemoveFormat')}
          title="Clear Formatting"
          className="toolbar-button"
        >
          <FontAwesomeIcon icon={faRemoveFormat} />
        </button>
      </div>

      {/* Text Formatting */}
      <div className="toolbar-group">
        <button
          onClick={() => execCommand('Bold')}
          title="Bold"
          className={`toolbar-button ${activeFormats.bold ? 'active' : ''}`}
        >
          <FontAwesomeIcon icon={faBold} />
        </button>
        <button
          onClick={() => execCommand('Italic')}
          title="Italic"
          className={`toolbar-button ${activeFormats.italic ? 'active' : ''}`}
        >
          <FontAwesomeIcon icon={faItalic} />
        </button>
        <button
          onClick={() => execCommand('Underline')}
          title="Underline"
          className={`toolbar-button ${activeFormats.underline ? 'active' : ''}`}
        >
          <FontAwesomeIcon icon={faUnderline} />
        </button>
        <button
          onClick={() => execCommand('Strikethrough')}
          title="Strikethrough"
          className={`toolbar-button ${activeFormats.strikethrough ? 'active' : ''}`}
        >
          <FontAwesomeIcon icon={faStrikethrough} />
        </button>
      </div>

      {/* Font Family and Size */}
      <div className="toolbar-group">
        <Select
          value={fontFamilyOptions.find(opt => opt.value === fontFamily)}
          onChange={handleFontFamilyChange}
          options={fontFamilyOptions}
          placeholder="Font"
          styles={{
            control: (base) => ({
              ...base,
              minWidth: '150px',
              fontSize: '14px',
              border: '1px solid #d0d0d0',
            }),
            menu: (base) => ({
              ...base,
              zIndex: 10000,
            }),
            singleValue: (base, { data }) => ({
              ...base,
              textAlign: 'left',
              fontFamily: data.value,
            }),
            option: (base, { data }) => ({
              ...base,
              textAlign: 'left',
              fontFamily: data.value,
            }),
          }}
        />
        <CreatableSelect
          value={fontSizeOptions.find(opt => opt.value === fontSize) || { value: fontSize, label: fontSize }}
          onChange={handleFontSizeChange}
          options={fontSizeOptions}
          placeholder="Size"
          styles={{
            control: (base) => ({
              ...base,
              minWidth: '100px',
              fontSize: '14px',
              border: '1px solid #d0d0d0',
            }),
            menu: (base) => ({
              ...base,
              zIndex: 10000,
            }),
            singleValue: (base) => ({
              ...base,
              textAlign: 'left',
            }),
            option: (base) => ({
              ...base,
              textAlign: 'left',
            }),
          }}
        />
      </div>



      {/* Alignment */}
      <div className="toolbar-group">
        <button
          onClick={() => execCommand('JustifyLeft')}
          title="Align Left"
          className={`toolbar-button ${activeFormats.alignLeft ? 'active' : ''}`}
        >
          <FontAwesomeIcon icon={faAlignLeft} />
        </button>
        <button
          onClick={() => execCommand('JustifyCenter')}
          title="Align Center"
          className={`toolbar-button ${activeFormats.alignCenter ? 'active' : ''}`}
        >
          <FontAwesomeIcon icon={faAlignCenter} />
        </button>
        <button
          onClick={() => execCommand('JustifyRight')}
          title="Align Right"
          className={`toolbar-button ${activeFormats.alignRight ? 'active' : ''}`}
        >
          <FontAwesomeIcon icon={faAlignRight} />
        </button>
        <button
          onClick={() => execCommand('JustifyFull')}
          title="Justify"
          className={`toolbar-button ${activeFormats.alignJustify ? 'active' : ''}`}
        >
          <FontAwesomeIcon icon={faAlignJustify} />
        </button>
      </div>

      {/* Lists */}
      <div className="toolbar-group">
        <button
          onClick={() => execCommand('InsertUnorderedList')}
          title="Bullet List"
          className={`toolbar-button ${activeFormats.bulletList ? 'active' : ''}`}
        >
          <FontAwesomeIcon icon={faListUl} />
        </button>
        <button
          onClick={() => execCommand('InsertOrderedList')}
          title="Numbered List"
          className={`toolbar-button ${activeFormats.orderedList ? 'active' : ''}`}
        >
          <FontAwesomeIcon icon={faListOl} />
        </button>
      </div>

      {/* Table */}
      <div className="toolbar-group">
        <button
          onClick={handleTableClick}
          title="Insert Table"
          className="toolbar-button"
        >
          <FontAwesomeIcon icon={faTable} />
        </button>
      </div>

      {/* Links */}
      <div className="toolbar-group">
        <button
          onClick={handleLinkClick}
          title="Insert Link"
          className="toolbar-button"
        >
          <FontAwesomeIcon icon={faLink} />
        </button>
        <button
          onClick={() => execCommand('unlink')}
          title="Remove Link"
          className="toolbar-button"
        >
          <FontAwesomeIcon icon={faUnlink} />
        </button>
      </div>
      </>
      )}

      {/* Link Dialog */}
      {linkDialogOpen && (
        <>
          <div
            className="dialog-overlay"
            onClick={() => setLinkDialogOpen(false)}
          />
          <div className="dialog">
            <h3>Insert Link</h3>
            <input
              type="text"
              placeholder="https://example.com"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleLinkInsert()
              }}
              autoFocus
            />
            <div className="dialog-buttons">
              <button onClick={handleLinkInsert}>Insert</button>
              <button onClick={() => setLinkDialogOpen(false)}>Cancel</button>
            </div>
          </div>
        </>
      )}

      {/* Table Grid Popover */}
      {tablePopoverOpen && (
        <>
          <div
            className="color-picker-overlay"
            onClick={() => setTablePopoverOpen(false)}
          />
          <div
            className="table-popover"
            style={{
              position: 'fixed',
              top: `${tablePopoverPos.top}px`,
              left: `${tablePopoverPos.left}px`,
              zIndex: 10000,
            }}
          >
            <div className="table-grid">
              {Array.from({ length: 10 }).map((_, rowIndex) => (
                <div key={rowIndex} className="table-grid-row">
                  {Array.from({ length: 10 }).map((_, colIndex) => (
                    <div
                      key={colIndex}
                      className={`table-grid-cell ${
                        rowIndex < hoveredCell.rows && colIndex < hoveredCell.cols
                          ? 'highlighted'
                          : ''
                      }`}
                      onMouseEnter={() =>
                        setHoveredCell({ rows: rowIndex + 1, cols: colIndex + 1 })
                      }
                      onClick={() => handleTableInsert(rowIndex + 1, colIndex + 1)}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div className="table-size-label">
              {hoveredCell.rows} x {hoveredCell.cols}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
