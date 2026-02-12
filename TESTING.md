# TinyMCE vs Tiptap vs Lexical - HTML Preservation Test

## Test Apps Running

- **TinyMCE**: http://localhost:5177/tinymce-test/
- **Tiptap**: http://localhost:5174/RTE-test/
- **Lexical**: http://localhost:5176/Lexicaltest/

## What to Test

### 1. Paste generic-page.html
Copy the entire contents of `generic-page.html` and paste into each editor's **Code View**, then toggle to WYSIWYG.

**What to look for:**
- Are `<style>` tags preserved?
- Are all attributes maintained (class, id, href, etc.)?
- Are semantic HTML5 elements (nav, section, etc.) preserved?
- Are table attributes (border, cellpadding, bgcolor) preserved?
- Do lists maintain their structure?
- Are custom data-* attributes kept?

### 2. Edit in WYSIWYG
Make a simple edit (bold some text, add a header) in WYSIWYG view, then toggle back to Code view.

**What to look for:**
- Did the editor normalize/strip any HTML?
- Are original attributes still there?
- Did inline styles get added?
- Are extra wrapper tags added?

### 3. Table Test
Create a table using the toolbar in WYSIWYG, then:
- Add some content
- Toggle to Code view
- Add custom attributes (border="1", cellpadding="5", bgcolor="#f0f0f0")
- Toggle back to WYSIWYG

**What to look for:**
- Are custom table attributes preserved?
- Does the table remain editable in WYSIWYG?

## TinyMCE Configuration

The TinyMCE test is configured for **maximum HTML preservation**:

```javascript
verify_html: false              // Don't strip unknown elements
extended_valid_elements: '*[*]' // Allow all attributes on all elements
valid_children: '+body[style],+body[script]'  // Allow style/script in body
cleanup: false                   // Don't clean up markup
forced_root_block: false        // Don't force wrapping in <p>
convert_urls: false             // Don't modify URLs
remove_trailing_brs: false      // Keep trailing <br> tags
entity_encoding: 'raw'          // Don't encode entities
```

## Expected Behavior

### Tiptap (Current)
- ❌ Strips attributes not in schema
- ❌ Normalizes to ProseMirror document model
- ✅ Clean, predictable output
- ✅ Fast, modern architecture
- ⚠️ Requires extensions for each element type

### Lexical
- ⚠️ Better than Tiptap but still normalizes
- ⚠️ Can use DecoratorNodes for unknown HTML
- ✅ More flexible schema system
- ❌ Takes longer to implement (5 weeks vs 2)

### TinyMCE
- ✅ Should preserve ALL HTML as-is
- ✅ No normalization with proper config
- ✅ Legacy attribute support (border, bgcolor, etc.)
- ✅ Works with complex nested structures
- ⚠️ Larger bundle size (~500KB vs 180KB)
- ⚠️ Older codebase, different API style

## Recommendation

If HTML preservation is the #1 priority and you need to support arbitrary user-pasted HTML with legacy attributes, **TinyMCE** is the best choice despite being larger and older.

If you can accept some HTML normalization and want modern architecture, stick with **Tiptap** and continue extending it.
