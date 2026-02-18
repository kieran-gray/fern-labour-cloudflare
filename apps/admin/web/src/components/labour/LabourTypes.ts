export interface LabourStatus {
  labour_id: string;
  mother_id: string;
  mother_name: string;
  current_phase: string;
  labour_name: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  do_cleaned_up_at: string | null;
}
