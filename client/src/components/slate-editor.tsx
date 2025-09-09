import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { createEditor, Descendant, Element as SlateElement, Transforms, Editor, Point, Range, Path } from 'slate';
import { Slate, Editable, withReact, ReactEditor, useSlateStatic } from 'slate-react';
import { withHistory } from 'slate-history';
import { 
  Type, Heading1, Heading2, Heading3, List, ListOrdered, 
  Quote, Code, ChevronRight, AlertCircle, Info, AlertTriangle,
  Bold, Italic, CheckSquare, Columns, Palette, Flag, FileText,
  Youtube, Image, Link, Minus, Highlighter, MoreHorizontal
} from 'lucide-react';

// Define our schema
type ToggleElement = {
  type: 'toggle';
  title: string;
  children: Descendant[];
};

type ParagraphElement = {
  type: 'paragraph';
  children: Descendant[];
};

type HeadingElement = {
  type: 'heading';
  level: 1 | 2 | 3;
  children: Descendant[];
};

type ListElement = {
  type: 'bulleted-list' | 'numbered-list';
  children: Descendant[];
};

type ListItemElement = {
  type: 'list-item';
  children: Descendant[];
};

type BlockQuoteElement = {
  type: 'block-quote';
  children: Descendant[];
};

type CodeBlockElement = {
  type: 'code-block';
  children: Descendant[];
};

type CalloutElement = {
  type: 'callout';
  variant: 'info' | 'warning' | 'error';
  children: Descendant[];
};

type ChecklistElement = {
  type: 'checklist';
  children: ChecklistItemElement[];
};

type ChecklistItemElement = {
  type: 'checklist-item';
  checked: boolean;
  children: Descendant[];
};

type ColumnsElement = {
  type: 'columns';
  columnCount: number;
  children: ColumnElement[];
};

type ColumnElement = {
  type: 'column';
  children: Descendant[];
};

type ColoredTextElement = {
  type: 'colored-text';
  color: string;
  children: Descendant[];
};

type BannerElement = {
  type: 'banner';
  backgroundColor: string;
  children: Descendant[];
};

type EmbedElement = {
  type: 'embed';
  embedType: 'youtube' | 'loom' | 'google-drive' | 'google-slides' | 'google-docs' | 'google-sheets';
  url: string;
  children: Descendant[];
};

type ImageElement = {
  type: 'image';
  url: string;
  alt?: string;
  children: Descendant[];
};

type LinkElement = {
  type: 'link';
  url: string;
  children: Descendant[];
};

type DividerElement = {
  type: 'divider';
  children: Descendant[];
};

type HighlightElement = {
  type: 'highlight';
  backgroundColor: string;
  children: Descendant[];
};

type CustomElement = 
  | ParagraphElement 
  | HeadingElement 
  | ListElement 
  | ListItemElement 
  | BlockQuoteElement 
  | CodeBlockElement
  | CalloutElement
  | ToggleElement
  | ChecklistElement
  | ChecklistItemElement
  | ColumnsElement
  | ColumnElement
  | ColoredTextElement
  | BannerElement
  | EmbedElement
  | ImageElement
  | LinkElement
  | DividerElement
  | HighlightElement;

type CustomText = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
};

declare module 'slate' {
  interface CustomTypes {
    Editor: ReactEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

// Helper functions
const isMarkActive = (editor: Editor, format: string) => {
  const marks = Editor.marks(editor);
  return marks ? (marks as any)[format] === true : false;
};

const toggleMark = (editor: Editor, format: string) => {
  const isActive = isMarkActive(editor, format);
  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

const isBlockActive = (editor: Editor, format: string) => {
  const nodeGen = Editor.nodes(editor, {
    match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === format,
  });
  let node = nodeGen.next();
  return !node.done;
};

const toggleBlock = (editor: Editor, format: string) => {
  const isActive = isBlockActive(editor, format);
  const isList = ['numbered-list', 'bulleted-list'].includes(format);

  Transforms.unwrapNodes(editor, {
    match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && ['numbered-list', 'bulleted-list'].includes(n.type),
    split: true,
  });

  const newProperties: Partial<SlateElement> = {
    type: isActive ? 'paragraph' : isList ? 'list-item' : format,
  } as Partial<SlateElement>;

  Transforms.setNodes<SlateElement>(editor, newProperties);

  if (!isActive && isList) {
    const block = { type: format, children: [] } as SlateElement;
    Transforms.wrapNodes(editor, block);
  }
};

// Slash command functionality
const SLASH_COMMANDS = [
  // Basic formatting
  { type: 'paragraph', title: 'Normal Text', icon: <FileText className="h-4 w-4" /> },
  { type: 'heading', level: 1, title: 'Heading 1', icon: <Heading1 className="h-4 w-4" /> },
  { type: 'heading', level: 2, title: 'Heading 2', icon: <Heading2 className="h-4 w-4" /> },
  { type: 'heading', level: 3, title: 'Heading 3', icon: <Heading3 className="h-4 w-4" /> },
  
  // Lists and organization
  { type: 'bulleted-list', title: 'Bullet List', icon: <List className="h-4 w-4" /> },
  { type: 'numbered-list', title: 'Numbered List', icon: <ListOrdered className="h-4 w-4" /> },
  { type: 'checklist', title: 'Checklist', icon: <CheckSquare className="h-4 w-4" /> },
  { type: 'checklist', title: 'To-Do List', icon: <CheckSquare className="h-4 w-4" /> },
  
  // Layout
  { type: 'columns', columnCount: 2, title: '2 Columns', icon: <Columns className="h-4 w-4" /> },
  { type: 'columns', columnCount: 3, title: '3 Columns', icon: <Columns className="h-4 w-4" /> },
  { type: 'columns', columnCount: 4, title: '4 Columns', icon: <Columns className="h-4 w-4" /> },
  { type: 'columns', columnCount: 5, title: '5 Columns', icon: <Columns className="h-4 w-4" /> },
  
  // Media and links
  { type: 'image', title: 'Image', icon: <Image className="h-4 w-4" /> },
  { type: 'link', title: 'Link', icon: <Link className="h-4 w-4" /> },
  { type: 'embed', embedType: 'youtube', title: 'YouTube Video', icon: <Youtube className="h-4 w-4" /> },
  { type: 'embed', embedType: 'loom', title: 'Loom Video', icon: <Youtube className="h-4 w-4" /> },
  { type: 'embed', embedType: 'google-drive', title: 'Google Drive', icon: <MoreHorizontal className="h-4 w-4" /> },
  { type: 'embed', embedType: 'google-slides', title: 'Google Slides', icon: <MoreHorizontal className="h-4 w-4" /> },
  { type: 'embed', embedType: 'google-docs', title: 'Google Docs', icon: <MoreHorizontal className="h-4 w-4" /> },
  { type: 'embed', embedType: 'google-sheets', title: 'Google Sheets', icon: <MoreHorizontal className="h-4 w-4" /> },
  
  // Styling
  { type: 'colored-text', color: 'red', title: 'Red Text', icon: <Palette className="h-4 w-4" /> },
  { type: 'colored-text', color: 'blue', title: 'Blue Text', icon: <Palette className="h-4 w-4" /> },
  { type: 'colored-text', color: 'green', title: 'Green Text', icon: <Palette className="h-4 w-4" /> },
  { type: 'colored-text', color: 'yellow', title: 'Yellow Text', icon: <Palette className="h-4 w-4" /> },
  { type: 'colored-text', color: 'purple', title: 'Purple Text', icon: <Palette className="h-4 w-4" /> },
  { type: 'highlight', backgroundColor: 'yellow', title: 'Yellow Highlight', icon: <Highlighter className="h-4 w-4" /> },
  { type: 'highlight', backgroundColor: 'green', title: 'Green Highlight', icon: <Highlighter className="h-4 w-4" /> },
  { type: 'highlight', backgroundColor: 'blue', title: 'Blue Highlight', icon: <Highlighter className="h-4 w-4" /> },
  { type: 'highlight', backgroundColor: 'pink', title: 'Pink Highlight', icon: <Highlighter className="h-4 w-4" /> },
  
  // Banners
  { type: 'banner', backgroundColor: 'blue', title: 'Blue Banner', icon: <Flag className="h-4 w-4" /> },
  { type: 'banner', backgroundColor: 'green', title: 'Green Banner', icon: <Flag className="h-4 w-4" /> },
  { type: 'banner', backgroundColor: 'yellow', title: 'Yellow Banner', icon: <Flag className="h-4 w-4" /> },
  { type: 'banner', backgroundColor: 'red', title: 'Red Banner', icon: <Flag className="h-4 w-4" /> },
  { type: 'banner', backgroundColor: 'purple', title: 'Purple Banner', icon: <Flag className="h-4 w-4" /> },
  
  // Other elements
  { type: 'divider', title: 'Divider', icon: <Minus className="h-4 w-4" /> },
  { type: 'block-quote', title: 'Quote', icon: <Quote className="h-4 w-4" /> },
  { type: 'code-block', title: 'Code Block', icon: <Code className="h-4 w-4" /> },
  { type: 'toggle', title: 'Toggle', icon: <ChevronRight className="h-4 w-4" /> },
  { type: 'callout', variant: 'info', title: 'Info Callout', icon: <Info className="h-4 w-4" /> },
  { type: 'callout', variant: 'warning', title: 'Warning Callout', icon: <AlertTriangle className="h-4 w-4" /> },
  { type: 'callout', variant: 'error', title: 'Error Callout', icon: <AlertCircle className="h-4 w-4" /> },
];

interface SlateEditorProps {
  value: Descendant[];
  onChange: (value: Descendant[]) => void;
  placeholder?: string;
}

export const SlateEditor: React.FC<SlateEditorProps> = ({ value, onChange, placeholder }) => {
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  
  // Ensure we always have a valid value
  const safeValue = useMemo(() => {
    if (!value || !Array.isArray(value) || value.length === 0) {
      return createEmptyDocument();
    }
    return value;
  }, [value]);

  // Sync editor content when value prop changes (only if editor is not focused)
  useEffect(() => {
    try {
      const isEditorFocused = ReactEditor.isFocused(editor);
      if (!isEditorFocused && safeValue && JSON.stringify(editor.children) !== JSON.stringify(safeValue)) {
        // Only update if the editor is not focused to avoid disrupting user typing
        Editor.withoutNormalizing(editor, () => {
          // Clear all content
          Transforms.select(editor, Editor.range(editor, []));
          Transforms.delete(editor);
          // Insert new content without aggressive filtering
          Transforms.insertNodes(editor, safeValue);
        });
      }
    } catch (error) {
      console.log('Content sync skipped:', error);
    }
  }, [safeValue, editor]);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 });
  const [filteredCommands, setFilteredCommands] = useState(SLASH_COMMANDS);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [slashQuery, setSlashQuery] = useState('');
  const [showSelectionToolbar, setShowSelectionToolbar] = useState(false);
  const [selectionToolbarPosition, setSelectionToolbarPosition] = useState({ top: 0, left: 0 });
  const editorRef = useRef<HTMLDivElement>(null);

  const renderElement = useCallback((props: any) => <Element {...props} />, []);
  const renderLeaf = useCallback((props: any) => <Leaf {...props} />, []);

  // Handle text selection for toolbar
  const handleSelectionChange = () => {
    const { selection } = editor;
    
    if (
      selection &&
      !Range.isCollapsed(selection) &&
      Editor.string(editor, selection).trim().length > 0
    ) {
      // Show selection toolbar
      try {
        const domRange = ReactEditor.toDOMRange(editor, selection);
        const rect = domRange.getBoundingClientRect();
        setSelectionToolbarPosition({
          top: rect.top - 50 + window.scrollY,
          left: rect.left + (rect.width / 2) + window.scrollX - 100 // Center the toolbar
        });
        setShowSelectionToolbar(true);
      } catch (error) {
        setShowSelectionToolbar(false);
      }
    } else {
      setShowSelectionToolbar(false);
    }
  };

  // Update selection toolbar when selection changes
  useEffect(() => {
    handleSelectionChange();
  }, [editor.selection]);

  // Handle filtering slash commands as user types
  const handleEditorChange = (newValue: Descendant[]) => {
    // Ensure document always ends with an empty paragraph for Enter key functionality
    const ensureTrailingParagraph = (value: Descendant[]): Descendant[] => {
      if (value.length === 0) return value;
      
      const lastNode = value[value.length - 1];
      
      // Check if last node is an empty paragraph
      const isLastNodeEmptyParagraph = (
        'type' in lastNode && 
        lastNode.type === 'paragraph' && 
        'children' in lastNode &&
        lastNode.children.length === 1 &&
        'text' in lastNode.children[0] &&
        lastNode.children[0].text === ''
      );
      
      // If last node is not an empty paragraph, add one
      if (!isLastNodeEmptyParagraph) {
        return [...value, { type: 'paragraph', children: [{ text: '' }] }];
      }
      
      return value;
    };
    
    const processedValue = ensureTrailingParagraph(newValue);
    onChange(processedValue);
    
    // Handle selection toolbar
    handleSelectionChange();
    
    // Check if we're typing after a slash
    if (showSlashMenu) {
      const { selection } = editor;
      if (selection && Range.isCollapsed(selection)) {
        const [start] = Range.edges(selection);
        const line = Editor.string(editor, {
          anchor: { path: start.path, offset: 0 },
          focus: start
        });
        
        // Find the last slash in the current line
        const lastSlashIndex = line.lastIndexOf('/');
        if (lastSlashIndex !== -1) {
          const query = line.slice(lastSlashIndex + 1).toLowerCase();
          setSlashQuery(query);
          
          // Filter commands based on query
          const filtered = SLASH_COMMANDS.filter(command => 
            command.title.toLowerCase().includes(query)
          );
          setFilteredCommands(filtered);
          setSelectedIndex(0); // Reset selection to first item
        }
      }
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Only handle slash menu when it's actually visible
    if (showSlashMenu) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedIndex(prev => prev === 0 ? filteredCommands.length - 1 : prev - 1);
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        if (filteredCommands[selectedIndex]) {
          executeCommand(filteredCommands[selectedIndex]);
        }
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        setShowSlashMenu(false);
        setSlashQuery('');
        setSelectedIndex(0);
        return;
      }
    }

    // Handle Enter key for better navigation, especially in headings
    if (event.key === 'Enter' && !showSlashMenu) {
      const { selection } = editor;
      if (selection && Range.isCollapsed(selection)) {
        try {
          const [node, path] = Editor.node(editor, selection);
          
          // Special handling for headings
          if (node.text !== undefined) {
            // We're in a text node, check if parent is a heading
            const parentPath = Path.parent(path);
            const parentNode = Editor.node(editor, parentPath)[0];
            
            if (SlateElement.isElement(parentNode) && parentNode.type === 'heading') {
              event.preventDefault();
              
              // If cursor is at the beginning of heading text, insert paragraph before
              if (selection.anchor.offset === 0) {
                const newParagraph = { type: 'paragraph', children: [{ text: '' }] };
                Transforms.insertNodes(editor, newParagraph, { at: parentPath });
                Transforms.select(editor, Editor.start(editor, parentPath));
                return;
              }
              
              // If cursor is at the end of heading text, insert paragraph after
              if (selection.anchor.offset === node.text.length) {
                const nextPath = Path.next(parentPath);
                const newParagraph = { type: 'paragraph', children: [{ text: '' }] };
                Transforms.insertNodes(editor, newParagraph, { at: nextPath });
                Transforms.select(editor, Editor.start(editor, nextPath));
                return;
              }
              
              // If cursor is in middle of heading text, split the heading
              const beforeText = node.text.slice(0, selection.anchor.offset);
              const afterText = node.text.slice(selection.anchor.offset);
              
              // Update current heading with text before cursor
              Transforms.insertText(editor, beforeText, { at: Editor.start(editor, parentPath) });
              Transforms.delete(editor, { at: Editor.end(editor, parentPath) });
              
              // Insert new paragraph with text after cursor
              const nextPath = Path.next(parentPath);
              const newParagraph = { type: 'paragraph', children: [{ text: afterText }] };
              Transforms.insertNodes(editor, newParagraph, { at: nextPath });
              Transforms.select(editor, Editor.start(editor, nextPath));
              return;
            }
          }
          
          // Handle void elements (embeds, images, dividers)
          if (SlateElement.isElement(node) && ['embed', 'image', 'divider'].includes(node.type)) {
            event.preventDefault();
            
            const nextPath = Path.next(path);
            const newParagraph = { type: 'paragraph', children: [{ text: '' }] };
            Transforms.insertNodes(editor, newParagraph, { at: nextPath });
            Transforms.select(editor, Editor.start(editor, nextPath));
            return;
          }
        } catch (error) {
          // If there's any error, let default behavior handle it
          console.warn('Error in Enter key handling:', error);
        }
      }
    }


    // Handle slash commands
    if (event.key === '/') {
      const { selection } = editor;
      if (selection && Range.isCollapsed(selection)) {
        setShowSlashMenu(true);
        setFilteredCommands(SLASH_COMMANDS);
        setSlashQuery('');
        setSelectedIndex(0);
        
        // Calculate position for slash menu
        try {
          const domRange = ReactEditor.toDOMRange(editor, selection);
          const rect = domRange.getBoundingClientRect();
          setSlashMenuPosition({
            top: rect.bottom + window.scrollY + 5,
            left: rect.left + window.scrollX
          });
        } catch (error) {
          // Fallback position
          setSlashMenuPosition({ top: 100, left: 100 });
        }
      }
    }

    // Bold
    if (event.key === 'b' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      toggleMark(editor, 'bold');
      return;
    }

    // Italic
    if (event.key === 'i' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      toggleMark(editor, 'italic');
      return;
    }

    // For all other keys, let Slate handle them naturally
  };

  // Formatting functions for selection toolbar
  const formatBold = () => {
    toggleMark(editor, 'bold');
    ReactEditor.focus(editor);
  };

  const formatItalic = () => {
    toggleMark(editor, 'italic');
    ReactEditor.focus(editor);
  };

  const formatHeading = (level: 1 | 2 | 3) => {
    toggleBlock(editor, 'heading');
    Transforms.setNodes(editor, { level } as Partial<SlateElement>);
    ReactEditor.focus(editor);
  };

  // Check if mark is active
  const isMarkActive = (mark: string) => {
    const marks = Editor.marks(editor);
    return marks ? (marks as any)[mark] === true : false;
  };

  // Check if block is active
  const isBlockActive = (blockType: string) => {
    const { selection } = editor;
    if (!selection) return false;

    const [match] = Array.from(
      Editor.nodes(editor, {
        at: Editor.unhangRange(editor, selection),
        match: n =>
          !Editor.isEditor(n) &&
          SlateElement.isElement(n) &&
          n.type === blockType,
      })
    );

    return !!match;
  };

  const executeCommand = (command: any) => {
    setShowSlashMenu(false);
    setSlashQuery('');
    setSelectedIndex(0);
    
    // Remove the "/" character and any typed query
    const { selection } = editor;
    if (selection) {
      const [start] = Range.edges(selection);
      const before = Editor.before(editor, start);
      if (before) {
        // Delete the slash and any characters typed after it
        const deleteDistance = 1 + slashQuery.length;
        Transforms.delete(editor, { at: before, distance: deleteDistance, unit: 'character' });
      }
    }

    // Handle different command types
    switch (command.type) {
      case 'paragraph':
        // Convert to normal paragraph
        Transforms.setNodes(editor, { type: 'paragraph' } as Partial<SlateElement>);
        break;

      case 'heading':
        // Insert heading
        toggleBlock(editor, 'heading');
        Transforms.setNodes(editor, { level: command.level } as Partial<SlateElement>);
        break;

      case 'checklist':
        // Insert checklist with one item
        const checklistBlock: ChecklistElement = {
          type: 'checklist',
          children: [
            {
              type: 'checklist-item',
              checked: false,
              children: [{ text: 'New checklist item' }]
            }
          ]
        };
        Transforms.insertNodes(editor, checklistBlock);
        break;

      case 'columns':
        // Insert columns layout
        const columns: ColumnElement[] = Array.from({ length: command.columnCount }, (_, i) => ({
          type: 'column',
          children: [{ type: 'paragraph', children: [{ text: `Column ${i + 1}` }] }]
        }));
        
        const columnsBlock: ColumnsElement = {
          type: 'columns',
          columnCount: command.columnCount,
          children: columns
        };
        Transforms.insertNodes(editor, columnsBlock);
        break;

      case 'colored-text':
        // Insert colored text
        const coloredTextBlock: ColoredTextElement = {
          type: 'colored-text',
          color: command.color,
          children: [{ text: `${command.color} text` }]
        };
        Transforms.insertNodes(editor, coloredTextBlock);
        break;

      case 'banner':
        // Insert banner
        const bannerBlock: BannerElement = {
          type: 'banner',
          backgroundColor: command.backgroundColor,
          children: [{ type: 'paragraph', children: [{ text: 'Your banner content here...' }] }]
        };
        Transforms.insertNodes(editor, bannerBlock);
        break;

      case 'embed':
        // Insert embed - will prompt for URL
        const embedUrl = prompt(`Enter ${command.title} URL:`);
        if (embedUrl) {
          const embedBlock: EmbedElement = {
            type: 'embed',
            embedType: command.embedType,
            url: embedUrl,
            children: [{ text: '' }]
          };
          Transforms.insertNodes(editor, embedBlock);
        }
        break;

      case 'image':
        // Insert image - will prompt for URL
        const imageUrl = prompt('Enter image URL:');
        const imageAlt = prompt('Enter image description (optional):') || '';
        if (imageUrl) {
          const imageBlock: ImageElement = {
            type: 'image',
            url: imageUrl,
            alt: imageAlt,
            children: [{ text: '' }]
          };
          Transforms.insertNodes(editor, imageBlock);
        }
        break;

      case 'link':
        // Insert link - will prompt for URL and text
        const linkUrl = prompt('Enter link URL:');
        const linkText = prompt('Enter link text:') || 'Link';
        if (linkUrl) {
          const linkBlock: LinkElement = {
            type: 'link',
            url: linkUrl,
            children: [{ text: linkText }]
          };
          Transforms.insertNodes(editor, linkBlock);
        }
        break;

      case 'divider':
        // Insert divider
        const dividerBlock: DividerElement = {
          type: 'divider',
          children: [{ text: '' }]
        };
        Transforms.insertNodes(editor, dividerBlock);
        break;

      case 'highlight':
        // Insert highlighted text
        const highlightBlock: HighlightElement = {
          type: 'highlight',
          backgroundColor: command.backgroundColor,
          children: [{ text: 'Highlighted text' }]
        };
        Transforms.insertNodes(editor, highlightBlock);
        break;

      case 'toggle':
        // Insert toggle block
        const toggleElement: ToggleElement = {
          type: 'toggle',
          title: 'Toggle Section',
          children: [{ type: 'paragraph', children: [{ text: 'Type your hidden content here...' }] }]
        };
        Transforms.insertNodes(editor, toggleElement);
        break;

      case 'callout':
        // Insert callout block
        const calloutBlock: CalloutElement = {
          type: 'callout',
          variant: command.variant,
          children: [{ type: 'paragraph', children: [{ text: 'Type your callout content here...' }] }]
        };
        Transforms.insertNodes(editor, calloutBlock);
        break;

      default:
        // Handle basic block types (bulleted-list, numbered-list, block-quote, code-block)
        toggleBlock(editor, command.type);
        break;
    }
  };

  return (
    <div className="slate-editor-container" ref={editorRef} data-slate-editor>
      <Slate editor={editor} initialValue={safeValue} onValueChange={handleEditorChange}>
        <Editable
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          placeholder={placeholder || "Type '/' for commands..."}
          onKeyDown={handleKeyDown}
          className="slate-editor first:mt-0 [&>*:first-child]:mt-0"
          data-slate-editable
          style={{
            minHeight: '200px',
            padding: '1rem',
            borderRadius: '0.5rem',
            outline: 'none'
          }}
        />
      </Slate>

      {/* Slash Menu */}
      {showSlashMenu && (
        <div
          className="slash-menu"
          style={{
            position: 'absolute',
            top: slashMenuPosition.top,
            left: slashMenuPosition.left,
            zIndex: 1000,
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            maxHeight: '300px',
            overflowY: 'auto',
            minWidth: '200px'
          }}
        >
          {filteredCommands.map((command, index) => (
            <button
              key={index}
              className={`w-full text-left px-3 py-2 flex items-center gap-2 transition-colors ${
                index === selectedIndex 
                  ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-500' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => executeCommand(command)}
            >
              {command.icon}
              <span>{command.title}</span>
            </button>
          ))}
          {filteredCommands.length === 0 && (
            <div className="px-3 py-2 text-gray-500 text-sm">
              No commands found for "{slashQuery}"
            </div>
          )}
        </div>
      )}

      {/* Selection Toolbar */}
      {showSelectionToolbar && (
        <div
          className="selection-toolbar"
          style={{
            position: 'absolute',
            top: selectionToolbarPosition.top,
            left: selectionToolbarPosition.left,
            zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.9)',
            border: '1px solid #374151',
            borderRadius: '0.5rem',
            padding: '0.5rem',
            display: 'flex',
            gap: '0.25rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
          }}
        >
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              formatBold();
            }}
            className={`p-1.5 rounded transition-colors ${
              isMarkActive('bold') 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              formatItalic();
            }}
            className={`p-1.5 rounded transition-colors ${
              isMarkActive('italic') 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </button>
          <div className="w-px bg-gray-600 mx-1" />
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              formatHeading(1);
            }}
            className={`p-1.5 rounded transition-colors ${
              isBlockActive('heading') 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              formatHeading(2);
            }}
            className="p-1.5 rounded text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              formatHeading(3);
            }}
            className="p-1.5 rounded text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
            title="Heading 3"
          >
            <Heading3 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

// Element renderer
const Element = (props: any) => {
  const { attributes, children, element } = props;

  // Check if element is effectively empty (only contains empty text nodes)
  const isElementEmpty = (elem: any): boolean => {
    if (!elem.children || elem.children.length === 0) return true;
    return elem.children.every((child: any) => 
      (child.text === '' || child.text === '\uFEFF') && !child.bold && !child.italic
    );
  };

  switch (element.type) {
    case 'heading':
      // Skip rendering empty headings
      if (isElementEmpty(element)) {
        return null;
      }
      const level = element.level || 1; // Default to h1 if level is missing
      const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
      return (
        <HeadingTag {...attributes} className={`text-${level === 1 ? '2xl' : level === 2 ? 'xl' : 'lg'} font-bold my-4`}>
          {children}
        </HeadingTag>
      );
    case 'block-quote':
      return (
        <blockquote {...attributes} className="border-l-4 border-gray-300 pl-4 my-4 italic text-gray-600">
          {children}
        </blockquote>
      );
    case 'bulleted-list':
      return (
        <ul {...attributes} className="list-disc list-inside my-4">
          {children}
        </ul>
      );
    case 'numbered-list':
      return (
        <ol {...attributes} className="list-decimal list-inside my-4">
          {children}
        </ol>
      );
    case 'list-item':
      return <li {...attributes}>{children}</li>;
    case 'code-block':
      return (
        <pre {...attributes} className="bg-gray-900 text-white p-4 rounded-md my-4 overflow-x-auto">
          <code>{children}</code>
        </pre>
      );
    case 'callout':
      const variants = {
        info: 'bg-blue-50 border-blue-200 text-blue-800',
        warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        error: 'bg-red-50 border-red-200 text-red-800'
      };
      return (
        <div {...attributes} className={`border-l-4 p-4 my-4 rounded-r-md ${variants[element.variant as keyof typeof variants]}`}>
          {children}
        </div>
      );
    case 'toggle':
      return <ToggleBlock {...props} />;
    
    case 'checklist':
      return (
        <div {...attributes} className="checklist my-4">
          {children}
        </div>
      );
    
    case 'checklist-item':
      return <ChecklistItem {...props} />;
    
    case 'columns':
      return <ColumnsBlock {...props} />;
    
    case 'column':
      return (
        <div {...attributes} className="column flex-1 px-2">
          {children}
        </div>
      );
    
    case 'colored-text':
      return (
        <span {...attributes} style={{ color: element.color }} className="inline">
          {children}
        </span>
      );
    
    case 'banner':
      const bannerColors = {
        blue: 'bg-blue-100 border-blue-300 text-blue-900',
        green: 'bg-green-100 border-green-300 text-green-900',
        yellow: 'bg-yellow-100 border-yellow-300 text-yellow-900',
        red: 'bg-red-100 border-red-300 text-red-900',
        purple: 'bg-purple-100 border-purple-300 text-purple-900'
      };
      return (
        <div {...attributes} className={`banner border-l-4 p-4 my-4 rounded-r-md ${bannerColors[element.backgroundColor as keyof typeof bannerColors] || 'bg-gray-100 border-gray-300 text-gray-900'}`}>
          {children}
        </div>
      );
    
    case 'embed':
      return <EmbedBlock {...props} />;
    
    case 'image':
      return (
        <div {...attributes} className="image-block my-4">
          <img 
            src={element.url} 
            alt={element.alt || ''} 
            className="max-w-full h-auto rounded-md shadow-sm"
            contentEditable={false}
          />
          <div className="mt-2 text-sm text-gray-500">{children}</div>
        </div>
      );
    
    case 'link':
      return (
        <a 
          {...attributes} 
          href={element.url} 
          className="text-blue-600 underline hover:text-blue-800"
          target="_blank"
          rel="noopener noreferrer"
        >
          {children}
        </a>
      );
    
    case 'divider':
      return (
        <div {...attributes} className="divider my-6">
          <hr className="border-gray-300" />
          <span className="sr-only">{children}</span>
        </div>
      );
    
    case 'highlight':
      const highlightColors = {
        yellow: 'bg-yellow-200',
        green: 'bg-green-200',
        blue: 'bg-blue-200',
        pink: 'bg-pink-200'
      };
      return (
        <span {...attributes} className={`highlight px-1 rounded ${highlightColors[element.backgroundColor as keyof typeof highlightColors] || 'bg-yellow-200'}`}>
          {children}
        </span>
      );
    
    default:
      return (
        <p {...attributes} className="my-2">
          {children}
        </p>
      );
  }
};

// Toggle block component
const ToggleBlock = ({ attributes, children, element }: any) => {
  const editor = useSlateStatic();
  const path = ReactEditor.findPath(editor, element);
  const [isOpen, setIsOpen] = useState(element.isOpen !== undefined ? element.isOpen : true);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(element.title || 'Click to toggle');
  const [showContentForEditing, setShowContentForEditing] = useState(false);

  const handleTitleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingTitle(true);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const saveTitle = () => {
    setIsEditingTitle(false);
    // Update the actual element in the editor
    Transforms.setNodes(editor, { title } as Partial<ToggleElement>, { at: path });
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      saveTitle();
    }
  };

  const handleTitleBlur = () => {
    saveTitle();
  };

  const handleToggle = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    // Save the toggle state to the element
    Transforms.setNodes(editor, { isOpen: newIsOpen } as Partial<ToggleElement>, { at: path });
  };

  const shouldShowContent = isOpen || showContentForEditing;

  return (
    <div {...attributes} className="toggle-block my-4">
      <div
        className="toggle-header p-2 flex items-center gap-2"
        contentEditable={false}
      >
        <ChevronRight 
          className={`h-4 w-4 transition-transform cursor-pointer ${isOpen ? 'rotate-90' : ''}`} 
          onClick={handleToggle}
        />
        {isEditingTitle ? (
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            onKeyDown={handleTitleKeyDown}
            onBlur={handleTitleBlur}
            className="font-medium bg-transparent border-none outline-none flex-1"
            autoFocus
          />
        ) : (
          <span 
            className="font-medium cursor-text flex-1"
            onClick={handleTitleClick}
          >
            {title}
          </span>
        )}
        <div className="flex items-center gap-2">
          {!isOpen && !showContentForEditing && (
            <button
              className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setShowContentForEditing(true);
              }}
            >
              Edit Content
            </button>
          )}
          <span 
            className="text-xs text-gray-400 cursor-pointer hover:text-gray-600"
            onClick={handleToggle}
          >
            {isOpen ? 'Hide' : 'Show'}
          </span>
        </div>
      </div>
      {shouldShowContent && (
        <div className={`toggle-content mt-2 pl-6 ${!isOpen ? 'p-3' : ''}`}>
          {!isOpen && showContentForEditing && (
            <div className="mb-2 text-xs text-gray-500 flex items-center gap-2">
              Editing collapsed content
              <button
                className="text-blue-600 hover:text-blue-800"
                onClick={() => setShowContentForEditing(false)}
              >
                Done
              </button>
            </div>
          )}
          {children}
        </div>
      )}
    </div>
  );
};

// Checklist item component
const ChecklistItem = ({ attributes, children, element }: any) => {
  const [checked, setChecked] = useState(element.checked || false);

  const handleCheckChange = () => {
    setChecked(!checked);
    // In a real implementation, you'd update the editor state here
  };

  return (
    <div {...attributes} className="checklist-item flex items-start gap-2 my-1">
      <input
        type="checkbox"
        checked={checked}
        onChange={handleCheckChange}
        className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        contentEditable={false}
      />
      <div className={`flex-1 ${checked ? 'line-through text-gray-500' : ''}`}>
        {children}
      </div>
    </div>
  );
};

// Columns block component
const ColumnsBlock = ({ attributes, children, element }: any) => {
  return (
    <div {...attributes} className="columns-block my-4">
      <div className="flex gap-4">
        {children}
      </div>
    </div>
  );
};

// Embed block component
const EmbedBlock = ({ attributes, children, element }: any) => {
  const { url, embedType } = element;

  const renderEmbed = () => {
    if (embedType === 'youtube') {
      // Extract YouTube video ID from URL
      const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
      if (videoId) {
        return (
          <iframe
            width="100%"
            height="315"
            src={`https://www.youtube.com/embed/${videoId}`}
            title="YouTube video"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="rounded-md"
          />
        );
      }
    } else if (embedType === 'loom') {
      const loomId = url.match(/loom\.com\/share\/([^/?]+)/)?.[1];
      if (loomId) {
        return (
          <iframe
            width="100%"
            height="315"
            src={`https://www.loom.com/embed/${loomId}`}
            title="Loom video"
            frameBorder="0"
            allowFullScreen
            className="rounded-md"
          />
        );
      }
    } else if (embedType.startsWith('google-')) {
      // Generic Google embed handling
      return (
        <iframe
          width="100%"
          height="400"
          src={url}
          title={`${embedType} embed`}
          frameBorder="0"
          allowFullScreen
          className="rounded-md"
        />
      );
    }

    // Fallback for unsupported embeds
    return (
      <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
        <p className="text-gray-600">
          <strong>{embedType} Embed</strong>
        </p>
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 underline hover:text-blue-800 text-sm"
        >
          {url}
        </a>
      </div>
    );
  };

  return (
    <div {...attributes} className="embed-block my-4">
      <div contentEditable={false} className="relative">
        {renderEmbed()}
      </div>
      <div style={{ height: 0, overflow: 'hidden' }}>{children}</div>
    </div>
  );
};

// Leaf renderer for text formatting
const Leaf = ({ attributes, children, leaf }: any) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }

  if (leaf.italic) {
    children = <em>{children}</em>;
  }

  if (leaf.code) {
    children = <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">{children}</code>;
  }

  return <span {...attributes}>{children}</span>;
};

// Default initial value - starts with heading and ends with paragraph for proper Enter key behavior
export const createEmptyDocument = (): Descendant[] => [
  {
    type: 'heading',
    level: 1,
    children: [{ text: 'Untitled' }],
  },
  {
    type: 'paragraph',
    children: [{ text: '' }],
  },
];