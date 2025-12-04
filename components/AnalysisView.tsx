import React, { useEffect, useRef, useState } from 'react';
import { PaperAnalysis } from '../types';
import { createWavBlob, decodeBase64ToFloat32 } from '../utils/audioUtils';

interface AnalysisViewProps {
  analysis: PaperAnalysis;
  audioBase64: string | null;
  onReset: () => void;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ analysis, audioBase64, onReset }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'script'>('summary');
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const animationFrameRef = useRef<number>(0);

  // Initialize Audio Logic
  useEffect(() => {
    if (audioBase64) {
      const initAudio = async () => {
        try {
          const float32Data = decodeBase64ToFloat32(audioBase64);
          const wavBlob = createWavBlob(float32Data, 24000);
          const url = URL.createObjectURL(wavBlob);
          setDownloadUrl(url);

          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          audioContextRef.current = ctx;

          // Create AudioBuffer
          const buffer = ctx.createBuffer(1, float32Data.length, 24000);
          buffer.copyToChannel(float32Data, 0);
          audioBufferRef.current = buffer;
          setDuration(buffer.duration);
        } catch (e) {
          console.error("Audio initialization failed", e);
        }
      };
      initAudio();
    }

    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      if (audioContextRef.current) audioContextRef.current.close();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioBase64]);

  const togglePlayback = async () => {
    if (!audioContextRef.current || !audioBufferRef.current) return;

    if (isPlaying) {
      // Pause
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
        sourceNodeRef.current = null;
      }
      // Calculate elapsed time
      pauseTimeRef.current += audioContextRef.current.currentTime - startTimeRef.current;
      setIsPlaying(false);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    } else {
      // Play
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBufferRef.current;
      source.connect(audioContextRef.current.destination);
      
      // Handle end of playback
      source.onended = () => {
        // Only reset if we reached the end naturally, not manually stopped
        if (pauseTimeRef.current + (audioContextRef.current!.currentTime - startTimeRef.current) >= duration - 0.1) {
             setIsPlaying(false);
             pauseTimeRef.current = 0;
             setProgress(0);
        }
      };

      const offset = pauseTimeRef.current % duration;
      source.start(0, offset);
      sourceNodeRef.current = source;
      startTimeRef.current = audioContextRef.current.currentTime;
      setIsPlaying(true);
      
      // Update progress loop
      const updateProgress = () => {
        if (!audioContextRef.current) return;
        const elapsed = pauseTimeRef.current + (audioContextRef.current.currentTime - startTimeRef.current);
        setProgress(Math.min(elapsed / duration, 1));
        if (elapsed < duration) {
            animationFrameRef.current = requestAnimationFrame(updateProgress);
        }
      };
      updateProgress();
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in-up">
      {/* Header & Controls */}
      <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 sticky top-4 z-50">
        <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900 line-clamp-1">{analysis.title}</h1>
            <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-1 rounded">Audio Generated</span>
                <span className="text-xs text-slate-500">{formatTime(duration * progress)} / {formatTime(duration)}</span>
            </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
            {/* Play Button */}
            <button 
                onClick={togglePlayback}
                className="w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-lg hover:shadow-indigo-300 transition-all active:scale-95"
            >
                {isPlaying ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                )}
            </button>

            {/* Progress Bar (Visual only for now, can implement seeking later) */}
            <div className="flex-1 md:w-64 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-indigo-500 transition-all duration-100 ease-linear"
                    style={{ width: `${progress * 100}%` }}
                />
            </div>

            {/* Download */}
            {downloadUrl && (
                <a 
                    href={downloadUrl} 
                    download={`papercast-${analysis.title.substring(0, 20)}.wav`}
                    className="p-3 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                    title="Download Audio"
                >
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                </a>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Navigation Sidebar */}
        <div className="md:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-700">Content Sections</h3>
                </div>
                <div className="p-2 space-y-1">
                    <button 
                        onClick={() => setActiveTab('summary')}
                        className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'summary' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        Structured Analysis
                    </button>
                    <button 
                         onClick={() => setActiveTab('script')}
                        className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'script' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        Podcast Script
                    </button>
                </div>
            </div>

            <button onClick={onReset} className="w-full py-3 px-4 rounded-xl text-slate-500 text-sm hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200">
                Analyze Another Paper
            </button>
        </div>

        {/* Content Area */}
        <div className="md:col-span-2 space-y-6">
            {activeTab === 'summary' && (
                <div className="space-y-6 animate-fade-in">
                    <SectionCard title="Engaging Intro" icon="🎯" content={analysis.hook_intro} />
                    <SectionCard title="Detailed Summary" icon="📝" content={analysis.detailed_summary} />
                    
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-2xl">🧪</span>
                            <h3 className="text-lg font-bold text-slate-800">Key Experiments</h3>
                        </div>
                        <ul className="space-y-3">
                            {analysis.key_experiments.map((exp, i) => (
                                <li key={i} className="flex gap-3 text-slate-700">
                                    <span className="text-indigo-500 font-bold">•</span>
                                    {exp}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-2xl">💡</span>
                            <h3 className="text-lg font-bold text-slate-800">Innovations</h3>
                        </div>
                         <ul className="space-y-3">
                            {analysis.innovations.map((inv, i) => (
                                <li key={i} className="flex gap-3 text-slate-700">
                                    <span className="text-emerald-500 font-bold">✓</span>
                                    {inv}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <SectionCard title="Critical Evaluation" icon="⚖️" content={analysis.critical_evaluation} />
                </div>
            )}

            {activeTab === 'script' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 animate-fade-in">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <span className="text-2xl">🎙️</span>
                        Generated Podcast Script
                    </h3>
                    <div className="prose prose-slate max-w-none">
                        {analysis.podcast_script.split('\n').map((para, idx) => (
                            <p key={idx} className="mb-4 text-slate-700 leading-relaxed text-lg font-light">
                                {para}
                            </p>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

const SectionCard = ({ title, icon, content }: { title: string, icon: string, content: string }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">{icon}</span>
            <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        </div>
        <p className="text-slate-700 leading-relaxed whitespace-pre-line">{content}</p>
    </div>
);

export default AnalysisView;
