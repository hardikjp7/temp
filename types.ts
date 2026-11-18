// Contract version: v1 (must match the header of docs/spec.md; bump only when Hardik sends a new bundle)
// Mirrors docs/spec.md (section 5 and 6). If this file and the spec disagree, the spec wins.
// Do not add fields here that the backend does not return.

export type AttackType =
  | 'phishing'
  | 'ransomware'
  | 'credential_stuffing'
  | 'ddos'
  | 'public_s3_bucket'
  | 'unknown';

export type Severity = 'low' | 'medium' | 'high' | 'critical';

export type ChecklistStatus = 'grounded' | 'low_confidence' | 'no_matching_sop';

export interface Citation {
  playbook_id: string; // e.g. PB-RAN
  step_id: string; // e.g. PB-RAN-02
  source_text: string; // exact playbook step line, show it in the citation panel
}

export interface Iocs {
  ips: string[];
  domains: string[];
  urls: string[];
  hashes: string[];
  emails: string[];
  users: string[];
  cve_ids: string[];
  resources: string[];
}

export interface ParsedAlert {
  alert_id: string;
  source: string; // 'unknown' when absent
  timestamp: string | null; // ISO 8601
  attack_type: AttackType;
  severity: Severity;
  confidence: number; // 0..1
  summary: string;
  iocs: Iocs;
  evidence_fields: string[]; // JSON paths that drove the classification
  redacted: boolean;
}

export interface Step {
  order: number; // 1-based, contiguous
  action: string;
  rationale: string;
  citation: Citation;
  verified: boolean;
  support: 'supported' | 'partial';
}

export interface RelatedCve {
  id: string;
  severity: Severity;
  cvss: number | null;
  remediation: string;
}

export interface Checklist {
  alert_id: string;
  status: ChecklistStatus;
  playbook_id: string | null;
  retrieval_confidence: number; // 0..1
  steps: Step[];
  related_cves: RelatedCve[];
  escalation_note: string; // set when status is not 'grounded', else ''
  dropped_count: number; // steps removed by the verifier
}

export interface TimingsMs {
  parse: number;
  retrieve: number;
  generate: number;
  verify: number;
  total: number;
}

export interface RunResponse {
  run_id: string;
  parsed: ParsedAlert;
  checklist: Checklist;
  timings_ms: TimingsMs;
}

export interface TimelineEvent {
  time: string | null;
  event: string;
}

export interface RootCause {
  hypothesis: string; // always label in the UI as a hypothesis
  confidence: number; // 0..1
  basis: string[];
}

export interface ContainmentAction {
  action: string;
  citation: Citation;
  status: 'recommended' | 'approved';
}

export interface IncidentTicket {
  ticket_id: string; // INC-YYYYMMDD-NNN
  run_id: string;
  title: string;
  severity: Severity;
  status: 'draft' | 'approved';
  timeline: TimelineEvent[];
  root_cause: RootCause;
  iocs: Iocs;
  containment_actions: ContainmentAction[];
  affected_assets: string[];
  cves: string[];
  approved_by: string | null;
  approved_at: string | null; // ISO 8601
  audit_ref: string; // run_id
}

export type AuditStage = 'parse' | 'retrieve' | 'generate' | 'verify' | 'ticket' | 'approve';

export interface AuditRow {
  id: number;
  run_id: string;
  stage: AuditStage;
  ts: string; // ISO 8601
  model: string | null;
  input_hash: string;
  output_hash: string;
  details_json: Record<string, unknown>;
}

export interface SearchHit {
  playbook_id: string;
  step_id: string;
  text: string;
  score: number;
}

export interface HealthResponse {
  status: 'ok';
  mock: boolean;
  index_chunks: number;
}

export interface SampleAlert {
  id: string;
  name: string;
  alert: Record<string, unknown>;
}

export type ApiErrorCode =
  | 'invalid_json'
  | 'payload_too_large'
  | 'validation_error'
  | 'not_found'
  | 'already_approved'
  | 'llm_unavailable';

export interface ApiError {
  error: { code: ApiErrorCode; message: string; details?: unknown };
}

// All UI network access goes through this interface (real client or mock client).
export interface ApiClient {
  health(): Promise<HealthResponse>;
  samples(): Promise<SampleAlert[]>;
  run(alert: Record<string, unknown>): Promise<RunResponse>;
  parse(alert: Record<string, unknown>): Promise<ParsedAlert>;
  checklist(parsed: ParsedAlert): Promise<Checklist>;
  createTicket(runId: string): Promise<IncidentTicket>;
  approve(ticketId: string, analystName: string): Promise<IncidentTicket>;
  exportTicketMarkdown(ticketId: string): Promise<string>;
  search(q: string, k?: number): Promise<SearchHit[]>;
  audit(runId: string): Promise<AuditRow[]>;
}
