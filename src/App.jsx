import { useState, useRef, useEffect } from 'react'
import './App.css'
import RichTextEditor from './components/RichTextEditor'

function App() {
  const [htmlContent, setHtmlContent] = useState('<h1>TinyMCE Test</h1><p>Paste your HTML here and see if it preserves everything!</p>')
  const [backgroundColor, setBackgroundColor] = useState('#ffffff')
  const iframeRef = useRef(null)

  // Update iframe content whenever html changes
  useEffect(() => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument
      doc.open()
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                padding: 16px;
                margin: 0;
                line-height: 1.6;
                background-color: ${backgroundColor};
              }
              p {
                margin: 0.5em 0;
              }
              ul, ol {
                padding-left: 1.5em;
                margin: 0.5em 0;
              }
              li {
                margin: 0.25em 0;
              }
              a {
                color: #2563eb;
                text-decoration: underline;
              }
              table {
                border-collapse: collapse;
              }
              table td, table th {
                border: 1px solid #ddd;
                padding: 8px;
              }
            </style>
          </head>
          <body>${htmlContent}</body>
        </html>
      `)
      doc.close()
    }
  }, [htmlContent, backgroundColor])

  return (
    <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
      <h1>TinyMCE Rich Text Editor Test</h1>
      <p style={{ marginBottom: '20px' }}>Testing HTML preservation without normalization</p>
      
      <RichTextEditor
        value={htmlContent}
        onChange={setHtmlContent}
        backgroundColor={backgroundColor}
        onBackgroundColorChange={setBackgroundColor}
      />

      {/* Iframe Preview */}
      <div style={{ marginTop: 30, width: '100%' }}>
        <h3 style={{ color: '#333', marginBottom: 10 }}>Preview (iframe)</h3>
        <iframe
          ref={iframeRef}
          title="HTML Preview"
          style={{
            width: '100%',
            height: 300,
            border: '1px solid #ddd',
            borderRadius: 4,
            backgroundColor: '#fff',
          }}
        />
      </div>

      {/* Raw HTML */}
      <div style={{ marginTop: 30, width: '100%' }}>
        <h3 style={{ color: '#333', marginBottom: 10 }}>Raw HTML</h3>
        <pre
          style={{
            backgroundColor: '#fff',
            padding: 16,
            borderRadius: 4,
            border: '1px solid #ddd',
            overflow: 'auto',
            fontSize: 13,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            textAlign: 'left',
          }}
        >
          {htmlContent}
        </pre>
      </div>
    </div>
  )
}

export default App
