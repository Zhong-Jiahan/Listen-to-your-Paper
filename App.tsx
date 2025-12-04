import React, { useState } from 'react';
import { AppState, PaperAnalysis, AnalysisInput } from './types';
import { analyzePaper, synthesizeSpeech } from './services/geminiService';
import InputSection from './components/InputSection';
import AnalysisView from './components/AnalysisView';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [analysisResult, setAnalysisResult] = useState<PaperAnalysis | null>(null);
  const [audioData, setAudioData] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");

  const handleAnalyze = async (input: AnalysisInput) => {
    setAppState(AppState.ANALYZING);
    setErrorMsg(null);
    setStatusMessage("Reading and analyzing paper structure...");

    try {
      // Step 1: Analyze Text or PDF
      const analysis = await analyzePaper(input);
      setAnalysisResult(analysis);
      
      // Step 2: Generate Audio
      setAppState(AppState.SYNTHESIZING);
      setStatusMessage("Synthesizing AI Podcast Voice (this may take a moment)...");
      
      const audioBase64 = await synthesizeSpeech(analysis.podcast_script);
      setAudioData(audioBase64);
      
      setAppState(AppState.READY);
    } catch (err) {
      console.error(err);
      setAppState(AppState.ERROR);
      setErrorMsg("An error occurred while processing your request. Please check your API key or try a shorter file/text.");
    }
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setAnalysisResult(null);
    setAudioData(null);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900 pb-20">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 bg-opacity-80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">P</div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
                PaperCast AI
              </span>
            </div>
            <div className="text-sm text-slate-500 hidden sm:block">
              Powered by Gemini 2.5 Flash
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Error Notification */}
        {appState === AppState.ERROR && (
          <div className="max-w-2xl mx-auto mb-8 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
            <div>
              <p className="font-bold">Error</p>
              <p className="text-sm">{errorMsg}</p>
              <button onClick={handleReset} className="text-sm underline mt-1 hover:text-red-800">Try Again</button>
            </div>
          </div>
        )}

        {/* Views */}
        {appState === AppState.IDLE && (
          <div className="animate-fade-in-up">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl mb-4">
                Listen to your Literature.
              </h1>
              <p className="text-lg text-slate-600">
                Give your eyes a rest. Upload academic PDF papers and let AI turn them into engaging, structured audio summaries.
              </p>
            </div>
            <InputSection onAnalyze={handleAnalyze} isLoading={false} />
          </div>
        )}

        {(appState === AppState.ANALYZING || appState === AppState.SYNTHESIZING) && (
           <div className="flex flex-col items-center justify-center py-20 animate-pulse">
             <div className="relative w-24 h-24 mb-8">
               <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-200 rounded-full"></div>
               <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
             </div>
             <h2 className="text-2xl font-bold text-slate-800 mb-2">{statusMessage}</h2>
             <p className="text-slate-500">This usually takes about 10-20 seconds.</p>
           </div>
        )}

        {appState === AppState.READY && analysisResult && (
          <AnalysisView 
            analysis={analysisResult} 
            audioBase64={audioData}
            onReset={handleReset}
          />
        )}
      </main>
    </div>
  );
};

export default App;