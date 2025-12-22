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

// Toggle Extension - Simple single-node implementation
// Summary stored as attribute, body as block content

const ToggleComponent = ({ node, updateAttributes, editor }: any) => {
  const isOpen = node.attrs.open;
  const summary = node.attrs.summary || '';
  
  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateAttributes({ open: !isOpen });
  };

  const handleSummaryChange = (e: React.FormEvent<HTMLDivElement>) => {
    updateAttributes({ summary: e.currentTarget.textContent || '' });
  };

  return (
    <NodeViewWrapper className="simple-toggle" data-open={isOpen ? 'true' : 'false'}>
      <div className="simple-toggle-header">
        <button
          type="button"
          className="simple-toggle-arrow"
          onClick={handleToggle}
          contentEditable={false}
        >
          <span style={{ 
            display: 'inline-block', 
            transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s ease'
          }}>▶</span>
        </button>
        <div
          className="simple-toggle-summary"
          contentEditable
          suppressContentEditableWarning
          onBlur={handleSummaryChange}
          data-placeholder="Toggle title..."
        >
          {summary}
        </div>
      </div>
      {isOpen && (
        <div className="simple-toggle-body">
          <NodeViewContent className="simple-toggle-content" />
        </div>
      )}
    </NodeViewWrapper>
  );
};

export const ToggleExtension = Node.create({
  name: 'toggle',

  group: 'block',

  content: 'block+',

  addAttributes() {
    return {
      open: {
        default: true,
        parseHTML: element => {
          if (element.tagName === 'DETAILS') {
            return element.hasAttribute('open');
          }
          return element.getAttribute('data-open') !== 'false';
        },
        renderHTML: attributes => ({
          'data-open': attributes.open ? 'true' : 'false',
        }),
      },
      summary: {
        default: '',
        parseHTML: element => {
          const summaryEl = element.querySelector('summary');
          return summaryEl ? summaryEl.textContent || '' : '';
        },
        renderHTML: () => ({}),
      },
    };
  },

  parseHTML() {
    return [
      { tag: 'details' },
      { tag: 'div[data-toggle]' },
      { tag: 'div.toggle-wrapper' },
      { tag: 'div.simple-toggle' },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const isOpen = node.attrs.open;
    const summary = node.attrs.summary || 'Toggle';
    return [
      'details',
      mergeAttributes(HTMLAttributes, {
        open: isOpen ? 'open' : null,
        class: 'toggle-view',
      }),
      ['summary', { class: 'toggle-view-summary' }, summary],
      ['div', { class: 'toggle-view-content' }, 0],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ToggleComponent);
  },

  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => {
        const { selection } = editor.state;
        const { $from } = selection;
        
        for (let depth = $from.depth; depth >= 0; depth--) {
          const node = $from.node(depth);
          if (node.type.name === 'toggle') {
            if (node.textContent.trim() === '') {
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

// Legacy support - keep these minimal for parsing old content
export const ToggleSummary = Node.create({
  name: 'toggleSummary',
  content: 'inline*',
  parseHTML() {
    return [{ tag: 'summary' }, { tag: 'div[data-toggle-summary]' }];
  },
  renderHTML() {
    return ['div', { style: 'display: none' }, 0];
  },
});

export const ToggleContent = Node.create({
  name: 'toggleContent',
  content: 'block+',
  parseHTML() {
    return [{ tag: 'div[data-toggle-content]' }];
  },
  renderHTML() {
    return ['div', 0];
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