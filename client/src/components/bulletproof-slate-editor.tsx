import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { createEditor, Descendant, Element as SlateElement, Transforms, Editor, Point, Range } from 'slate';
import { Slate, Editable, withReact, ReactEditor } from 'slate-react';
import { withHistory } from 'slate-history';

// Simple empty document creator
export const createSafeEmptyDocument = (): Descendant[] => [
  {
    type: 'paragraph',
    children: [{ text: '' }]
  }
];

interface BulletproofSlateEditorProps {
  value: Descendant[];
  onChange: (value: Descendant[]) => void;
  placeholder?: string;
}

export const BulletproofSlateEditor: React.FC<BulletproofSlateEditorProps> = ({ 
  value, 
  onChange, 
  placeholder = "Start typing..."
}) => {
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  
  // Bulletproof value validation
  const safeValue = useMemo(() => {
    // Multiple layers of validation
    if (!value) {
      console.warn('Value is null/undefined, using empty document');
      return createSafeEmptyDocument();
    }
    
    if (!Array.isArray(value)) {
      console.warn('Value is not an array, using empty document');
      return createSafeEmptyDocument();
    }
    
    if (value.length === 0) {
      console.warn('Value is empty array, using empty document');
      return createSafeEmptyDocument();
    }
    
    // Validate each element in the array
    const isValid = value.every(node => {
      return node && typeof node === 'object' && 'children' in node;
    });
    
    if (!isValid) {
      console.warn('Value contains invalid nodes, using empty document');
      return createSafeEmptyDocument();
    }
    
    return value;
  }, [value]);

  const renderElement = useCallback((props: any) => {
    const { attributes, children, element } = props;
    
    switch (element.type) {
      case 'heading':
        const level = element.level || 1;
        const Tag = `h${level}` as keyof JSX.IntrinsicElements;
        return <Tag {...attributes} className={`text-${4-level}xl font-bold mb-4`}>{children}</Tag>;
      
      case 'paragraph':
      default:
        return <p {...attributes} className="mb-2">{children}</p>;
    }
  }, []);

  const renderLeaf = useCallback((props: any) => {
    const { attributes, children, leaf } = props;
    
    let element = children;
    
    if (leaf.bold) {
      element = <strong>{element}</strong>;
    }
    
    if (leaf.italic) {
      element = <em>{element}</em>;
    }
    
    return <span {...attributes}>{element}</span>;
  }, []);

  const handleEditorChange = useCallback((newValue: Descendant[]) => {
    // Validate before calling onChange
    if (Array.isArray(newValue) && newValue.length > 0) {
      onChange(newValue);
    }
  }, [onChange]);

  // Log the actual value being passed to Slate
  useEffect(() => {
    console.log('BulletproofSlateEditor - safeValue:', safeValue);
    console.log('BulletproofSlateEditor - safeValue type:', typeof safeValue);
    console.log('BulletproofSlateEditor - safeValue is array:', Array.isArray(safeValue));
  }, [safeValue]);

  return (
    <div className="bulletproof-slate-editor border rounded-lg p-4">
      <Slate 
        editor={editor} 
        initialValue={safeValue} 
        onValueChange={handleEditorChange}
      >
        <Editable
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          placeholder={placeholder}
          className="min-h-[200px] outline-none"
        />
      </Slate>
    </div>
  );
};