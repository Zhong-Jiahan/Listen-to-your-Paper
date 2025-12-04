import React, { useRef, useState } from 'react';
import { AnalysisInput } from '../types';

interface InputSectionProps {
  onAnalyze: (input: AnalysisInput) => void;
  isLoading: boolean;
}

const InputSection: React.FC<InputSectionProps> = ({ onAnalyze, isLoading }) => {
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState<{ name: string; type: 'text' | 'pdf'; data: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        // Extract base64 part from "data:application/pdf;base64,....."
        const base64 = result.split(',')[1];
        setSelectedFile({
          name: file.name,
          type: 'pdf',
          data: base64
        });
        setText(''); // Clear text input if file selected
      };
      reader.readAsDataURL(file);
    } else {
      // Treat as text/plain
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setText(event.target.result as string);
          // For text files, we just populate the text area, we don't treat it as a special binary file
          setSelectedFile(null); 
        }
      };
      reader.readAsText(file);
    }
    
    // Reset input so same file can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFile) {
      onAnalyze({ type: selectedFile.type, data: selectedFile.data });
    } else if (text.trim().length > 50) {
      onAnalyze({ type: 'text', data: text });
    }
  };

  const isButtonDisabled = isLoading || (!selectedFile && text.length < 50);

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Upload Paper or Paste Text</h2>
        <p className="text-slate-500">Upload a PDF or paste literature text to generate an audio summary.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          {selectedFile ? (
            <div className="w-full h-64 p-8 rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50 flex flex-col items-center justify-center text-center transition-all">
               <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
               </div>
               <h3 className="text-lg font-semibold text-indigo-900 mb-1">{selectedFile.name}</h3>
               <p className="text-indigo-600 text-sm mb-6">Ready to analyze</p>
               <button 
                type="button"
                onClick={handleRemoveFile}
                className="px-4 py-2 bg-white text-indigo-600 border border-indigo-200 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors shadow-sm"
               >
                 Remove File
               </button>
            </div>
          ) : (
            <>
              <textarea
                className="w-full h-64 p-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all resize-none text-slate-700 placeholder-slate-400 font-mono text-sm leading-relaxed"
                placeholder="Paste your abstract or full text here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={isLoading}
              ></textarea>
              
              {/* File Upload Trigger */}
              <div className="absolute bottom-4 right-4 flex space-x-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-md transition-colors flex items-center gap-2"
                  disabled={isLoading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                  Upload PDF / TXT
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".txt,.pdf"
                  className="hidden"
                />
              </div>
            </>
          )}
        </div>

        <button
          type="submit"
          disabled={isButtonDisabled}
          className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all transform hover:scale-[1.01] active:scale-[0.99] flex justify-center items-center gap-3
            ${isButtonDisabled
              ? 'bg-slate-300 cursor-not-allowed shadow-none' 
              : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}
        >
          {isLoading ? (
            <>
               <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Processing Literature...</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="23"/><line x1="8" x2="16" y1="23" y2="23"/></svg>
              <span>Generate Audio Podcast</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default InputSection;