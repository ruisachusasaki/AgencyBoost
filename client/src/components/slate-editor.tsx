import React, { useMemo, useState, useCallback } from 'react';
import { createEditor, Descendant, Element as SlateElement, Transforms, Editor, Point, Range } from 'slate';
import { Slate, Editable, withReact, ReactEditor } from 'slate-react';
import { withHistory } from 'slate-history';
import { 
  Type, Heading1, Heading2, Heading3, List, ListOrdered, 
  Quote, Code, ChevronRight, AlertCircle, Info, AlertTriangle
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

  const renderElement = useCallback((props: any) => <Element {...props} />, []);
  const renderLeaf = useCallback((props: any) => <Leaf {...props} />, []);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Handle slash commands
    if (event.key === '/') {
      const { selection } = editor;
      if (selection && Range.isCollapsed(selection)) {
        setShowSlashMenu(true);
        setFilteredCommands(SLASH_COMMANDS);
        
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

    // Hide slash menu on Escape
    if (event.key === 'Escape') {
      setShowSlashMenu(false);
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

  const executeCommand = (command: any) => {
    setShowSlashMenu(false);
    
    // Remove the "/" character
    const { selection } = editor;
    if (selection) {
      const [start] = Range.edges(selection);
      const before = Editor.before(editor, start);
      if (before) {
        Transforms.delete(editor, { at: before, distance: 1, unit: 'character' });
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
    <div className="slate-editor-container">
      <Slate editor={editor} initialValue={value} onValueChange={onChange}>
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
              className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2"
              onClick={() => executeCommand(command)}
            >
              {command.icon}
              <span>{command.title}</span>
            </button>
          ))}
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