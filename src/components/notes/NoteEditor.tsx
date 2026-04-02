import { useRef, useState, useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { NodeSelection } from '@tiptap/pm/state';
import styles from './NoteEditor.module.css';

interface NoteEditorProps {
  content: string;
  onChange: (html: string) => void;
  onImageInsert: (file: File) => Promise<string>;
  placeholder?: string;
}

const SIZE_OPTIONS = [
  { label: 'S', width: '25%' },
  { label: 'M', width: '50%' },
  { label: 'L', width: '75%' },
  { label: 'Full', width: '100%' },
] as const;

/** Extend Image to persist a `width` style attribute */
const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (el: HTMLElement) => el.style.width || null,
        renderHTML: (attrs: Record<string, unknown>) =>
          attrs.width ? { style: `width: ${attrs.width}` } : {},
      },
    };
  },
});

export function NoteEditor({ content, onChange, onImageInsert, placeholder }: NoteEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isUploading = useRef(false);
  const [selectedImageWidth, setSelectedImageWidth] = useState<string | null>(null);
  const [imageSelected, setImageSelected] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      ResizableImage.configure({
        inline: false,
        HTMLAttributes: { class: styles.inlineImage },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? 'Write your note...',
      }),
    ],
    content,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
    onSelectionUpdate: ({ editor: ed }) => {
      const { selection } = ed.state;
      if (selection instanceof NodeSelection && selection.node.type.name === 'image') {
        setImageSelected(true);
        setSelectedImageWidth(selection.node.attrs.width || '100%');
      } else {
        setImageSelected(false);
        setSelectedImageWidth(null);
      }
    },
  });

  // Also clear image selection when editor blurs
  useEffect(() => {
    if (!editor) return;
    const handleBlur = () => {
      // Small delay so click on size button registers first
      setTimeout(() => {
        if (!editor.isFocused) {
          setImageSelected(false);
          setSelectedImageWidth(null);
        }
      }, 150);
    };
    editor.on('blur', handleBlur);
    return () => { editor.off('blur', handleBlur); };
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

  function setImageSize(width: string) {
    if (!editor) return;
    const { selection } = editor.state;
    if (selection instanceof NodeSelection && selection.node.type.name === 'image') {
      editor.chain().focus().updateAttributes('image', { width }).run();
      setSelectedImageWidth(width);
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

        {imageSelected && (
          <>
            <div className={styles.toolSeparator} />
            {SIZE_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                type="button"
                className={`${styles.sizeBtn} ${selectedImageWidth === opt.width ? styles.sizeBtnActive : ''}`}
                onClick={() => setImageSize(opt.width)}
                title={`Resize to ${opt.width}`}
              >
                {opt.label}
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
