import { useRef, useCallback, useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import styles from './NoteEditor.module.css';

interface NoteEditorProps {
  content: string;
  onChange: (html: string) => void;
  onImageInsert: (file: File) => Promise<string>;
  placeholder?: string;
}

const IMAGE_SIZES = [
  { label: 'S', width: 200 },
  { label: 'M', width: 400 },
  { label: 'L', width: 600 },
  { label: 'Full', width: 0 },
];

export function NoteEditor({ content, onChange, onImageInsert, placeholder }: NoteEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isUploading = useRef(false);
  const [imageSelected, setImageSelected] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: false,
        HTMLAttributes: { class: styles.inlineImage },
        resize: {
          enabled: true,
          minWidth: 100,
          minHeight: 50,
          alwaysPreserveAspectRatio: true,
        },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? 'Write your note...',
      }),
    ],
    content,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  // Track whether an image node is currently selected
  useEffect(() => {
    if (!editor) return;
    const updateSelection = () => {
      setImageSelected(editor.isActive('image'));
    };
    editor.on('selectionUpdate', updateSelection);
    editor.on('transaction', updateSelection);
    return () => {
      editor.off('selectionUpdate', updateSelection);
      editor.off('transaction', updateSelection);
    };
  }, [editor]);

  const handleImageClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor || isUploading.current) return;

    isUploading.current = true;
    try {
      const url = await onImageInsert(file);
      editor.chain().focus().setImage({ src: url }).run();
    } catch (err) {
      console.error('Image insert failed:', err);
    } finally {
      isUploading.current = false;
      e.target.value = '';
    }
  }, [editor, onImageInsert]);

  function setImageSize(width: number) {
    if (!editor) return;
    if (width === 0) {
      // Full width — remove explicit dimensions
      editor.chain().focus().updateAttributes('image', { width: null, height: null }).run();
    } else {
      editor.chain().focus().updateAttributes('image', { width }).run();
    }
  }

  if (!editor) return null;

  return (
    <div className={styles.editor}>
      <div className={styles.toolbar}>
        <button
          type="button"
          className={`${styles.toolBtn} ${editor.isActive('bold') ? styles.active : ''}`}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          B
        </button>
        <button
          type="button"
          className={`${styles.toolBtn} ${editor.isActive('italic') ? styles.active : ''}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          className={`${styles.toolBtn} ${editor.isActive('heading', { level: 3 }) ? styles.active : ''}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Heading"
        >
          H
        </button>
        <button
          type="button"
          className={`${styles.toolBtn} ${editor.isActive('bulletList') ? styles.active : ''}`}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet List"
        >
          &bull;
        </button>
        <button
          type="button"
          className={`${styles.toolBtn} ${editor.isActive('orderedList') ? styles.active : ''}`}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered List"
        >
          1.
        </button>
        <div className={styles.toolSeparator} />
        <button
          type="button"
          className={styles.toolBtn}
          onClick={handleImageClick}
          title="Insert Image"
        >
          {'\uD83D\uDDBC'}
        </button>

        {/* Image size controls — shown when image is selected */}
        {imageSelected && (
          <>
            <div className={styles.toolSeparator} />
            {IMAGE_SIZES.map((size) => (
              <button
                key={size.label}
                type="button"
                className={styles.sizeBtn}
                onClick={() => setImageSize(size.width)}
                title={size.width ? `${size.width}px` : 'Full width'}
              >
                {size.label}
              </button>
            ))}
          </>
        )}
      </div>

      <EditorContent editor={editor} className={styles.editorContent} />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </div>
  );
}
