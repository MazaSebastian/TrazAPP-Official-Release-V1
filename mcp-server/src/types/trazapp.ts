export interface TrazAppRoom {
  id: string;
  name: string;
  type: 'vegetation' | 'flowering' | 'clones' | 'mother' | 'drying' | 'storage' | 'other';
  capacity?: number;
  current_plants?: number;
  is_indoor?: boolean;
  ideal_temp_min?: number;
  ideal_temp_max?: number;
  ideal_humidity_min?: number;
  ideal_humidity_max?: number;
  organization_id?: string;
  created_at?: string;
}

export interface TrazAppBatch {
  id: string;
  name: string;
  tracking_code?: string;
  genetics_id?: string;
  genetics_name?: string;
  room_id?: string;
  room_name?: string;
  stage: 'germination' | 'cloning' | 'vegetative' | 'pre_flowering' | 'flowering' | 'drying' | 'curing' | 'stored' | 'harvested' | 'destroyed';
  plant_count: number;
  start_date?: string;
  estimated_harvest_date?: string;
  parent_batch_id?: string;
  organization_id?: string;
  notes?: string;
  created_at?: string;
}

export interface TrazAppCrop {
  id: string;
  name: string;
  season?: string;
  start_date?: string;
  end_date?: string;
  status: 'active' | 'completed' | 'archived';
  organization_id?: string;
}

export interface TrazAppTask {
  id: string;
  title: string;
  description?: string;
  task_type?: string;
  due_date: string;
  completed: boolean;
  room_id?: string;
  batch_id?: string;
  assigned_to?: string;
  recurrence?: string;
  organization_id?: string;
  created_at?: string;
}

export interface TrazAppInsumo {
  id: string;
  name: string;
  category: string;
  current_stock: number;
  unit: string;
  min_stock_alert?: number;
  organization_id?: string;
}

export interface TrazAppDispensaryMovement {
  id: string;
  patient_id?: string;
  patient_name?: string;
  batch_id?: string;
  product_name: string;
  quantity: number;
  unit: string;
  transaction_type: 'entry' | 'dispense' | 'waste' | 'adjustment';
  notes?: string;
  organization_id?: string;
  created_at?: string;
}

export interface TrazAppTelemetry {
  id?: string;
  room_id: string;
  device_id?: string;
  temperature: number;
  humidity: number;
  vpd?: number;
  co2?: number;
  timestamp: string;
}
