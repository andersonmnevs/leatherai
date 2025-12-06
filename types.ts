import { User as FirebaseUser } from '@firebase/auth';

export interface User extends FirebaseUser {}

export enum AnalysisStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface DefectItem {
  type: string;
  box_2d: number[]; // [ymin, xmin, ymax, xmax] na escala 0-1000
}

export interface AnalysisResult {
  quality: string; // e.g., "A", "B", "C"
  defects_detected: string[]; // Lista simples para compatibilidade
  defects_visual: DefectItem[]; // Lista detalhada com coordenadas
  confidence_level: number; // 0.0 to 1.0
  description: string;
}

export interface LeatherRecord {
  id: string;
  userId: string;
  lotId: string;
  imageUrl: string;
  storagePath: string;
  timestamp: number;
  status: AnalysisStatus;
  result?: AnalysisResult;
  notes?: string;
}

export interface UploadFormData {
  lotId: string;
  notes: string;
  file: File | null;
}