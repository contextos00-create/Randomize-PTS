import React, { useState } from 'react';
import {
  X,
  Code2,
  FileCode2,
  Plus,
  Trash2,
  Play,
  Sparkles,
  Bot,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { CodeEditor } from './CodeEditor';
import { DynamicVariable, PtsCodeFile } from '../types';
import { useStudioStore } from '../store/studioStore';

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
  const {
    codeFiles,
    activeCodeFileId,
    setActiveCodeFileId,
    updateCodeFile,
    addCodeFile,
    deleteCodeFile,
  } = useStudioStore();

  const [isAddingFile, setIsAddingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  const activeFile =
    codeFiles.find((f) => f.id === activeCodeFileId) || codeFiles[0];

  const handleSelectFile = (file: PtsCodeFile) => {
    setActiveCodeFileId(file.id);
    onChangeCode(file.code);
  };

  const handleCreateFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    addCodeFile(newFileName.trim());
    setNewFileName('');
    setIsAddingFile(false);
  };

  const handleEditorCodeChange = (newCode: string) => {
    onChangeCode(newCode);
    if (activeFile) {
      updateCodeFile(activeFile.id, newCode);
    }
  };

  return (
    <div
      id="code-slideout-drawer"
      className={`absolute top-0 left-0 bottom-0 z-30 w-full sm:w-[520px] lg:w-[580px] max-w-[95%] bg-white/95 backdrop-blur-md border-r border-zinc-200/90 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out text-zinc-900 ${
        isOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
      }`}
    >
      {/* Top Drawer Bar */}
      <div className="px-4 py-2.5 border-b border-zinc-200/80 bg-zinc-50/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-zinc-900 text-white shadow-2xs">
            <Code2 className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-zinc-900">Pts.js Code Feature</span>
              <span className="text-4xs px-1.5 py-0.2 rounded bg-violet-100 text-violet-700 font-mono font-medium">
                Live Kernel
              </span>
            </div>
            <p className="text-4xs text-zinc-500 font-mono">
              Select and edit .tsx files to dynamically inject canvas shaders
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenAiHelp}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-black text-white text-3xs font-medium transition-colors shadow-2xs"
            title="Ask AI to write Pts.js functions"
          >
            <Bot className="w-3 h-3 text-zinc-300" />
            <span>AI Help</span>
          </button>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors"
            title="Close Code Drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TSX Files Selector Bar */}
      <div className="px-3 py-1.5 border-b border-zinc-200/80 bg-zinc-100/70 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <span className="text-4xs font-mono uppercase font-bold text-zinc-400 shrink-0 mr-1 flex items-center gap-1">
          <FileCode2 className="w-3 h-3" />
          <span>Files:</span>
        </span>

        {codeFiles.map((file) => {
          const isSelected = file.id === activeCodeFileId;
          return (
            <div
              key={file.id}
              onClick={() => handleSelectFile(file)}
              className={`group shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-3xs font-mono transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-white border-zinc-300 text-zinc-900 font-bold shadow-2xs ring-1 ring-zinc-900/10'
                  : 'bg-zinc-200/60 border-transparent text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900'
              }`}
            >
              <FileCode2
                className={`w-3 h-3 ${isSelected ? 'text-violet-600' : 'text-zinc-400'}`}
              />
              <span>{file.name}</span>

              {codeFiles.length > 1 && !file.isDefault && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteCodeFile(file.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-opacity p-0.5"
                  title="Delete file"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          );
        })}

        {/* Add File Button */}
        {isAddingFile ? (
          <form onSubmit={handleCreateFile} className="flex items-center gap-1 shrink-0">
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="e.g. MyVortex.tsx"
              autoFocus
              className="px-2 py-0.5 text-3xs font-mono bg-white border border-zinc-300 rounded focus:outline-hidden"
            />
            <button
              type="submit"
              className="px-2 py-0.5 rounded bg-zinc-900 text-white text-3xs font-medium"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setIsAddingFile(false)}
              className="p-1 text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-3 h-3" />
            </button>
          </form>
        ) : (
          <button
            onClick={() => setIsAddingFile(true)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-3xs font-mono text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/80 transition-colors shrink-0 border border-dashed border-zinc-300"
            title="Create new .tsx canvas file"
          >
            <Plus className="w-3 h-3" />
            <span>.tsx</span>
          </button>
        )}
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="px-4 py-1.5 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between text-4xs text-zinc-500 font-mono">
          <span>Editing: <strong className="text-zinc-800">{activeFile?.name}</strong></span>
          <button
            onClick={() => onRunAndSync(code)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-violet-600 hover:bg-violet-700 text-white font-semibold transition-colors shadow-2xs"
            title="Compile and sync to active canvas layer"
          >
            <Play className="w-3 h-3" />
            <span>Run & Sync to Layer</span>
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          <CodeEditor
            code={code}
            onChangeCode={handleEditorCodeChange}
            onRunAndSync={onRunAndSync}
            variables={variables}
            onOpenAiHelp={onOpenAiHelp}
            executionError={executionError}
          />
        </div>
      </div>
    </div>
  );
};
