import { Node, mergeAttributes, Command, ChainedCommands } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import React from 'react';

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

  addCommands() {
    return {
      setCallout: (attributes = {}) => ({ commands }: { commands: ChainedCommands }) => {
        return commands.setNode(this.name, attributes);
      },
    };
  },
});

// Toggle Extension
export const ToggleExtension = Node.create({
  name: 'toggle',

  group: 'block',

  content: 'toggleSummary toggleContent',

  parseHTML() {
    return [
      {
        tag: 'details[data-toggle]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'details',
      mergeAttributes(HTMLAttributes, {
        'data-toggle': '',
        class: 'toggle-block',
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setToggle: () => ({ commands }: { commands: ChainedCommands }) => {
        return commands.setNode(this.name);
      },
    };
  },
});

export const ToggleSummary = Node.create({
  name: 'toggleSummary',

  content: 'inline*',

  parseHTML() {
    return [
      {
        tag: 'summary',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'summary',
      mergeAttributes(HTMLAttributes, {
        class: 'toggle-summary',
      }),
      0,
    ];
  },
});

export const ToggleContent = Node.create({
  name: 'toggleContent',

  content: 'block+',

  parseHTML() {
    return [
      {
        tag: 'div[data-toggle-content]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-toggle-content': '',
        class: 'toggle-content',
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

  addCommands() {
    return {
      setColumns: () => ({ commands }: { commands: ChainedCommands }) => {
        return commands.setNode(this.name);
      },
    };
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