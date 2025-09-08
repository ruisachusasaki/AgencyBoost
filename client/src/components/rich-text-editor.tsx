import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { FontFamily } from '@tiptap/extension-font-family';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  Bold, 
  Italic, 
  Strikethrough, 
  Code, 
  Heading1, 
  Heading2, 
  Heading3,
  List, 
  ListOrdered, 
  Quote, 
  Undo, 
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  Highlighter,
  CheckSquare,
  AlignJustify,
  FileCode,
  Maximize,
  Minimize,
  Square
} from 'lucide-react';
import { CalloutExtension, ToggleExtension, ToggleSummary, ToggleContent, ColumnsExtension, ColumnExtension } from './tiptap-extensions';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

const lineHeightClasses = {
  '1.0': 'line-height-1',
  '1.15': 'line-height-1-15', 
  '1.3': 'line-height-1-3',
  '1.5': 'line-height-1-5',
  '1.7': 'line-height-1-7',
  '2.0': 'line-height-2'
};

// Helper function to convert plain text to HTML
const convertTextToHtml = (text: string): string => {
  if (!text) return '';
  
  // If content already looks like HTML (contains tags), return as is
  if (text.includes('<') && text.includes('>')) {
    return text;
  }
  
  // Convert plain text to HTML
  return text
    // Split into paragraphs on double newlines
    .split('\n\n')
    .map(paragraph => {
      if (!paragraph.trim()) return '';
      
      // Convert single newlines within paragraphs to <br> tags
      const formattedParagraph = paragraph
        .split('\n')
        .map(line => line.trim())
        .filter(line => line)
        .join('<br>');
      
      return `<p>${formattedParagraph}</p>`;
    })
    .filter(p => p)
    .join('');
};

export function RichTextEditor({ content, onChange, placeholder = "Start typing...", className }: RichTextEditorProps) {
  const { toast } = useToast();
  const [currentLineHeight, setCurrentLineHeight] = useState('1.3');
  const [selectedImageSize, setSelectedImageSize] = useState<'small' | 'medium' | 'large' | 'full'>('full');
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [editorSelection, setEditorSelection] = useState(0); // Force re-renders on selection changes
  const [htmlContent, setHtmlContent] = useState(content);
  
  // Convert plain text content to HTML format
  const htmlFormattedContent = convertTextToHtml(content);
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        listItem: {
          HTMLAttributes: {},
        },
        bulletList: {
          HTMLAttributes: {},
        },
        orderedList: {
          HTMLAttributes: {},
        },
      }),
      Highlight,
      TextStyle,
      Color,
      FontFamily,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
        inline: false,
        allowBase64: true,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      CalloutExtension,
      ToggleExtension,
      ToggleSummary,
      ToggleContent,
      ColumnsExtension,
      ColumnExtension,
    ],
    content: htmlFormattedContent,
    onUpdate: ({ editor }) => {
      const rawHTML = editor.getHTML();
      const cleanedHTML = cleanListHTML(rawHTML);
      onChange(cleanedHTML);
    },
    onSelectionUpdate: ({ editor }) => {
      // Force re-render when selection changes to show/hide image controls
      setEditorSelection(prev => prev + 1);
    },
    editorProps: {
      attributes: {
        class: 'tiptap focus:outline-none min-h-[200px] p-4 w-full max-w-none prose prose-sm',
        placeholder,
      },
    },
  });

  // Update editor content when content prop changes
  React.useEffect(() => {
    if (editor && content !== undefined) {
      const newHtmlContent = convertTextToHtml(content);
      const currentContent = editor.getHTML();
      
      // Only update if content is different to avoid cursor issues
      if (currentContent !== newHtmlContent) {
        editor.commands.setContent(newHtmlContent);
      }
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  const toggleBold = () => editor.chain().focus().toggleBold().run();
  const toggleItalic = () => editor.chain().focus().toggleItalic().run();
  const toggleStrike = () => editor.chain().focus().toggleStrike().run();
  const toggleCode = () => editor.chain().focus().toggleCode().run();
  const toggleHighlight = () => editor.chain().focus().toggleHighlight().run();

  const setHeading = (level: 1 | 2 | 3) => {
    editor.chain().focus().toggleHeading({ level }).run();
  };

  const toggleBulletList = () => editor.chain().focus().toggleBulletList().run();
  const toggleOrderedList = () => editor.chain().focus().toggleOrderedList().run();
  const toggleBlockquote = () => editor.chain().focus().toggleBlockquote().run();
  const toggleTaskList = () => editor.chain().focus().toggleTaskList().run();

  const undo = () => editor.chain().focus().undo().run();
  const redo = () => editor.chain().focus().redo().run();

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    // Create a file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive"
        });
        return;
      }

      try {
        // Get upload URL from server
        const uploadResponse = await fetch('/api/objects/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to get upload URL');
        }

        const { uploadURL } = await uploadResponse.json();

        // Upload file directly to object storage
        const uploadFileResponse = await fetch(uploadURL, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type,
          },
          body: file,
        });

        if (!uploadFileResponse.ok) {
          throw new Error('Failed to upload image');
        }

        // Set object ACL policy and get final URL
        const finalResponse = await fetch('/api/images', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageURL: uploadURL.split('?')[0], // Remove query parameters
          }),
        });

        if (!finalResponse.ok) {
          throw new Error('Failed to finalize image upload');
        }

        const { objectPath } = await finalResponse.json();
        const imageUrl = `${window.location.origin}${objectPath}`;

        // Insert image into editor
        editor.chain().focus().setImage({ src: imageUrl }).run();

        toast({
          title: "Image uploaded",
          description: "Image has been added to your content"
        });

      } catch (error) {
        console.error('Image upload error:', error);
        toast({
          title: "Upload failed",
          description: "Failed to upload image. Please try again.",
          variant: "destructive"
        });
      }
    };

    // Trigger file picker
    input.click();
  };

  const setLineHeight = (height: string) => {
    setCurrentLineHeight(height);
    editor.chain().focus().run();
  };

  // Image sizing functions
  const setImageSize = (size: 'small' | 'medium' | 'large' | 'full') => {
    if (!editor) return;
    
    const sizeStyles = {
      small: '320px',     // Small - 320px
      medium: '448px',    // Medium - 448px  
      large: '512px',     // Large - 512px
      full: '100%'        // Full width
    };
    
    const width = sizeStyles[size];
    
    console.log('Setting image size to:', size, 'width:', width);
    
    // Try multiple approaches to ensure the image gets resized
    try {
      // Method 1: Update attributes with width and style
      editor.chain().focus().updateAttributes('image', {
        width: size === 'full' ? '100%' : width.replace('px', ''),
        style: `width: ${width}; height: auto; border-radius: 0.5rem;`
      }).run();
      
      // Method 2: Also try to set the style directly on the DOM element
      setTimeout(() => {
        const selectedImg = document.querySelector('.tiptap img[data-selected]') || 
                           document.querySelector('.tiptap .ProseMirror-selectednode img') ||
                           document.querySelector('.tiptap img:focus');
        
        if (selectedImg) {
          console.log('Found selected image, applying style directly');
          selectedImg.style.width = width;
          selectedImg.style.height = 'auto';
          selectedImg.style.borderRadius = '0.5rem';
        }
      }, 100);
      
    } catch (error) {
      console.error('Error setting image size:', error);
    }
    
    setSelectedImageSize(size);
  };

  const isImageSelected = () => {
    if (!editor) return false;
    
    try {
      const { selection } = editor.state;
      
      // Check if NodeSelection and node is image
      if (selection.constructor.name === 'NodeSelection') {
        const node = (selection as any).node;
        return node?.type.name === 'image';
      }
      
      // Fallback to isActive check
      return editor.isActive('image');
    } catch (error) {
      console.log('Image selection check error:', error);
      return false;
    }
  };

  const toggleHtmlMode = () => {
    if (isHtmlMode) {
      // Switching from HTML to visual mode
      if (editor) {
        editor.commands.setContent(htmlContent);
        const cleanedHTML = cleanListHTML(htmlContent);
        onChange(cleanedHTML);
      }
    } else {
      // Switching from visual to HTML mode
      if (editor) {
        const rawHTML = editor.getHTML();
        const cleanedHTML = cleanListHTML(rawHTML);
        setHtmlContent(cleanedHTML);
      }
    }
    setIsHtmlMode(!isHtmlMode);
  };

  const handleHtmlChange = (value: string) => {
    setHtmlContent(value);
    onChange(value);
  };

  // Clean up HTML by removing unnecessary paragraph tags in list items
  const cleanListHTML = (html: string) => {
    return html
      .replace(/<li><p>(.*?)<\/p><\/li>/g, '<li>$1</li>')
      .replace(/<li>\s*<p>(.*?)<\/p>\s*<\/li>/g, '<li>$1</li>');
  };

  return (
    <div className={`border border-gray-300 rounded-lg ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
        {/* History */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={undo}
          disabled={!editor.can().undo()}
          className="h-8 w-8 p-0"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={redo}
          disabled={!editor.can().redo()}
          className="h-8 w-8 p-0"
        >
          <Redo className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Text Formatting */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleBold}
          className={`h-8 w-8 p-0 ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleItalic}
          className={`h-8 w-8 p-0 ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleStrike}
          className={`h-8 w-8 p-0 ${editor.isActive('strike') ? 'bg-gray-200' : ''}`}
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleCode}
          className={`h-8 w-8 p-0 ${editor.isActive('code') ? 'bg-gray-200' : ''}`}
        >
          <Code className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleHighlight}
          className={`h-8 w-8 p-0 ${editor.isActive('highlight') ? 'bg-gray-200' : ''}`}
        >
          <Highlighter className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Headings */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setHeading(1)}
          className={`h-8 w-8 p-0 ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''}`}
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setHeading(2)}
          className={`h-8 w-8 p-0 ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}`}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setHeading(3)}
          className={`h-8 w-8 p-0 ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-200' : ''}`}
        >
          <Heading3 className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Lists */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleBulletList}
          className={`h-8 w-8 p-0 ${editor.isActive('bulletList') ? 'bg-gray-200' : ''}`}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleOrderedList}
          className={`h-8 w-8 p-0 ${editor.isActive('orderedList') ? 'bg-gray-200' : ''}`}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleTaskList}
          className={`h-8 w-8 p-0 ${editor.isActive('taskList') ? 'bg-gray-200' : ''}`}
        >
          <CheckSquare className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Block Elements */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleBlockquote}
          className={`h-8 w-8 p-0 ${editor.isActive('blockquote') ? 'bg-gray-200' : ''}`}
        >
          <Quote className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Links & Media */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addLink}
          className="h-8 w-8 p-0"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addImage}
          className="h-8 w-8 p-0"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Image Size Controls - Only show when an image is selected */}
        {isImageSelected() && (
          <>
            <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-md border border-blue-200">
              <span className="text-xs text-blue-700 font-medium">Size:</span>
              <Button
                type="button"
                variant={selectedImageSize === 'small' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setImageSize('small')}
                className="h-6 px-2 text-xs"
                title="Small (320px width)"
              >
                S
              </Button>
              <Button
                type="button"
                variant={selectedImageSize === 'medium' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setImageSize('medium')}
                className="h-6 px-2 text-xs"
                title="Medium (448px width)"
              >
                M
              </Button>
              <Button
                type="button"
                variant={selectedImageSize === 'large' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setImageSize('large')}
                className="h-6 px-2 text-xs"
                title="Large (512px width)"
              >
                L
              </Button>
              <Button
                type="button"
                variant={selectedImageSize === 'full' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setImageSize('full')}
                className="h-6 px-2 text-xs"
                title="Full Width (100%)"
              >
                XL
              </Button>
            </div>
            
            <div className="w-px h-6 bg-gray-300 mx-1" />
          </>
        )}

        {/* HTML Mode Toggle */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleHtmlMode}
          className={`h-8 w-8 p-0 ${isHtmlMode ? 'bg-gray-200' : ''}`}
          title="Toggle HTML Mode"
        >
          <FileCode className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Line Spacing */}
        <div className="relative group">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <AlignJustify className="h-4 w-4" />
          </Button>
          
          {/* Line Spacing Dropdown */}
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 min-w-[120px]">
            <div className="p-1">
              <button
                type="button"
                onClick={() => setLineHeight('1.0')}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
              >
                Single (1.0)
              </button>
              <button
                type="button"
                onClick={() => setLineHeight('1.15')}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
              >
                Tight (1.15)
              </button>
              <button
                type="button"
                onClick={() => setLineHeight('1.3')}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
              >
                Compact (1.3)
              </button>
              <button
                type="button"
                onClick={() => setLineHeight('1.5')}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
              >
                Normal (1.5)
              </button>
              <button
                type="button"
                onClick={() => setLineHeight('1.7')}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
              >
                Relaxed (1.7)
              </button>
              <button
                type="button"
                onClick={() => setLineHeight('2.0')}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
              >
                Double (2.0)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      {isHtmlMode ? (
        <textarea
          value={htmlContent}
          onChange={(e) => handleHtmlChange(e.target.value)}
          className="w-full min-h-[200px] p-4 font-mono text-sm border-0 resize-none focus:outline-none"
          placeholder="Enter HTML content..."
        />
      ) : (
        <EditorContent 
          editor={editor} 
          className={`min-h-[200px] ${lineHeightClasses[currentLineHeight as keyof typeof lineHeightClasses] || ''}`} 
        />
      )}
    </div>
  );
}