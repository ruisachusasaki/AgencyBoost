import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { createEditor, Descendant, Element as SlateElement, Transforms, Editor, Point, Range, Path, Text } from 'slate';
import { Slate, Editable, withReact, ReactEditor, useSlateStatic } from 'slate-react';
import { withHistory } from 'slate-history';
import { 
  Type, Heading1, Heading2, Heading3, List, ListOrdered, 
  Quote, Code, ChevronRight, AlertCircle, Info, AlertTriangle,
  Bold, Italic, Underline, CheckSquare, Columns, Palette, Flag, FileText,
  Youtube, Image, Link, Minus, Highlighter, MoreHorizontal, Table2, Plus, Trash2, Upload, Loader2
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  widthPx?: number;
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

type TableElement = {
  type: 'table';
  children: TableRowElement[];
};

type TableRowElement = {
  type: 'table-row';
  children: TableCellElement[];
};

type TableCellElement = {
  type: 'table-cell';
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
  | HighlightElement
  | TableElement
  | TableRowElement
  | TableCellElement;

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

  Transforms.setNodes<SlateElement>(editor, newProperties, {
    match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && Editor.isBlock(editor, n),
    mode: 'lowest',
  });

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
  
  // Text styling
  { type: 'bold', title: 'Bold', icon: <Bold className="h-4 w-4" /> },
  { type: 'italic', title: 'Italic', icon: <Italic className="h-4 w-4" /> },
  { type: 'underline', title: 'Underline', icon: <Underline className="h-4 w-4" /> },
  
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
  { type: 'table', title: 'Table', icon: <Table2 className="h-4 w-4" /> },
  
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
  readOnly?: boolean;
}

// Custom editor with inline and void element handling
const withInlines = (editor: Editor) => {
  const { isInline, isVoid } = editor;

  // Links and highlights are inline elements
  editor.isInline = (element) => {
    return ['link', 'highlight'].includes(element.type) ? true : isInline(element);
  };

  // Images, embeds, and dividers are void elements
  editor.isVoid = (element) => {
    return ['image', 'embed', 'divider'].includes(element.type) ? true : isVoid(element);
  };

  return editor;
};

export const SlateEditor: React.FC<SlateEditorProps> = ({ value, onChange, placeholder, readOnly = false }) => {
  const editor = useMemo(() => withInlines(withHistory(withReact(createEditor()))), []);
  
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
        Editor.withoutNormalizing(editor, () => {
          // Remove all existing nodes safely
          while (editor.children.length > 0) {
            Transforms.removeNodes(editor, { at: [0] });
          }
          // Insert new content
          Transforms.insertNodes(editor, safeValue, { at: [0] });
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
  const slashSelectionRef = useRef<Range | null>(null);
  const [showSelectionToolbar, setShowSelectionToolbar] = useState(false);
  const [selectionToolbarPosition, setSelectionToolbarPosition] = useState({ top: 0, left: 0 });
  const editorRef = useRef<HTMLDivElement>(null);
  
  // URL input dialog state - includes saved selection for proper inline insertion
  const [urlDialog, setUrlDialog] = useState<{
    open: boolean;
    type: 'embed' | 'image' | 'link' | null;
    embedType?: string;
    title: string;
    url: string;
    altText: string;
    linkText: string;
    savedSelection: Range | null;
    imageMode: 'url' | 'upload';
    isUploading: boolean;
  }>({ open: false, type: null, title: '', url: '', altText: '', linkText: '', savedSelection: null, imageMode: 'url', isUploading: false });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle image file upload
  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      console.error('Please select an image file');
      return;
    }
    
    setUrlDialog(prev => ({ ...prev, isUploading: true }));
    
    try {
      // Get upload URL from server
      const uploadResponse = await fetch('/api/objects/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Failed to get upload URL');
      }
      
      const { uploadURL } = await uploadResponse.json();
      
      // Upload file directly to object storage
      const uploadFileResponse = await fetch(uploadURL, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      
      if (!uploadFileResponse.ok) {
        throw new Error('Failed to upload image');
      }
      
      // Extract the object path from the signed URL and convert to our endpoint
      // The uploadURL format: https://storage.googleapis.com/bucket-name/.private/uploads/uuid?signature...
      // We need to convert it to: /objects/uploads/uuid (no /api prefix)
      const url = new URL(uploadURL);
      const pathParts = url.pathname.split('/');
      // Find the uploads/ part and everything after
      const uploadsIndex = pathParts.findIndex(part => part === 'uploads');
      if (uploadsIndex !== -1) {
        const objectPath = pathParts.slice(uploadsIndex).join('/');
        const imageUrl = `/objects/${objectPath}`;
        setUrlDialog(prev => ({ ...prev, url: imageUrl, isUploading: false }));
      } else {
        throw new Error('Invalid upload URL format');
      }
    } catch (error) {
      console.error('Image upload failed:', error);
      setUrlDialog(prev => ({ ...prev, isUploading: false }));
    }
  };

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
        slashSelectionRef.current = selection;
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
          setSelectedIndex(0);
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
          
          // Handle Enter inside banner/callout containers — insert new paragraph within the container
          if (node.text !== undefined) {
            const ancestors = Array.from(Editor.nodes(editor, {
              at: selection,
              match: n => SlateElement.isElement(n) && (n.type === 'banner' || n.type === 'callout'),
            }));
            if (ancestors.length > 0) {
              event.preventDefault();
              Transforms.splitNodes(editor, { always: true });
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


    // Handle Tab key for indenting/nesting list items
    // Uses simple wrap/unwrap approach for reliable multi-level nesting
    if (event.key === 'Tab') {
      const { selection } = editor;
      if (selection) {
        // Check if we're inside a list
        const [listMatch] = Editor.nodes(editor, {
          match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && 
            (n.type === 'bulleted-list' || n.type === 'numbered-list'),
          mode: 'lowest',
        });
        
        if (listMatch) {
          event.preventDefault();
          const [listNode] = listMatch;
          const listType = (listNode as any).type;
          
          // Get the current list-item
          const [listItemMatch] = Editor.nodes(editor, {
            match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === 'list-item',
            mode: 'lowest',
          });
          
          if (listItemMatch) {
            const [, listItemPath] = listItemMatch;
            
            if (event.shiftKey) {
              // Shift+Tab: Outdent - try to lift out of nested list
              // Count how many lists we're nested in
              const allLists = Array.from(Editor.nodes(editor, {
                match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && 
                  (n.type === 'bulleted-list' || n.type === 'numbered-list'),
              }));
              
              if (allLists.length > 1) {
                // We're nested - lift out one level
                Transforms.liftNodes(editor, { at: listItemPath });
              } else {
                // At top level - unwrap from list and list-item to become paragraph
                Editor.withoutNormalizing(editor, () => {
                  Transforms.setNodes(
                    editor,
                    { type: 'paragraph' } as any,
                    { 
                      match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === 'list-item',
                      mode: 'lowest'
                    }
                  );
                  Transforms.liftNodes(editor, {
                    match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === 'paragraph',
                    mode: 'lowest'
                  });
                });
              }
            } else {
              // Tab: Indent - wrap in a new nested list of same type
              // This creates proper multi-level nesting structure
              const newList = { type: listType, children: [] };
              Transforms.wrapNodes(editor, newList as any, { 
                match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === 'list-item',
                mode: 'lowest'
              });
            }
            return;
          }
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
        
        try {
          const domSel = window.getSelection();
          let posTop = 200;
          let posLeft = 200;

          if (domSel && domSel.rangeCount > 0) {
            const range = domSel.getRangeAt(0);
            const rect = range.getBoundingClientRect();

            if (rect.top > 0 || rect.left > 0 || rect.height > 0) {
              posTop = rect.bottom + 5;
              posLeft = rect.left;
            } else {
              const node = range.startContainer;
              const el = node.nodeType === Node.ELEMENT_NODE ? node as Element : node.parentElement;
              if (el) {
                const elRect = el.getBoundingClientRect();
                posTop = elRect.bottom + 5;
                posLeft = elRect.left;
              } else if (editorRef.current) {
                const editorRect = editorRef.current.getBoundingClientRect();
                posTop = editorRect.top + 100;
                posLeft = editorRect.left + 20;
              }
            }
          }

          const menuHeight = 300;
          const menuWidth = 200;
          if (posTop + menuHeight > window.innerHeight) {
            posTop = Math.max(10, posTop - menuHeight - 30);
          }
          if (posLeft + menuWidth > window.innerWidth) {
            posLeft = Math.max(10, window.innerWidth - menuWidth - 10);
          }
          posTop = Math.max(10, posTop);
          posLeft = Math.max(10, posLeft);

          setSlashMenuPosition({ top: posTop, left: posLeft });
        } catch (error) {
          setSlashMenuPosition({ top: 200, left: 200 });
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
    // First unwrap from any list wrappers
    Transforms.unwrapNodes(editor, {
      match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && ['numbered-list', 'bulleted-list'].includes(n.type),
      split: true,
    });
    // Set both type and level in one operation to avoid toggle issues
    Transforms.setNodes<SlateElement>(editor, { type: 'heading', level } as Partial<SlateElement>, {
      match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && Editor.isBlock(editor, n),
      mode: 'lowest',
    });
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
    const queryLen = slashQuery.length;
    setSlashQuery('');
    setSelectedIndex(0);
    
    // Restore editor focus and selection if lost (e.g. from clicking menu)
    ReactEditor.focus(editor);
    const sel = editor.selection || slashSelectionRef.current;
    if (sel) {
      Transforms.select(editor, sel);
    }
    slashSelectionRef.current = null;
    
    // Remove the "/" character and any typed query
    const currentSel = editor.selection;
    if (currentSel && Range.isCollapsed(currentSel)) {
      const [start] = Range.edges(currentSel);
      const totalToDelete = 1 + queryLen;
      const deleteFrom = { path: start.path, offset: Math.max(0, start.offset - totalToDelete) };
      Transforms.delete(editor, {
        at: { anchor: deleteFrom, focus: start },
      });
    }

    // Handle different command types
    switch (command.type) {
      case 'paragraph':
        // First unwrap from any list wrappers (bulleted-list, numbered-list, checklist)
        Transforms.unwrapNodes(editor, {
          match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && 
            ['numbered-list', 'bulleted-list', 'checklist'].includes(n.type),
          split: true,
        });
        // Convert to normal paragraph
        Transforms.setNodes(editor, { type: 'paragraph' } as Partial<SlateElement>);
        break;

      case 'heading':
        // First unwrap from any list wrappers
        Transforms.unwrapNodes(editor, {
          match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && 
            ['numbered-list', 'bulleted-list', 'checklist'].includes(n.type),
          split: true,
        });
        // Set both type and level in one operation to preserve heading level
        Transforms.setNodes<SlateElement>(editor, { type: 'heading', level: command.level } as Partial<SlateElement>, {
          match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && Editor.isBlock(editor, n),
          mode: 'lowest',
        });
        break;

      case 'bold':
        // Toggle bold mark on selection
        Editor.addMark(editor, 'bold', true);
        break;

      case 'italic':
        // Toggle italic mark on selection
        Editor.addMark(editor, 'italic', true);
        break;

      case 'underline':
        // Toggle underline mark on selection
        Editor.addMark(editor, 'underline', true);
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

      case 'table':
        // Insert a 3x3 table by default
        const tableRows: TableRowElement[] = Array.from({ length: 3 }, (_, rowIndex) => ({
          type: 'table-row',
          children: Array.from({ length: 3 }, (_, colIndex) => ({
            type: 'table-cell',
            children: [{ type: 'paragraph', children: [{ text: rowIndex === 0 ? `Header ${colIndex + 1}` : '' }] }]
          })) as TableCellElement[]
        }));
        
        const tableBlock: TableElement = {
          type: 'table',
          children: tableRows
        };
        Transforms.insertNodes(editor, tableBlock);
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
        // Show dialog for embed URL input - save selection for inline insertion
        setUrlDialog({
          open: true,
          type: 'embed',
          embedType: command.embedType,
          title: command.title,
          url: '',
          altText: '',
          linkText: '',
          savedSelection: editor.selection ? { ...editor.selection } : null
        });
        break;

      case 'image':
        // Show dialog for image URL input - save selection for inline insertion
        setUrlDialog({
          open: true,
          type: 'image',
          title: 'Image',
          url: '',
          altText: '',
          linkText: '',
          savedSelection: editor.selection ? { ...editor.selection } : null,
          imageMode: 'url',
          isUploading: false
        });
        break;

      case 'link':
        // Show dialog for link URL input - save selection for inline insertion
        setUrlDialog({
          open: true,
          type: 'link',
          title: 'Link',
          url: '',
          altText: '',
          linkText: '',
          savedSelection: editor.selection ? { ...editor.selection } : null
        });
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
        // Insert highlighted inline text - wraps selection or inserts at cursor
        const highlightElement: HighlightElement = {
          type: 'highlight',
          backgroundColor: command.backgroundColor,
          children: [{ text: 'highlighted text' }]
        };
        // If there's a selection with text, wrap it in highlight
        if (editor.selection && !Range.isCollapsed(editor.selection)) {
          Transforms.wrapNodes(editor, highlightElement, { split: true });
        } else {
          Transforms.insertNodes(editor, highlightElement);
        }
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
          readOnly={readOnly}
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          placeholder={placeholder || "Type '/' for commands..."}
          onKeyDown={readOnly ? undefined : handleKeyDown}
          className={`slate-editor first:mt-0 [&>*:first-child]:mt-0 [&>.slate-empty-element:first-child]:hidden [&>.slate-empty-element:first-child+.slate-empty-element]:hidden ${readOnly ? 'cursor-default' : ''}`}
          data-slate-editable
          style={{
            minHeight: readOnly ? undefined : '200px',
            padding: readOnly ? '0' : '1rem',
            borderRadius: '0.5rem',
            outline: 'none'
          }}
        />
      </Slate>

      {/* Slash Menu */}
      {!readOnly && showSlashMenu && (
        <div
          className="slash-menu bg-background border border-border"
          style={{
            position: 'fixed',
            top: slashMenuPosition.top,
            left: slashMenuPosition.left,
            zIndex: 1000,
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
              className={`w-full text-left px-3 py-2 flex items-center gap-2 transition-colors text-foreground ${
                index === selectedIndex 
                  ? 'bg-[#00C9C6]/10 text-[#00C9C6] border-l-2 border-[#00C9C6]' 
                  : 'hover:bg-muted/50'
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand(command);
              }}
            >
              {command.icon}
              <span>{command.title}</span>
            </button>
          ))}
          {filteredCommands.length === 0 && (
            <div className="px-3 py-2 text-muted-foreground text-sm">
              No commands found for "{slashQuery}"
            </div>
          )}
        </div>
      )}

      {/* Selection Toolbar */}
      {!readOnly && showSelectionToolbar && (
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
                ? 'bg-[#00C9C6] text-white' 
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
                ? 'bg-[#00C9C6] text-white' 
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
                ? 'bg-[#00C9C6] text-white' 
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

      {/* URL Input Dialog */}
      <Dialog open={urlDialog.open} onOpenChange={(open) => !open && setUrlDialog({ open: false, type: null, title: '', url: '', altText: '', linkText: '', savedSelection: null, imageMode: 'url', isUploading: false })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {urlDialog.type === 'embed' ? `Add ${urlDialog.title}` : 
               urlDialog.type === 'image' ? 'Add Image' : 'Add Link'}
            </DialogTitle>
            <DialogDescription>
              {urlDialog.type === 'embed' ? `Enter the URL for your ${urlDialog.title?.toLowerCase()}.` :
               urlDialog.type === 'image' ? 'Add an image by URL or upload from your computer.' : 'Enter the URL and text for your link.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Image type with tabs for URL and Upload */}
            {urlDialog.type === 'image' ? (
              <Tabs value={urlDialog.imageMode} onValueChange={(v) => setUrlDialog(prev => ({ ...prev, imageMode: v as 'url' | 'upload', url: '' }))}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="url" data-testid="tab-url">
                    <Link className="h-4 w-4 mr-2" />
                    URL
                  </TabsTrigger>
                  <TabsTrigger value="upload" data-testid="tab-upload">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="url" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="url">Image URL</Label>
                    <Input
                      id="url"
                      placeholder="https://example.com/image.jpg"
                      value={urlDialog.url}
                      onChange={(e) => setUrlDialog(prev => ({ ...prev, url: e.target.value }))}
                      data-testid="input-image-url"
                    />
                  </div>
                </TabsContent>
                <TabsContent value="upload" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Upload Image</Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                      data-testid="input-image-file"
                    />
                    <div 
                      className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const file = e.dataTransfer.files?.[0];
                        if (file && file.type.startsWith('image/')) handleImageUpload(file);
                      }}
                    >
                      {urlDialog.isUploading ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <p className="text-sm text-muted-foreground">Uploading...</p>
                        </div>
                      ) : urlDialog.url ? (
                        <div className="flex flex-col items-center gap-2">
                          <img src={urlDialog.url} alt="Preview" className="max-h-32 rounded" />
                          <p className="text-sm text-muted-foreground">Click or drag to replace</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="h-8 w-8 text-gray-400" />
                          <p className="text-sm font-medium">Click to upload or drag and drop</p>
                          <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
                <div className="space-y-2 mt-4">
                  <Label htmlFor="alt">Description (optional)</Label>
                  <Input
                    id="alt"
                    placeholder="Image description for accessibility"
                    value={urlDialog.altText}
                    onChange={(e) => setUrlDialog(prev => ({ ...prev, altText: e.target.value }))}
                    data-testid="input-alt"
                  />
                </div>
              </Tabs>
            ) : (
              <>
                {/* Non-image types (embed, link) */}
                <div className="space-y-2">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    placeholder={urlDialog.type === 'embed' ? `https://www.youtube.com/watch?v=...` : 'https://example.com'}
                    value={urlDialog.url}
                    onChange={(e) => setUrlDialog(prev => ({ ...prev, url: e.target.value }))}
                    data-testid="input-url"
                  />
                </div>
                {urlDialog.type === 'link' && urlDialog.savedSelection && Range.isCollapsed(urlDialog.savedSelection) && (
                  <div className="space-y-2">
                    <Label htmlFor="linkText">Link Text</Label>
                    <Input
                      id="linkText"
                      placeholder="Click here"
                      value={urlDialog.linkText}
                      onChange={(e) => setUrlDialog(prev => ({ ...prev, linkText: e.target.value }))}
                      data-testid="input-link-text"
                    />
                  </div>
                )}
                {urlDialog.type === 'link' && urlDialog.savedSelection && !Range.isCollapsed(urlDialog.savedSelection) && (
                  <p className="text-sm text-muted-foreground">The selected text will become a clickable link.</p>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setUrlDialog({ open: false, type: null, title: '', url: '', altText: '', linkText: '', savedSelection: null, imageMode: 'url', isUploading: false })}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (!urlDialog.url) return;
                
                try {
                  // Focus editor and restore the saved selection before inserting so content goes inline
                  try {
                    ReactEditor.focus(editor);
                  } catch (focusError) {
                    // Editor focus may fail in some environments, continue anyway
                    console.warn('Editor focus failed, continuing with insert:', focusError);
                  }
                  
                  if (urlDialog.savedSelection) {
                    try {
                      Transforms.select(editor, urlDialog.savedSelection);
                    } catch (selectError) {
                      // Selection restore may fail if content changed, insert at end instead
                      console.warn('Selection restore failed, inserting at end:', selectError);
                      Transforms.select(editor, Editor.end(editor, []));
                    }
                  }
                  
                  if (urlDialog.type === 'embed') {
                    const embedBlock: EmbedElement = {
                      type: 'embed',
                      embedType: urlDialog.embedType as any,
                      url: urlDialog.url,
                      children: [{ text: '' }]
                    };
                    Transforms.insertNodes(editor, embedBlock);
                  } else if (urlDialog.type === 'image') {
                    const imageBlock: ImageElement = {
                      type: 'image',
                      url: urlDialog.url,
                      alt: urlDialog.altText || '',
                      children: [{ text: '' }]
                    };
                    Transforms.insertNodes(editor, imageBlock);
                  } else if (urlDialog.type === 'link') {
                    const selection = editor.selection;
                    const isCollapsed = selection ? Range.isCollapsed(selection) : true;
                    
                    if (isCollapsed) {
                      const linkBlock: LinkElement = {
                        type: 'link',
                        url: urlDialog.url,
                        children: [{ text: urlDialog.linkText || urlDialog.url }]
                      };
                      Transforms.insertNodes(editor, linkBlock);
                    } else {
                      const isLinkActive = (() => {
                        const [link] = Editor.nodes(editor, {
                          match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === 'link',
                        });
                        return !!link;
                      })();
                      
                      if (isLinkActive) {
                        Transforms.unwrapNodes(editor, {
                          match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === 'link',
                        });
                      }
                      
                      const link: LinkElement = {
                        type: 'link',
                        url: urlDialog.url,
                        children: []
                      };
                      Transforms.wrapNodes(editor, link, { split: true });
                      Transforms.collapse(editor, { edge: 'end' });
                    }
                  }
                } catch (insertError) {
                  console.error('Error inserting content:', insertError);
                }
                
                // Always close the dialog, even if insertion failed
                setUrlDialog({ open: false, type: null, title: '', url: '', altText: '', linkText: '', savedSelection: null, imageMode: 'url', isUploading: false });
              }}
              disabled={!urlDialog.url}
              data-testid="button-insert"
            >
              Insert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

  // Generate heading ID from text content (matches extractHeadings in article-view.tsx)
  const getHeadingId = (elem: any): string => {
    const text = elem.children?.map((child: any) => child.text || '').join('') || '';
    return text.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  };

  switch (element.type) {
    case 'heading':
      const level = element.level || 1; // Default to h1 if level is missing
      const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
      const headingEmpty = isElementEmpty(element);
      const headingId = getHeadingId(element);
      return (
        <HeadingTag {...attributes} id={headingId} className={`text-${level === 1 ? '2xl' : level === 2 ? 'xl' : 'lg'} font-bold my-4 ${headingEmpty ? 'slate-empty-element' : ''}`}>
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
        <ul {...attributes} className="list-disc list-inside my-1 [&_ul]:my-0 [&_ol]:my-0">
          {children}
        </ul>
      );
    case 'numbered-list':
      return (
        <ol {...attributes} className="list-decimal list-inside my-1 [&_ul]:my-0 [&_ol]:my-0">
          {children}
        </ol>
      );
    case 'list-item':
      return <li {...attributes} className="my-0">{children}</li>;
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
    
    case 'table':
      return <TableBlock {...props} />;
    
    case 'table-row':
      return (
        <tr {...attributes} className="border-b border-gray-200 dark:border-gray-700">
          {children}
        </tr>
      );
    
    case 'table-cell':
      return (
        <td {...attributes} className="border border-gray-200 dark:border-gray-700 px-3 py-2 min-w-[100px]">
          {children}
        </td>
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
      return <ResizableImage attributes={attributes} element={element}>{children}</ResizableImage>;
    
    case 'link':
      return (
        <a 
          {...attributes} 
          href={element.url} 
          className="text-blue-600 underline hover:text-blue-800 cursor-pointer"
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            if (element.url) {
              e.preventDefault();
              window.open(element.url, '_blank', 'noopener,noreferrer');
            }
          }}
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
      const paragraphEmpty = isElementEmpty(element);
      return (
        <p {...attributes} className={`my-2 ${paragraphEmpty ? 'slate-empty-element' : ''}`}>
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
    // Try to save the toggle state, but don't fail if path is invalid
    try {
      if (Editor.hasPath(editor, path)) {
        Transforms.setNodes(editor, { isOpen: newIsOpen } as Partial<ToggleElement>, { at: path });
      }
    } catch (error) {
      console.log('Toggle state update skipped:', error);
    }
  };

  return (
    <div {...attributes} className="toggle-block my-1">
      <div
        className="toggle-header flex items-center gap-1"
        contentEditable={false}
      >
        <ChevronRight 
          className={`h-4 w-4 transition-transform cursor-pointer text-gray-500 ${isOpen ? 'rotate-90' : ''}`} 
          onClick={handleToggle}
        />
        {isEditingTitle ? (
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            onKeyDown={handleTitleKeyDown}
            onBlur={handleTitleBlur}
            className="bg-transparent border-none outline-none flex-1"
            autoFocus
          />
        ) : (
          <span 
            className="cursor-text flex-1"
            onClick={handleTitleClick}
          >
            {title}
          </span>
        )}
      </div>
      {isOpen && (
        <div className="toggle-content pl-5">
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
  };

  return (
    <div {...attributes} style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: '8px', margin: '2px 0' }}>
      <label contentEditable={false} style={{ display: 'flex', alignItems: 'center', height: '24px', flexShrink: 0 }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={handleCheckChange}
          style={{ width: '16px', height: '16px', margin: 0, cursor: 'pointer' }}
        />
      </label>
      <span style={{ flex: 1, minWidth: 0, lineHeight: '24px' }} className={checked ? 'line-through text-gray-500' : ''}>
        {children}
      </span>
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

// Table block component with add/remove row/column functionality
const TableBlock = ({ attributes, children, element }: any) => {
  const editor = useSlateStatic();
  
  const addRow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const path = ReactEditor.findPath(editor, element);
    const columnCount = element.children[0]?.children?.length || 3;
    const newRow: TableRowElement = {
      type: 'table-row',
      children: Array.from({ length: columnCount }, () => ({
        type: 'table-cell',
        children: [{ type: 'paragraph', children: [{ text: '' }] }]
      })) as TableCellElement[]
    };
    Transforms.insertNodes(editor, newRow, { at: [...path, element.children.length] });
  };
  
  const addColumn = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const path = ReactEditor.findPath(editor, element);
    element.children.forEach((_: any, rowIndex: number) => {
      const newCell: TableCellElement = {
        type: 'table-cell',
        children: [{ type: 'paragraph', children: [{ text: '' }] }]
      };
      const cellCount = element.children[rowIndex]?.children?.length || 0;
      Transforms.insertNodes(editor, newCell, { at: [...path, rowIndex, cellCount] });
    });
  };
  
  const removeRow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rowCount = element.children?.length || 0;
    if (rowCount <= 1) return;
    const path = ReactEditor.findPath(editor, element);
    Transforms.removeNodes(editor, { at: [...path, rowCount - 1] });
  };

  const removeColumn = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const columnCount = element.children[0]?.children?.length || 0;
    if (columnCount <= 1) return;
    const path = ReactEditor.findPath(editor, element);
    for (let rowIndex = element.children.length - 1; rowIndex >= 0; rowIndex--) {
      const cellCount = element.children[rowIndex]?.children?.length || 0;
      if (cellCount > 1) {
        Transforms.removeNodes(editor, { at: [...path, rowIndex, cellCount - 1] });
      }
    }
  };

  const deleteTable = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const path = ReactEditor.findPath(editor, element);
    Transforms.removeNodes(editor, { at: path });
  };

  const rowCount = element.children?.length || 0;
  const columnCount = element.children[0]?.children?.length || 0;
  
  return (
    <div {...attributes} className="table-block my-4">
      <div contentEditable={false} className="flex items-center gap-2 mb-2 flex-wrap">
        <button
          onMouseDown={addRow}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
        >
          <Plus className="h-3 w-3" /> Row
        </button>
        <button
          onMouseDown={removeRow}
          disabled={rowCount <= 1}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Minus className="h-3 w-3" /> Row
        </button>
        <button
          onMouseDown={addColumn}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
        >
          <Plus className="h-3 w-3" /> Column
        </button>
        <button
          onMouseDown={removeColumn}
          disabled={columnCount <= 1}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Minus className="h-3 w-3" /> Column
        </button>
        <button
          onMouseDown={deleteTable}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 text-red-600 dark:text-red-300 rounded transition-colors ml-auto"
        >
          <Trash2 className="h-3 w-3" /> Delete
        </button>
      </div>
      <table className="w-full border-collapse border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
        <tbody>
          {children}
        </tbody>
      </table>
    </div>
  );
};

// Resizable Image component with drag handles
const ResizableImage = ({ attributes, children, element }: any) => {
  const editor = useSlateStatic();
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  const [localWidth, setLocalWidth] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const pathRef = useRef<number[] | null>(null);
  
  const currentWidth = localWidth ?? element.widthPx;
  
  const handleMouseDown = (e: React.MouseEvent, direction: 'left' | 'right') => {
    e.preventDefault();
    e.stopPropagation();
    
    // Store the path at the start of resize - this is stable
    try {
      pathRef.current = ReactEditor.findPath(editor, element);
    } catch {
      return; // Can't find path, don't start resize
    }
    
    setIsResizing(true);
    setStartX(e.clientX);
    
    // Get current width from element or image natural width
    const imgWidth = element.widthPx || imageRef.current?.offsetWidth || 400;
    setStartWidth(imgWidth);
    setLocalWidth(imgWidth);
  };
  
  useEffect(() => {
    if (!isResizing || !pathRef.current) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const containerWidth = containerRef.current?.parentElement?.offsetWidth || 800;
      const deltaX = e.clientX - startX;
      let newWidth = startWidth + deltaX;
      
      // Clamp width between 100px and container width
      newWidth = Math.max(100, Math.min(newWidth, containerWidth));
      
      // Update local state for immediate visual feedback
      setLocalWidth(Math.round(newWidth));
    };
    
    const handleMouseUp = () => {
      // Apply the final width to Slate on mouse up
      if (pathRef.current && localWidth !== null) {
        try {
          Transforms.setNodes(editor, { widthPx: localWidth } as Partial<ImageElement>, { at: pathRef.current });
        } catch (err) {
          console.warn('Could not update image width:', err);
        }
      }
      setIsResizing(false);
      setLocalWidth(null);
      pathRef.current = null;
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, startX, startWidth, localWidth, editor]);
  
  return (
    <div {...attributes} className="image-block my-4" ref={containerRef}>
      <div 
        contentEditable={false}
        className="relative inline-block group"
        style={{ width: currentWidth ? `${currentWidth}px` : 'auto', maxWidth: '100%' }}
      >
        <img 
          ref={imageRef}
          src={element.url} 
          alt={element.alt || ''} 
          className="w-full h-auto rounded-md shadow-sm"
          draggable={false}
        />
        {/* Left resize handle */}
        <div
          className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          onMouseDown={(e) => handleMouseDown(e, 'left')}
        >
          <div className="w-1 h-12 bg-primary rounded-full" />
        </div>
        {/* Right resize handle */}
        <div
          className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          onMouseDown={(e) => handleMouseDown(e, 'right')}
        >
          <div className="w-1 h-12 bg-primary rounded-full" />
        </div>
        {/* Width indicator when resizing */}
        {isResizing && currentWidth && (
          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded">
            {Math.round(currentWidth)}px
          </div>
        )}
      </div>
      {/* Required by Slate for void elements - hidden but in DOM */}
      <div style={{ height: 0, overflow: 'hidden' }}>{children}</div>
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
          <div className="relative w-full max-w-2xl" style={{ aspectRatio: '16/9' }}>
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              title="YouTube video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full rounded-md"
            />
          </div>
        );
      }
    } else if (embedType === 'loom') {
      const loomId = url.match(/loom\.com\/share\/([^/?]+)/)?.[1];
      if (loomId) {
        return (
          <div className="relative w-full max-w-2xl" style={{ aspectRatio: '16/9' }}>
            <iframe
              src={`https://www.loom.com/embed/${loomId}`}
              title="Loom video"
              frameBorder="0"
              allowFullScreen
              className="absolute inset-0 w-full h-full rounded-md"
            />
          </div>
        );
      }
    } else if (embedType.startsWith('google-')) {
      // Generic Google embed handling - slightly taller aspect ratio for docs
      return (
        <div className="relative w-full max-w-3xl" style={{ aspectRatio: '4/3' }}>
          <iframe
            src={url}
            title={`${embedType} embed`}
            frameBorder="0"
            allowFullScreen
            className="absolute inset-0 w-full h-full rounded-md border border-gray-200"
          />
        </div>
      );
    }

    // Fallback for unsupported embeds
    return (
      <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-md p-4 text-center max-w-2xl">
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

  if (leaf.underline) {
    children = <u>{children}</u>;
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