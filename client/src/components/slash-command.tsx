import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { 
  CheckSquare, Code, AlertCircle, Info, AlertTriangle, 
  Columns, ChevronRight, Type, List, ListOrdered, Quote,
  Heading1, Heading2, Heading3, Table, Link, Image, 
  Menu, Video, FileText, Youtube, ExternalLink
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
      // Use div-based toggle that's always editable
      editor.chain().focus().clearNodes().insertContent(`
        <div class="toggle-block editable-toggle" data-toggle-editable="true">
          <div class="toggle-summary editable-summary" data-summary="true">
            <span class="toggle-arrow">▶</span>
            <span class="toggle-title">Click to toggle</span>
          </div>
          <div class="toggle-content visible-in-edit" data-content="true">
            <p>This content can be toggled open and closed. You can edit this text.</p>
          </div>
        </div>
        <p></p>
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
  {
    title: 'Table',
    description: 'Insert a table with rows and columns',
    icon: <Table className="h-4 w-4" />,
    command: () => {
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    },
  },
  {
    title: 'Link',
    description: 'Add a hyperlink',
    icon: <Link className="h-4 w-4" />,
    command: () => {
      const url = prompt('Enter URL:');
      if (url) {
        editor.chain().focus().setLink({ href: url }).run();
      }
    },
  },
  {
    title: 'Image',
    description: 'Insert an image',
    icon: <Image className="h-4 w-4" />,
    command: () => {
      const url = prompt('Enter image URL:');
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    },
  },
  {
    title: 'Success Banner',
    description: 'Add a success banner',
    icon: <CheckSquare className="h-4 w-4" />,
    command: () => {
      editor.chain().focus().clearNodes().insertContent(`
        <div class="banner banner-success">
          <div class="banner-icon">✅</div>
          <div class="banner-content">
            <p>Success! This is a success banner message.</p>
          </div>
        </div>
      `).run();
    },
  },
  {
    title: 'Info Banner',
    description: 'Add an info banner',
    icon: <Info className="h-4 w-4" />,
    command: () => {
      editor.chain().focus().clearNodes().insertContent(`
        <div class="banner banner-info">
          <div class="banner-icon">ℹ️</div>
          <div class="banner-content">
            <p>Information: This is an info banner message.</p>
          </div>
        </div>
      `).run();
    },
  },
  {
    title: 'Warning Banner',
    description: 'Add a warning banner',
    icon: <AlertTriangle className="h-4 w-4" />,
    command: () => {
      editor.chain().focus().clearNodes().insertContent(`
        <div class="banner banner-warning">
          <div class="banner-icon">⚠️</div>
          <div class="banner-content">
            <p>Warning: This is a warning banner message.</p>
          </div>
        </div>
      `).run();
    },
  },
  {
    title: 'YouTube Embed',
    description: 'Embed a YouTube video',
    icon: <Youtube className="h-4 w-4" />,
    command: () => {
      const url = prompt('Enter YouTube URL:');
      if (url) {
        let videoId = '';
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
        if (match) {
          videoId = match[1];
          editor.chain().focus().insertContent(`
            <div class="embed-container">
              <iframe 
                width="560" 
                height="315" 
                src="https://www.youtube.com/embed/${videoId}" 
                frameborder="0" 
                allowfullscreen
                class="youtube-embed">
              </iframe>
            </div>
          `).run();
        }
      }
    },
  },
  {
    title: 'Loom Embed',
    description: 'Embed a Loom video',
    icon: <Video className="h-4 w-4" />,
    command: () => {
      const url = prompt('Enter Loom URL:');
      if (url) {
        const match = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
        if (match) {
          const videoId = match[1];
          editor.chain().focus().insertContent(`
            <div class="embed-container">
              <iframe 
                src="https://www.loom.com/embed/${videoId}" 
                frameborder="0" 
                webkitallowfullscreen 
                mozallowfullscreen 
                allowfullscreen
                class="loom-embed">
              </iframe>
            </div>
          `).run();
        }
      }
    },
  },
  {
    title: 'Google Drive Embed',
    description: 'Embed a Google Drive file',
    icon: <FileText className="h-4 w-4" />,
    command: () => {
      const url = prompt('Enter Google Drive share URL:');
      if (url) {
        const match = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
        if (match) {
          const fileId = match[1];
          editor.chain().focus().insertContent(`
            <div class="embed-container">
              <iframe 
                src="https://drive.google.com/file/d/${fileId}/preview" 
                width="640" 
                height="480" 
                allow="autoplay"
                class="drive-embed">
              </iframe>
            </div>
          `).run();
        }
      }
    },
  },
  {
    title: 'Google Slides Embed',
    description: 'Embed Google Slides presentation',
    icon: <ExternalLink className="h-4 w-4" />,
    command: () => {
      const url = prompt('Enter Google Slides URL:');
      if (url) {
        const match = url.match(/\/presentation\/d\/([a-zA-Z0-9-_]+)/);
        if (match) {
          const presentationId = match[1];
          editor.chain().focus().insertContent(`
            <div class="embed-container">
              <iframe 
                src="https://docs.google.com/presentation/d/${presentationId}/embed?start=false&loop=false&delayms=3000" 
                frameborder="0" 
                width="960" 
                height="569" 
                allowfullscreen="true" 
                mozallowfullscreen="true" 
                webkitallowfullscreen="true"
                class="slides-embed">
              </iframe>
            </div>
          `).run();
        }
      }
    },
  },
  {
    title: 'Google Docs Embed',
    description: 'Embed a Google Docs document',
    icon: <FileText className="h-4 w-4" />,
    command: () => {
      const url = prompt('Enter Google Docs URL:');
      if (url) {
        const match = url.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
        if (match) {
          const docId = match[1];
          editor.chain().focus().insertContent(`
            <div class="embed-container">
              <iframe 
                src="https://docs.google.com/document/d/${docId}/edit?usp=sharing" 
                width="100%" 
                height="600"
                class="docs-embed">
              </iframe>
            </div>
          `).run();
        }
      }
    },
  },
  {
    title: 'Google Sheets Embed',
    description: 'Embed a Google Sheets spreadsheet',
    icon: <Table className="h-4 w-4" />,
    command: () => {
      const url = prompt('Enter Google Sheets URL:');
      if (url) {
        const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (match) {
          const sheetId = match[1];
          editor.chain().focus().insertContent(`
            <div class="embed-container">
              <iframe 
                src="https://docs.google.com/spreadsheets/d/${sheetId}/edit?usp=sharing" 
                width="100%" 
                height="600"
                class="sheets-embed">
              </iframe>
            </div>
          `).run();
        }
      }
    },
  },
  {
    title: 'Table of Contents',
    description: 'Generate a table of contents',
    icon: <Menu className="h-4 w-4" />,
    command: () => {
      editor.chain().focus().clearNodes().insertContent(`
        <div class="table-of-contents">
          <h3>Table of Contents</h3>
          <div class="toc-content">
            <div class="toc-item">
              <a href="#section1">1. Introduction</a>
            </div>
            <div class="toc-item">
              <a href="#section2">2. Main Content</a>
            </div>
            <div class="toc-item">
              <a href="#section3">3. Conclusion</a>
            </div>
          </div>
        </div>
      `).run();
    },
  },
];