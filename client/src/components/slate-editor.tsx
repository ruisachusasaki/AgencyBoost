import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { createEditor, Descendant, Element as SlateElement, Transforms, Editor, Point, Range } from 'slate';
import { Slate, Editable, withReact, ReactEditor } from 'slate-react';
import { withHistory } from 'slate-history';
import { 
  Type, Heading1, Heading2, Heading3, List, ListOrdered, 
  Quote, Code, ChevronRight, AlertCircle, Info, AlertTriangle,
  Bold, Italic
} from 'lucide-react';

// Define our schema
type ToggleElement = {
  type: 'toggle';
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

type CustomElement = 
  | ParagraphElement 
  | HeadingElement 
  | ListElement 
  | ListItemElement 
  | BlockQuoteElement 
  | CodeBlockElement
  | CalloutElement
  | ToggleElement;

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
  return marks ? marks[format] === true : false;
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
  { type: 'heading', level: 1, title: 'Heading 1', icon: <Heading1 className="h-4 w-4" /> },
  { type: 'heading', level: 2, title: 'Heading 2', icon: <Heading2 className="h-4 w-4" /> },
  { type: 'heading', level: 3, title: 'Heading 3', icon: <Heading3 className="h-4 w-4" /> },
  { type: 'bulleted-list', title: 'Bullet List', icon: <List className="h-4 w-4" /> },
  { type: 'numbered-list', title: 'Numbered List', icon: <ListOrdered className="h-4 w-4" /> },
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
    onChange(newValue);
    
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
    // Handle slash menu navigation
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
    }

    // Italic
    if (event.key === 'i' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      toggleMark(editor, 'italic');
    }
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
    return marks ? marks[mark] === true : false;
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

    if (command.type === 'toggle') {
      // Insert toggle block
      const toggleBlock: ToggleElement = {
        type: 'toggle',
        children: [{ type: 'paragraph', children: [{ text: 'Click to toggle' }] }]
      };
      Transforms.insertNodes(editor, toggleBlock);
    } else if (command.type === 'callout') {
      // Insert callout block
      const calloutBlock: CalloutElement = {
        type: 'callout',
        variant: command.variant,
        children: [{ type: 'paragraph', children: [{ text: 'Type your callout content here...' }] }]
      };
      Transforms.insertNodes(editor, calloutBlock);
    } else if (command.type === 'heading') {
      // Insert heading
      toggleBlock(editor, 'heading');
      Transforms.setNodes(editor, { level: command.level } as Partial<SlateElement>);
    } else {
      // Other block types
      toggleBlock(editor, command.type);
    }
  };

  return (
    <div className="slate-editor-container" ref={editorRef}>
      <Slate editor={editor} value={value} onValueChange={handleEditorChange}>
        <Editable
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          placeholder={placeholder || "Type '/' for commands..."}
          onKeyDown={handleKeyDown}
          className="slate-editor"
          style={{
            minHeight: '200px',
            padding: '1rem',
            border: '1px solid #e5e7eb',
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

  switch (element.type) {
    case 'heading':
      const HeadingTag = `h${element.level}` as keyof JSX.IntrinsicElements;
      return (
        <HeadingTag {...attributes} className={`text-${element.level === 1 ? '2xl' : element.level === 2 ? 'xl' : 'lg'} font-bold my-4`}>
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
        <div {...attributes} className={`border-l-4 p-4 my-4 rounded-r-md ${variants[element.variant]}`}>
          {children}
        </div>
      );
    case 'toggle':
      return <ToggleBlock {...props} />;
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
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div {...attributes} className="toggle-block my-4">
      <div
        className="toggle-header cursor-pointer bg-gray-50 border border-gray-200 rounded-md p-3 flex items-center gap-2 hover:bg-gray-100 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        contentEditable={false}
      >
        <ChevronRight 
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} 
        />
        <span className="font-medium">
          {element.children[0]?.children[0]?.text || 'Click to toggle'}
        </span>
      </div>
      {isOpen && (
        <div className="toggle-content mt-2 pl-6 border-l-2 border-gray-200">
          {children}
        </div>
      )}
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

// Default initial value
export const createEmptyDocument = (): Descendant[] => [
  {
    type: 'paragraph',
    children: [{ text: '' }],
  },
];