import React, { useMemo, useState } from 'react';
import { createEditor, Descendant } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import { withHistory } from 'slate-history';

const initialValue: Descendant[] = [
  {
    type: 'paragraph',
    children: [{ text: 'Type here and test the Enter key...' }],
  },
];

export const TestEditor: React.FC = () => {
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  const [value, setValue] = useState<Descendant[]>(initialValue);

  return (
    <div className="border p-4 rounded">
      <h3 className="mb-4 font-bold">Test Slate Editor (Press Enter to test)</h3>
      <Slate editor={editor} initialValue={value} onValueChange={setValue}>
        <Editable
          className="min-h-[100px] p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type here and press Enter..."
        />
      </Slate>
    </div>
  );
};