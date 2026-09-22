import React from 'react';
import { X, Code2 } from 'lucide-react';
import { CodeEditor } from './CodeEditor';
import { DynamicVariable } from '../types';

interface CodeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  onChangeCode: (code: string) => void;
  onRunAndSync: (code: string) => void;
  variables: DynamicVariable[];
  onOpenAiHelp: () => void;
  executionError: string | null;
}

export const CodeDrawer: React.FC<CodeDrawerProps> = ({
  isOpen,
  onClose,
  code,
  onChangeCode,
  onRunAndSync,
  variables,
  onOpenAiHelp,
  executionError,
}) => {
  return (
    <div
      id="code-slideout-drawer"
      className={`absolute top-0 left-0 bottom-0 z-30 w-full sm:w-[480px] lg:w-[540px] max-w-[95%] bg-white/95 backdrop-blur-md border-r border-zinc-200/90 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out text-zinc-900 ${
        isOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
      }`}
    >
      {/* Top Drawer Bar with Close Action */}
      <div className="px-4 py-2 border-b border-zinc-200/80 bg-zinc-50/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-zinc-900 text-white shadow-2xs">
            <Code2 className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-zinc-900">Pts.js Code Drawer</span>
          <span className="text-4xs text-zinc-500 font-mono hidden sm:inline">
            Slides into visualization frame
          </span>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-md text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors"
          title="Close Code Drawer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 overflow-hidden">
        <CodeEditor
          code={code}
          onChangeCode={onChangeCode}
          onRunAndSync={onRunAndSync}
          variables={variables}
          onOpenAiHelp={onOpenAiHelp}
          executionError={executionError}
        />
      </div>
    </div>
  );
};
