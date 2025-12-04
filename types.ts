export interface PaperAnalysis {
  title: string;
  hook_intro: string;
  detailed_summary: string;
  key_experiments: string[];
  innovations: string[];
  critical_evaluation: string;
  podcast_script: string;
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  SYNTHESIZING = 'SYNTHESIZING',
  READY = 'READY',
  ERROR = 'ERROR'
}

export interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  blobUrl: string | null;
}

export interface AnalysisInput {
  type: 'text' | 'pdf';
  data: string;
}