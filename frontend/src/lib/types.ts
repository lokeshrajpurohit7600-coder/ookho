export interface UploadResponse {
  upload_id: string;
  user_id?: string;
  file_type: 'image' | 'video' | 'text';
  file_url?: string;
  original_filename?: string;
  uploaded_at?: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
}

export interface BoundingBox {
  x: number;      // 0-100 percentage
  y: number;      // 0-100 percentage
  width: number;  // 0-100 percentage
  height: number; // 0-100 percentage
}

export interface EditedRegionBox {
  id: string;
  type: 'box';
  label: string;
  confidence: number;
  box: BoundingBox;
  description?: string;
}

export interface HeatmapPoint {
  x: number;      // 0-100 percentage
  y: number;      // 0-100 percentage
  intensity: number; // 0.0 - 1.0
  radius?: number;
}

export interface EditedRegionHeatmap {
  type: 'heatmap';
  points: HeatmapPoint[];
}

export interface EditedRegionTextSpan {
  id: string;
  type: 'text_span';
  label: string;
  confidence: number;
  span: { start: number; end: number };
  description?: string;
}

export type EditedRegion = EditedRegionBox | EditedRegionHeatmap | EditedRegionTextSpan;

export interface DetectionReport {
  id?: string;
  upload_id: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  file_type?: 'image' | 'video' | 'text';
  file_url?: string;
  original_filename?: string;
  ai_confidence?: number | null;
  edit_confidence?: number | null;
  edited_regions?: EditedRegion[] | null;
  detected_techniques?: string[] | null;
  metadata_findings?: Record<string, any> | null;
  model_versions?: Record<string, string> | null;
  summary_text?: string | null;
  created_at?: string | null;
}

export interface EvidenceItem {
  key: string;
  name: string;
  score: number;
  threshold: number;
  triggered: boolean;
  details?: string;
  note?: string;
}

export interface HistoryItem {
  upload_id: string;
  file_type: 'image' | 'video' | 'text';
  file_url?: string;
  original_filename: string;
  uploaded_at?: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  ai_confidence?: number | null;
  edit_confidence?: number | null;
  verdict?: string | null;
  verdict_label?: string | null;
  summary_text?: string | null;
}

export interface HistoryResponse {
  items: HistoryItem[];
  total: number;
  limit: number;
  offset: number;
}

