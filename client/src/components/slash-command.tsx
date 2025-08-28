import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { 
  CheckSquare, Code, AlertCircle, Info, AlertTriangle, 
  Columns, ChevronRight, Type, List, ListOrdered, Quote,
  Heading1, Heading2, Heading3
} from 'lucide-react';

export interface SlashCommandProps {
  items: Array<{
    title: string;
    description: string;
    icon: React.ReactNode;
    command: () => void;
  }>;
  command: (item: any) => void;
}

export const SlashCommand = forwardRef<any, SlashCommandProps>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command(item);
    }
  };

  const upHandler = () => {
    setSelectedIndex((prevIndex) => 
      prevIndex <= 0 ? props.items.length - 1 : prevIndex - 1
    );
  };

  const downHandler = () => {
    setSelectedIndex((prevIndex) => 
      prevIndex >= props.items.length - 1 ? 0 : prevIndex + 1
    );
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }

      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }

      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }

      return false;
    },
  }));

  return (
    <div className="slash-command-menu bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
      {props.items.map((item, index) => (
        <button
          key={index}
          className={`
            w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-gray-50
            ${index === selectedIndex ? 'bg-blue-50 border-l-2 border-blue-500' : ''}
          `}
          onClick={() => selectItem(index)}
        >
          <div className="text-gray-600 flex-shrink-0">
            {item.icon}
          </div>
          <div>
            <div className="font-medium text-gray-900">{item.title}</div>
            <div className="text-sm text-gray-500">{item.description}</div>
          </div>
        </button>
      ))}
    </div>
  );
});

SlashCommand.displayName = 'SlashCommand';

export const getSlashCommands = (editor: any) => [
  {
    title: 'Text',
    description: 'Start writing with plain text',
    icon: <Type className="h-4 w-4" />,
    command: () => {
      editor.chain().focus().clearNodes().run();
    },
  },
  {
    title: 'Heading 1',
    description: 'Big section heading',
    icon: <Heading1 className="h-4 w-4" />,
    command: () => {
      editor.chain().focus().clearNodes().setHeading({ level: 1 }).run();
    },
  },
  {
    title: 'Heading 2',
    description: 'Medium section heading',
    icon: <Heading2 className="h-4 w-4" />,
    command: () => {
      editor.chain().focus().clearNodes().setHeading({ level: 2 }).run();
    },
  },
  {
    title: 'Heading 3',
    description: 'Small section heading',
    icon: <Heading3 className="h-4 w-4" />,
    command: () => {
      editor.chain().focus().clearNodes().setHeading({ level: 3 }).run();
    },
  },
  {
    title: 'Bullet List',
    description: 'Create a simple bullet list',
    icon: <List className="h-4 w-4" />,
    command: () => {
      editor.chain().focus().clearNodes().toggleBulletList().run();
    },
  },
  {
    title: 'Numbered List',
    description: 'Create a list with numbers',
    icon: <ListOrdered className="h-4 w-4" />,
    command: () => {
      editor.chain().focus().clearNodes().toggleOrderedList().run();
    },
  },
  {
    title: 'To-do List',
    description: 'Track tasks with checkboxes',
    icon: <CheckSquare className="h-4 w-4" />,
    command: () => {
      editor.chain().focus().clearNodes().toggleTaskList().run();
    },
  },
  {
    title: 'Quote',
    description: 'Capture a quote',
    icon: <Quote className="h-4 w-4" />,
    command: () => {
      editor.chain().focus().clearNodes().setBlockquote().run();
    },
  },
  {
    title: 'Code Block',
    description: 'Capture a code snippet',
    icon: <Code className="h-4 w-4" />,
    command: () => {
      editor.chain().focus().clearNodes().setCodeBlock().run();
    },
  },
  {
    title: 'Info Callout',
    description: 'Add an info callout box',
    icon: <Info className="h-4 w-4" />,
    command: () => {
      editor.chain().focus().clearNodes().insertContent(`
        <div class="callout callout-info">
          <div class="callout-icon">ℹ️</div>
          <div class="callout-content">
            <p>This is an info callout. You can edit this text.</p>
          </div>
        </div>
      `).run();
    },
  },
  {
    title: 'Warning Callout',
    description: 'Add a warning callout box',
    icon: <AlertTriangle className="h-4 w-4" />,
    command: () => {
      editor.chain().focus().clearNodes().insertContent(`
        <div class="callout callout-warning">
          <div class="callout-icon">⚠️</div>
          <div class="callout-content">
            <p>This is a warning callout. You can edit this text.</p>
          </div>
        </div>
      `).run();
    },
  },
  {
    title: 'Danger Callout',
    description: 'Add a danger callout box',
    icon: <AlertCircle className="h-4 w-4" />,
    command: () => {
      editor.chain().focus().clearNodes().insertContent(`
        <div class="callout callout-danger">
          <div class="callout-icon">🚨</div>
          <div class="callout-content">
            <p>This is a danger callout. You can edit this text.</p>
          </div>
        </div>
      `).run();
    },
  },
  {
    title: 'Toggle',
    description: 'Create a collapsible section',
    icon: <ChevronRight className="h-4 w-4" />,
    command: () => {
      editor.chain().focus().clearNodes().insertContent(`
        <details class="toggle-block">
          <summary class="toggle-summary">Click to toggle</summary>
          <div class="toggle-content">
            <p>This content can be toggled open and closed. You can edit this text.</p>
          </div>
        </details>
      `).run();
    },
  },
  {
    title: 'Two Columns',
    description: 'Create a two-column layout',
    icon: <Columns className="h-4 w-4" />,
    command: () => {
      editor.chain().focus().clearNodes().insertContent(`
        <div class="columns-container">
          <div class="column">
            <p>Left column content</p>
          </div>
          <div class="column">
            <p>Right column content</p>
          </div>
        </div>
      `).run();
    },
  },
];