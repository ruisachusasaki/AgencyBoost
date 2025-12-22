import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import TaskItem from '@tiptap/extension-task-item';
import React from 'react';

// Custom TaskItem that renders without the problematic inline styles
export const CustomTaskItem = TaskItem.extend({
  addNodeView() {
    return ({ node, updateAttributes, editor }) => {
      const container = document.createElement('li');
      container.dataset.type = 'taskItem';
      container.dataset.checked = node.attrs.checked ? 'true' : 'false';
      container.className = 'custom-task-item';
      container.style.cssText = 'display: flex; flex-direction: row; align-items: flex-start; gap: 8px; list-style: none; margin: 0; padding: 4px 0;';

      const label = document.createElement('label');
      label.contentEditable = 'false';
      label.style.cssText = 'display: flex; align-items: center; justify-content: center; width: 18px; height: 20px; flex-shrink: 0; cursor: pointer; margin: 0; padding: 0;';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = node.attrs.checked;
      checkbox.style.cssText = 'width: 16px; height: 16px; margin: 0; cursor: pointer; border-radius: 50%; flex-shrink: 0;';
      checkbox.addEventListener('change', () => {
        if (!editor.isEditable) return;
        updateAttributes({ checked: checkbox.checked });
      });

      label.appendChild(checkbox);

      const content = document.createElement('div');
      content.className = 'task-item-content';
      content.style.cssText = 'flex: 1; min-width: 0; line-height: 1.5;';

      container.appendChild(label);
      container.appendChild(content);

      return {
        dom: container,
        contentDOM: content,
        update: (updatedNode: any) => {
          if (updatedNode.type.name !== 'taskItem') return false;
          checkbox.checked = updatedNode.attrs.checked;
          container.dataset.checked = updatedNode.attrs.checked ? 'true' : 'false';
          return true;
        },
      };
    };
  },
});

// Callout Extension
export const CalloutExtension = Node.create({
  name: 'callout',

  group: 'block',

  content: 'block+',

  addAttributes() {
    return {
      type: {
        default: 'info',
        parseHTML: element => element.getAttribute('data-type'),
        renderHTML: attributes => {
          return {
            'data-type': attributes.type,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-callout]',
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const type = node.attrs.type || 'info';
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-callout': '',
        'data-type': type,
        class: `callout callout-${type}`,
      }),
      [
        'div',
        { class: 'callout-icon' },
        type === 'info' ? 'ℹ️' : type === 'warning' ? '⚠️' : '🚨'
      ],
      [
        'div',
        { class: 'callout-content' },
        0
      ]
    ];
  },
});

// Toggle Extension - Notion-style with collapsible content
// Uses toggleSummary + toggleContent child nodes for header and body

const ToggleWrapperComponent = ({ node, updateAttributes, deleteNode }: any) => {
  const isOpen = node.attrs.open;
  
  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateAttributes({ open: !isOpen });
  };

  return (
    <NodeViewWrapper className="toggle-wrapper" data-toggle="" data-open={isOpen ? 'true' : 'false'}>
      <div className="toggle-block">
        <button
          type="button"
          className="toggle-btn"
          onClick={handleToggle}
          contentEditable={false}
        >
          <span className={`toggle-icon ${isOpen ? 'open' : ''}`}>▶</span>
        </button>
        <NodeViewContent className="toggle-content-wrapper" />
      </div>
    </NodeViewWrapper>
  );
};

export const ToggleExtension = Node.create({
  name: 'toggle',

  group: 'block',

  content: 'toggleSummary toggleContent',

  addAttributes() {
    return {
      open: {
        default: true,
        parseHTML: element => element.getAttribute('data-open') !== 'false',
        renderHTML: attributes => ({
          'data-open': attributes.open ? 'true' : 'false',
        }),
      },
    };
  },

  parseHTML() {
    return [
      { tag: 'div[data-toggle]' },
      { tag: 'details[data-toggle]' },
      { tag: 'div.toggle-wrapper' },
      { tag: 'div.simple-toggle-block' },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const isOpen = node.attrs.open;
    return [
      'details',
      mergeAttributes(HTMLAttributes, {
        'data-toggle': '',
        'data-open': isOpen ? 'true' : 'false',
        open: isOpen ? 'open' : null,
        class: 'toggle-block-view',
      }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ToggleWrapperComponent);
  },

  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => {
        const { selection } = editor.state;
        const { $from } = selection;
        
        // Walk up the ancestor chain to find a toggle node
        for (let depth = $from.depth; depth >= 0; depth--) {
          const node = $from.node(depth);
          if (node.type.name === 'toggle') {
            // Check if the entire toggle is empty (both summary and content)
            if (node.textContent.trim() === '' || node.textContent === 'Toggle content goes here') {
              return editor.commands.deleteNode('toggle');
            }
            break;
          }
        }
        return false;
      },
    };
  },
});

// Toggle Summary - the clickable header
export const ToggleSummary = Node.create({
  name: 'toggleSummary',

  content: 'inline*',

  defining: true,

  parseHTML() {
    return [
      { tag: 'summary' },
      { tag: 'div[data-toggle-summary]' },
      { tag: 'div.simple-toggle-summary' },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'summary',
      mergeAttributes(HTMLAttributes, {
        'data-toggle-summary': '',
        class: 'toggle-summary-view',
      }),
      0,
    ];
  },
});

// Toggle Content - the collapsible body
export const ToggleContent = Node.create({
  name: 'toggleContent',

  content: 'block+',

  defining: true,

  parseHTML() {
    return [
      { tag: 'div[data-toggle-content]' },
      { tag: 'div.simple-toggle-content' },
      { tag: 'div.toggle-content-view' },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-toggle-content': '',
        class: 'toggle-content-view',
      }),
      0,
    ];
  },
});

// Columns Extension
export const ColumnsExtension = Node.create({
  name: 'columns',

  group: 'block',

  content: 'column{2}',

  parseHTML() {
    return [
      {
        tag: 'div[data-columns]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-columns': '',
        class: 'columns-container',
      }),
      0,
    ];
  },
});

export const ColumnExtension = Node.create({
  name: 'column',

  content: 'block+',

  parseHTML() {
    return [
      {
        tag: 'div[data-column]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-column': '',
        class: 'column',
      }),
      0,
    ];
  },
});