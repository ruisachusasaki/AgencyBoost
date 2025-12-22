import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { 
  CheckSquare, Code, AlertCircle, Info, AlertTriangle, 
  Columns, ChevronRight, Type, List, ListOrdered, Quote,
  Heading1, Heading2, Heading3, Table, Link, Image, 
  Menu, Video, FileText, Youtube, ExternalLink, Minus,
  LayoutGrid, MessageSquare, Lightbulb, Zap, Star
} from 'lucide-react';

interface CommandItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  command: () => void;
  category: string;
  keywords?: string[];
}

export interface SlashCommandProps {
  items: CommandItem[];
  command: (item: any) => void;
}

export const SlashCommand = forwardRef<any, SlashCommandProps>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = props.items.filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.keywords?.some(k => k.toLowerCase().includes(query))
    );
  });

  const selectItem = (index: number) => {
    const item = filteredItems[index];
    if (item) {
      props.command(item);
    }
  };

  const upHandler = () => {
    setSelectedIndex((prevIndex) => 
      prevIndex <= 0 ? filteredItems.length - 1 : prevIndex - 1
    );
  };

  const downHandler = () => {
    setSelectedIndex((prevIndex) => 
      prevIndex >= filteredItems.length - 1 ? 0 : prevIndex + 1
    );
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [props.items, searchQuery]);

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

      if (event.key === 'Backspace') {
        setSearchQuery(prev => prev.slice(0, -1));
        return true;
      }

      if (event.key === 'Escape') {
        return false;
      }

      if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
        setSearchQuery(prev => prev + event.key);
        return true;
      }

      return false;
    },
  }));

  const groupedItems = filteredItems.reduce((acc, item, index) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push({ ...item, globalIndex: index });
    return acc;
  }, {} as Record<string, (CommandItem & { globalIndex: number })[]>);

  const categoryOrder = ['Basic', 'Lists', 'Callouts', 'Layout', 'Media', 'Embeds', 'Advanced'];

  return (
    <div className="slash-command-menu bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-[400px] overflow-y-auto w-72" data-testid="slash-command-menu">
      <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-3 py-2">
        {searchQuery ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Filter:</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{searchQuery}</span>
          </div>
        ) : (
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Type to filter...
          </div>
        )}
      </div>
      
      {categoryOrder.map((category) => {
        const items = groupedItems[category];
        if (!items || items.length === 0) return null;
        
        return (
          <div key={category}>
            <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
              {category}
            </div>
            {items.map((item) => (
              <button
                key={item.globalIndex}
                className={`
                  w-full text-left px-3 py-2 flex items-center gap-3 transition-colors
                  ${item.globalIndex === selectedIndex 
                    ? 'bg-primary/10 border-l-2 border-primary' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800 border-l-2 border-transparent'}
                `}
                onClick={() => selectItem(item.globalIndex)}
                data-testid={`slash-command-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center ${
                  item.globalIndex === selectedIndex 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}>
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{item.title}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.description}</div>
                </div>
              </button>
            ))}
          </div>
        );
      })}
      
      {filteredItems.length === 0 && (
        <div className="px-3 py-8 text-center text-gray-500 dark:text-gray-400">
          <div className="text-sm">No commands found</div>
          <div className="text-xs mt-1">Try a different search</div>
        </div>
      )}
    </div>
  );
});

SlashCommand.displayName = 'SlashCommand';

export const getSlashCommands = (editor: any): CommandItem[] => [
  {
    title: 'Text',
    description: 'Plain text paragraph',
    icon: <Type className="h-4 w-4" />,
    category: 'Basic',
    keywords: ['paragraph', 'normal', 'plain'],
    command: () => {
      editor.chain().focus().clearNodes().run();
    },
  },
  {
    title: 'Heading 1',
    description: 'Large section heading',
    icon: <Heading1 className="h-4 w-4" />,
    category: 'Basic',
    keywords: ['h1', 'title', 'big'],
    command: () => {
      editor.chain().focus().clearNodes().setHeading({ level: 1 }).run();
    },
  },
  {
    title: 'Heading 2',
    description: 'Medium section heading',
    icon: <Heading2 className="h-4 w-4" />,
    category: 'Basic',
    keywords: ['h2', 'subtitle'],
    command: () => {
      editor.chain().focus().clearNodes().setHeading({ level: 2 }).run();
    },
  },
  {
    title: 'Heading 3',
    description: 'Small section heading',
    icon: <Heading3 className="h-4 w-4" />,
    category: 'Basic',
    keywords: ['h3', 'subheading'],
    command: () => {
      editor.chain().focus().clearNodes().setHeading({ level: 3 }).run();
    },
  },
  {
    title: 'Quote',
    description: 'Capture a quote or citation',
    icon: <Quote className="h-4 w-4" />,
    category: 'Basic',
    keywords: ['blockquote', 'citation'],
    command: () => {
      editor.chain().focus().clearNodes().setBlockquote().run();
    },
  },
  {
    title: 'Divider',
    description: 'Visual separator line',
    icon: <Minus className="h-4 w-4" />,
    category: 'Basic',
    keywords: ['hr', 'horizontal rule', 'separator', 'line'],
    command: () => {
      editor.chain().focus().setHorizontalRule().run();
    },
  },
  {
    title: 'Code Block',
    description: 'Code snippet with syntax',
    icon: <Code className="h-4 w-4" />,
    category: 'Basic',
    keywords: ['pre', 'programming', 'syntax'],
    command: () => {
      editor.chain().focus().clearNodes().setCodeBlock().run();
    },
  },
  {
    title: 'Bullet List',
    description: 'Simple bullet points',
    icon: <List className="h-4 w-4" />,
    category: 'Lists',
    keywords: ['ul', 'unordered'],
    command: () => {
      editor.chain().focus().clearNodes().toggleBulletList().run();
    },
  },
  {
    title: 'Numbered List',
    description: 'List with numbers',
    icon: <ListOrdered className="h-4 w-4" />,
    category: 'Lists',
    keywords: ['ol', 'ordered'],
    command: () => {
      editor.chain().focus().clearNodes().toggleOrderedList().run();
    },
  },
  {
    title: 'To-do List',
    description: 'Checklist with tasks',
    icon: <CheckSquare className="h-4 w-4" />,
    category: 'Lists',
    keywords: ['checkbox', 'task', 'checklist'],
    command: () => {
      editor.chain().focus().clearNodes().toggleTaskList().run();
    },
  },
  {
    title: 'Info Callout',
    description: 'Highlight important info',
    icon: <Info className="h-4 w-4" />,
    category: 'Callouts',
    keywords: ['note', 'information', 'blue'],
    command: () => {
      editor.chain().focus().clearNodes().insertContent(`
        <div class="callout callout-info">
          <div class="callout-icon">ℹ️</div>
          <div class="callout-content">
            <p>This is an info callout. Edit this text.</p>
          </div>
        </div>
      `).run();
    },
  },
  {
    title: 'Warning Callout',
    description: 'Warning or caution notice',
    icon: <AlertTriangle className="h-4 w-4" />,
    category: 'Callouts',
    keywords: ['caution', 'alert', 'yellow'],
    command: () => {
      editor.chain().focus().clearNodes().insertContent(`
        <div class="callout callout-warning">
          <div class="callout-icon">⚠️</div>
          <div class="callout-content">
            <p>This is a warning callout. Edit this text.</p>
          </div>
        </div>
      `).run();
    },
  },
  {
    title: 'Danger Callout',
    description: 'Critical alert or error',
    icon: <AlertCircle className="h-4 w-4" />,
    category: 'Callouts',
    keywords: ['error', 'critical', 'red'],
    command: () => {
      editor.chain().focus().clearNodes().insertContent(`
        <div class="callout callout-danger">
          <div class="callout-icon">🚨</div>
          <div class="callout-content">
            <p>This is a danger callout. Edit this text.</p>
          </div>
        </div>
      `).run();
    },
  },
  {
    title: 'Success Callout',
    description: 'Success or completion notice',
    icon: <CheckSquare className="h-4 w-4" />,
    category: 'Callouts',
    keywords: ['done', 'complete', 'green'],
    command: () => {
      editor.chain().focus().clearNodes().insertContent(`
        <div class="callout callout-success">
          <div class="callout-icon">✅</div>
          <div class="callout-content">
            <p>This is a success callout. Edit this text.</p>
          </div>
        </div>
      `).run();
    },
  },
  {
    title: 'Tip Callout',
    description: 'Helpful tip or suggestion',
    icon: <Lightbulb className="h-4 w-4" />,
    category: 'Callouts',
    keywords: ['hint', 'idea', 'suggestion'],
    command: () => {
      editor.chain().focus().clearNodes().insertContent(`
        <div class="callout callout-tip">
          <div class="callout-icon">💡</div>
          <div class="callout-content">
            <p>This is a tip callout. Edit this text.</p>
          </div>
        </div>
      `).run();
    },
  },
  {
    title: 'Toggle',
    description: 'Collapsible content section',
    icon: <ChevronRight className="h-4 w-4" />,
    category: 'Layout',
    keywords: ['collapse', 'expand', 'accordion', 'dropdown'],
    command: () => {
      editor.chain().focus().insertContent({
        type: 'toggle',
        attrs: { open: true, summary: 'Click to expand...' },
        content: [{ type: 'paragraph' }],
      }).run();
    },
  },
  {
    title: 'Two Columns',
    description: 'Side by side layout',
    icon: <Columns className="h-4 w-4" />,
    category: 'Layout',
    keywords: ['split', 'side'],
    command: () => {
      editor.chain().focus().clearNodes().insertContent(`
        <div class="columns-container">
          <div class="column">
            <p>Left column</p>
          </div>
          <div class="column">
            <p>Right column</p>
          </div>
        </div>
      `).run();
    },
  },
  {
    title: 'Three Columns',
    description: 'Three column layout',
    icon: <LayoutGrid className="h-4 w-4" />,
    category: 'Layout',
    keywords: ['grid', 'triple'],
    command: () => {
      editor.chain().focus().clearNodes().insertContent(`
        <div class="columns-container columns-3">
          <div class="column">
            <p>Column 1</p>
          </div>
          <div class="column">
            <p>Column 2</p>
          </div>
          <div class="column">
            <p>Column 3</p>
          </div>
        </div>
      `).run();
    },
  },
  {
    title: 'Table',
    description: 'Insert data table',
    icon: <Table className="h-4 w-4" />,
    category: 'Layout',
    keywords: ['grid', 'rows', 'columns', 'spreadsheet'],
    command: () => {
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    },
  },
  {
    title: 'Table of Contents',
    description: 'Auto-generate from headings',
    icon: <Menu className="h-4 w-4" />,
    category: 'Layout',
    keywords: ['toc', 'navigation', 'index'],
    command: () => {
      editor.chain().focus().clearNodes().insertContent(`
        <div class="table-of-contents">
          <h4>📑 Table of Contents</h4>
          <div class="toc-content">
            <p class="toc-item"><a href="#section1">1. Introduction</a></p>
            <p class="toc-item"><a href="#section2">2. Main Content</a></p>
            <p class="toc-item"><a href="#section3">3. Conclusion</a></p>
          </div>
        </div>
      `).run();
    },
  },
  {
    title: 'Image',
    description: 'Upload or embed image',
    icon: <Image className="h-4 w-4" />,
    category: 'Media',
    keywords: ['photo', 'picture', 'upload'],
    command: () => {
      const url = prompt('Enter image URL:');
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    },
  },
  {
    title: 'Link',
    description: 'Add a hyperlink',
    icon: <Link className="h-4 w-4" />,
    category: 'Media',
    keywords: ['url', 'href', 'anchor'],
    command: () => {
      const url = prompt('Enter URL:');
      if (url) {
        editor.chain().focus().setLink({ href: url }).run();
      }
    },
  },
  {
    title: 'YouTube Video',
    description: 'Embed YouTube video',
    icon: <Youtube className="h-4 w-4" />,
    category: 'Embeds',
    keywords: ['video', 'embed', 'youtube'],
    command: () => {
      const url = prompt('Enter YouTube URL:');
      if (url) {
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
        if (match) {
          const videoId = match[1];
          editor.chain().focus().insertContent(`
            <div class="embed-container youtube-embed-wrapper">
              <iframe 
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
    title: 'Loom Video',
    description: 'Embed Loom recording',
    icon: <Video className="h-4 w-4" />,
    category: 'Embeds',
    keywords: ['screen recording', 'loom'],
    command: () => {
      const url = prompt('Enter Loom URL:');
      if (url) {
        const match = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
        if (match) {
          const videoId = match[1];
          editor.chain().focus().insertContent(`
            <div class="embed-container loom-embed-wrapper">
              <iframe 
                src="https://www.loom.com/embed/${videoId}" 
                frameborder="0" 
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
    title: 'Google Drive',
    description: 'Embed Drive file',
    icon: <FileText className="h-4 w-4" />,
    category: 'Embeds',
    keywords: ['drive', 'google', 'file'],
    command: () => {
      const url = prompt('Enter Google Drive share URL:');
      if (url) {
        const match = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
        if (match) {
          const fileId = match[1];
          editor.chain().focus().insertContent(`
            <div class="embed-container drive-embed-wrapper">
              <iframe 
                src="https://drive.google.com/file/d/${fileId}/preview" 
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
    title: 'Google Slides',
    description: 'Embed presentation',
    icon: <ExternalLink className="h-4 w-4" />,
    category: 'Embeds',
    keywords: ['slides', 'presentation', 'powerpoint'],
    command: () => {
      const url = prompt('Enter Google Slides URL:');
      if (url) {
        const match = url.match(/\/presentation\/d\/([a-zA-Z0-9-_]+)/);
        if (match) {
          const presentationId = match[1];
          editor.chain().focus().insertContent(`
            <div class="embed-container slides-embed-wrapper">
              <iframe 
                src="https://docs.google.com/presentation/d/${presentationId}/embed?start=false&loop=false" 
                frameborder="0"
                allowfullscreen="true"
                class="slides-embed">
              </iframe>
            </div>
          `).run();
        }
      }
    },
  },
  {
    title: 'Google Docs',
    description: 'Embed document',
    icon: <FileText className="h-4 w-4" />,
    category: 'Embeds',
    keywords: ['docs', 'document', 'word'],
    command: () => {
      const url = prompt('Enter Google Docs URL:');
      if (url) {
        const match = url.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
        if (match) {
          const docId = match[1];
          editor.chain().focus().insertContent(`
            <div class="embed-container docs-embed-wrapper">
              <iframe 
                src="https://docs.google.com/document/d/${docId}/preview" 
                class="docs-embed">
              </iframe>
            </div>
          `).run();
        }
      }
    },
  },
  {
    title: 'Google Sheets',
    description: 'Embed spreadsheet',
    icon: <Table className="h-4 w-4" />,
    category: 'Embeds',
    keywords: ['sheets', 'spreadsheet', 'excel'],
    command: () => {
      const url = prompt('Enter Google Sheets URL:');
      if (url) {
        const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (match) {
          const sheetId = match[1];
          editor.chain().focus().insertContent(`
            <div class="embed-container sheets-embed-wrapper">
              <iframe 
                src="https://docs.google.com/spreadsheets/d/${sheetId}/preview"
                class="sheets-embed">
              </iframe>
            </div>
          `).run();
        }
      }
    },
  },
  {
    title: 'Button',
    description: 'Call-to-action button',
    icon: <Zap className="h-4 w-4" />,
    category: 'Advanced',
    keywords: ['cta', 'action', 'click'],
    command: () => {
      const text = prompt('Button text:', 'Click Here');
      const url = prompt('Button URL:');
      if (text && url) {
        editor.chain().focus().insertContent(`
          <p><a href="${url}" class="inline-button" target="_blank">${text}</a></p>
        `).run();
      }
    },
  },
  {
    title: 'Highlight Box',
    description: 'Emphasized content box',
    icon: <Star className="h-4 w-4" />,
    category: 'Advanced',
    keywords: ['box', 'emphasis', 'featured'],
    command: () => {
      editor.chain().focus().clearNodes().insertContent(`
        <div class="highlight-box">
          <p>⭐ This is a highlighted section. Edit this content.</p>
        </div>
      `).run();
    },
  },
  {
    title: 'Quote with Author',
    description: 'Attributed quotation',
    icon: <MessageSquare className="h-4 w-4" />,
    category: 'Advanced',
    keywords: ['citation', 'author', 'attributed'],
    command: () => {
      editor.chain().focus().clearNodes().insertContent(`
        <blockquote class="quote-with-author">
          <p>"Your quote goes here..."</p>
          <footer>— Author Name</footer>
        </blockquote>
      `).run();
    },
  },
];
