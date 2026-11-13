export type FileStatus = 'pending' | 'converting' | 'completed' | 'error';

export interface ConvertedDocument {
  id: string;
  file: File;
  name: string;
  size: number;
  status: FileStatus;
  progress?: number;
  markdownContent?: string;
  markdownFilename?: string;
  title?: string;
  wordCount?: number;
  charCount?: number;
  lineCount?: number;
  durationMs?: number;
  error?: string;
}

export interface BackendConversionResponse {
  success: boolean;
  filename: string;
  markdown_filename: string;
  title?: string;
  content: string;
  word_count: number;
  char_count: number;
  line_count: number;
  size_bytes: number;
  duration_ms: number;
  error?: string;
}

export interface BatchBackendResponse {
  total_files: number;
  successful_count: number;
  failed_count: number;
  total_duration_ms: number;
  results: BackendConversionResponse[];
}

export interface HealthInfo {
  status: string;
  app_name: string;
  version: string;
  engine: string;
  max_file_size_mb: number;
  max_batch_files: number;
}
