// Schema-valid mock data for UI development. All names, IDs, IPs and CVEs are fictional.
// Real playbook text will differ; the UI must not depend on this wording.
import type {
  AuditRow,
  IncidentTicket,
  RunResponse,
  SampleAlert,
} from '../api/types';

export const samples: SampleAlert[] = [
  {
    id: 'ransomware-fin-ws',
    name: 'Ransomware on a finance workstation',
    alert: {
      id: 'EDR-77310',
      sensor: 'EDR',
      detected_at: '2026-11-17T02:41:09Z',
      host: { name: 'FIN-WS-014', ip: '198.51.100.23' },
      user: 'svc_backup',
      alerts: [
        { type: 'mass_file_rename', count: 4821, new_extension: '.locked' },
        { type: 'shadow_copy_deletion', cmd: 'vssadmin delete shadows /all /quiet' },
      ],
      ransom_note: 'README_RESTORE.txt',
      severity: 'critical',
    },
  },
  {
    id: 'phishing-credential-link',
    name: 'Phishing email with a clicked link',
    alert: {
      alert_id: 'EML-20261117-0042',
      source: 'MailGuard',
      time: '2026-11-17T08:12:45Z',
      rule: 'Suspicious email with credential harvesting link',
      sender: 'it-support@corp-helpdesk.example.net',
      recipients: ['a.rao@corp.example', 'm.lee@corp.example'],
      url: 'https://login-corp-sso.example.org/verify',
      user_clicked: ['m.lee@corp.example'],
      verdict: 'malicious',
    },
  },
  {
    id: 'credential-stuffing-login',
    name: 'Credential stuffing against the login API',
    alert: {
      alert_id: 'IDP-5521',
      source: 'IdP-Monitor',
      event: 'high_volume_failed_logins',
      failed_attempts: 18432,
      unique_usernames: 6120,
      unique_source_ips: 214,
      top_source_ips: ['203.0.113.50', '203.0.113.51'],
      successful_logins_after_failures: 37,
    },
  },
  {
    id: 'public-s3-exports',
    name: 'Public S3 bucket with customer exports',
    alert: {
      finding_id: 'CSPM-2210',
      source: 'CloudPosture',
      resource: 's3://corp-example-customer-exports',
      issue: 'Bucket ACL grants public read (AllUsers)',
      contains_pii_tag: true,
    },
  },
  {
    id: 'ambiguous-ueba',
    name: 'Ambiguous: new-country login plus large download',
    alert: {
      alert_id: 'UEBA-1188',
      source: 'UEBA',
      user: 'd.shah',
      signals: ['login from a new country', 'download of 2.3 GB from a file share'],
      risk_score: 71,
    },
  },
  {
    id: 'no-match-usb',
    name: 'No matching playbook: USB data copy',
    alert: {
      id: 'DLP-3320',
      source: 'EndpointDLP',
      user: 'r.nair',
      host: 'HR-LT-031',
      event: 'Large file copy to removable USB drive',
      size_mb: 1840,
    },
  },
];

const emptyIocs = {
  ips: [],
  domains: [],
  urls: [],
  hashes: [],
  emails: [],
  users: [],
  cve_ids: [],
  resources: [],
};

export const groundedRun: RunResponse = {
  run_id: 'RUN-demo-grounded',
  parsed: {
    alert_id: 'EDR-77310',
    source: 'EDR',
    timestamp: '2026-11-17T02:41:09Z',
    attack_type: 'ransomware',
    severity: 'critical',
    confidence: 0.96,
    summary:
      'Mass file renames with a .locked extension and shadow copy deletion on FIN-WS-014 indicate active ransomware encryption. A ransom note was dropped on the host.',
    iocs: {
      ...emptyIocs,
      ips: ['198.51.100.23'],
      users: ['svc_backup'],
      cve_ids: ['CVE-2026-1001'],
      resources: ['FIN-WS-014'],
    },
    evidence_fields: ['alerts[0].type', 'alerts[1].cmd', 'ransom_note'],
    redacted: true,
  },
  checklist: {
    alert_id: 'EDR-77310',
    status: 'grounded',
    playbook_id: 'PB-RAN',
    retrieval_confidence: 0.82,
    steps: [
      {
        order: 1,
        action: 'Confirm encryption activity on FIN-WS-014 in the EDR console.',
        rationale: 'Validates the alert before disruptive containment.',
        citation: {
          playbook_id: 'PB-RAN',
          step_id: 'PB-RAN-01',
          source_text:
            'PB-RAN-01 | Detect | Confirm encryption activity on the reported host in the EDR console. | SOC Tier 1',
        },
        verified: true,
        support: 'supported',
      },
      {
        order: 2,
        action: 'Isolate FIN-WS-014 from the network via EDR.',
        rationale: 'Stops lateral spread and further encryption of shares.',
        citation: {
          playbook_id: 'PB-RAN',
          step_id: 'PB-RAN-02',
          source_text:
            'PB-RAN-02 | Contain | Isolate the affected host from the network via EDR. | SOC Tier 2',
        },
        verified: true,
        support: 'supported',
      },
      {
        order: 3,
        action: 'Disable the svc_backup account and revoke its active sessions.',
        rationale: 'The account was active on the host during encryption.',
        citation: {
          playbook_id: 'PB-RAN',
          step_id: 'PB-RAN-03',
          source_text:
            'PB-RAN-03 | Contain | Disable accounts active on the affected host and revoke sessions. | IAM Admin',
        },
        verified: true,
        support: 'supported',
      },
      {
        order: 4,
        action: 'Identify the initial access vector from the EDR process tree and email logs.',
        rationale: 'Needed to close the entry point before recovery.',
        citation: {
          playbook_id: 'PB-RAN',
          step_id: 'PB-RAN-05',
          source_text:
            'PB-RAN-05 | Investigate | Identify the initial access vector using process trees and mail logs. | SOC Tier 2',
        },
        verified: true,
        support: 'partial',
      },
      {
        order: 5,
        action: 'Block identified malicious hashes and domains at EDR and the web proxy.',
        rationale: 'Prevents reinfection from the same tooling.',
        citation: {
          playbook_id: 'PB-RAN',
          step_id: 'PB-RAN-07',
          source_text:
            'PB-RAN-07 | Eradicate | Block identified malicious hashes and domains at EDR and proxy. | Security Engineer',
        },
        verified: true,
        support: 'supported',
      },
      {
        order: 6,
        action: 'Restore from the last known-good offline backup after validating it is clean.',
        rationale: 'Recovery path that avoids paying the ransom.',
        citation: {
          playbook_id: 'PB-RAN',
          step_id: 'PB-RAN-09',
          source_text:
            'PB-RAN-09 | Recover | Restore from the last known-good offline backup after validation. | IT Operations',
        },
        verified: true,
        support: 'supported',
      },
    ],
    related_cves: [
      {
        id: 'CVE-2026-1001',
        severity: 'high',
        cvss: 8.1,
        remediation: 'Apply the vendor patch for the remote file service and restrict exposure.',
      },
    ],
    escalation_note: '',
    dropped_count: 1,
  },
  timings_ms: { parse: 1280, retrieve: 210, generate: 2950, verify: 1420, total: 5860 },
};

export const lowConfidenceRun: RunResponse = {
  run_id: 'RUN-demo-lowconf',
  parsed: {
    alert_id: 'EML-20261117-0042',
    source: 'MailGuard',
    timestamp: '2026-11-17T08:12:45Z',
    attack_type: 'phishing',
    severity: 'high',
    confidence: 0.74,
    summary:
      'A credential harvesting email was delivered to two users and one user clicked the link.',
    iocs: {
      ...emptyIocs,
      emails: ['it-support@corp-helpdesk.example.net', 'm.lee@corp.example'],
      urls: ['https://login-corp-sso.example.org/verify'],
      domains: ['login-corp-sso.example.org'],
    },
    evidence_fields: ['rule', 'url', 'user_clicked'],
    redacted: true,
  },
  checklist: {
    alert_id: 'EML-20261117-0042',
    status: 'low_confidence',
    playbook_id: 'PB-PHI',
    retrieval_confidence: 0.51,
    steps: [
      {
        order: 1,
        action: 'Reset the password for the user who clicked the link and revoke sessions.',
        rationale: 'The user may have submitted credentials on the fake page.',
        citation: {
          playbook_id: 'PB-PHI',
          step_id: 'PB-PHI-03',
          source_text:
            'PB-PHI-03 | Contain | Reset credentials and revoke sessions for users who interacted with the message. | IAM Admin',
        },
        verified: true,
        support: 'supported',
      },
      {
        order: 2,
        action: 'Purge the message from all mailboxes that received it.',
        rationale: 'Stops further clicks.',
        citation: {
          playbook_id: 'PB-PHI',
          step_id: 'PB-PHI-04',
          source_text:
            'PB-PHI-04 | Contain | Purge the malicious message from all recipient mailboxes. | Email Admin',
        },
        verified: true,
        support: 'partial',
      },
    ],
    related_cves: [],
    escalation_note:
      'Only 2 steps could be verified against the playbook. Review manually and escalate to the SOC Tier 2 lead.',
    dropped_count: 2,
  },
  timings_ms: { parse: 1100, retrieve: 190, generate: 2700, verify: 1500, total: 5490 },
};

export const noMatchRun: RunResponse = {
  run_id: 'RUN-demo-nomatch',
  parsed: {
    alert_id: 'DLP-3320',
    source: 'EndpointDLP',
    timestamp: null,
    attack_type: 'unknown',
    severity: 'medium',
    confidence: 0.41,
    summary: 'A large copy of confidential files to a USB drive was logged for one user.',
    iocs: { ...emptyIocs, users: ['r.nair'], resources: ['HR-LT-031'] },
    evidence_fields: ['event', 'size_mb'],
    redacted: true,
  },
  checklist: {
    alert_id: 'DLP-3320',
    status: 'no_matching_sop',
    playbook_id: null,
    retrieval_confidence: 0.18,
    steps: [],
    related_cves: [],
    escalation_note:
      'No approved procedure matches this alert. Escalate to the SOC Tier 2 lead and the insider-risk team. Do not improvise containment steps.',
    dropped_count: 0,
  },
  timings_ms: { parse: 1050, retrieve: 160, generate: 0, verify: 0, total: 1210 },
};

export const runFixtures = {
  grounded: groundedRun,
  low_confidence: lowConfidenceRun,
  no_matching_sop: noMatchRun,
} as const;

export type RunFixtureKey = keyof typeof runFixtures;

// Simple picker for the mock client: choose a fixture from the pasted alert text.
export function pickRunKey(alert: unknown): RunFixtureKey {
  const s = JSON.stringify(alert ?? {}).toLowerCase();
  if (s.includes('usb') || s.includes('ueba') || s.includes('sql')) return 'no_matching_sop';
  if (s.includes('clicked') || s.includes('phish') || s.includes('credential harvesting')) {
    return 'low_confidence';
  }
  return 'grounded';
}

export const draftTicket: IncidentTicket = {
  ticket_id: 'INC-20261117-001',
  run_id: 'RUN-demo-grounded',
  title: 'Ransomware encryption activity on FIN-WS-014',
  severity: 'critical',
  status: 'draft',
  timeline: [
    { time: '2026-11-17T02:41:09Z', event: 'EDR detected mass file renames and shadow copy deletion on FIN-WS-014.' },
    { time: null, event: 'Alert parsed and classified as ransomware (confidence 0.96).' },
    { time: null, event: 'Containment checklist generated from playbook PB-RAN and verified.' },
  ],
  root_cause: {
    hypothesis: 'Initial access via a compromised service account (svc_backup) followed by ransomware execution.',
    confidence: 0.55,
    basis: ['svc_backup was active during encryption', 'Shadow copy deletion command observed'],
  },
  iocs: {
    ...emptyIocs,
    ips: ['198.51.100.23'],
    users: ['svc_backup'],
    cve_ids: ['CVE-2026-1001'],
    resources: ['FIN-WS-014'],
  },
  containment_actions: groundedRun.checklist.steps.map((s) => ({
    action: s.action,
    citation: s.citation,
    status: 'recommended' as const,
  })),
  affected_assets: ['FIN-WS-014'],
  cves: ['CVE-2026-1001'],
  approved_by: null,
  approved_at: null,
  audit_ref: 'RUN-demo-grounded',
};

export const approvedTicket: IncidentTicket = {
  ...draftTicket,
  status: 'approved',
  containment_actions: draftTicket.containment_actions.map((a) => ({ ...a, status: 'approved' as const })),
  approved_by: 'Demo Analyst',
  approved_at: '2026-11-17T03:20:00Z',
};

export const auditRows: AuditRow[] = [
  { id: 1, run_id: 'RUN-demo-grounded', stage: 'parse', ts: '2026-11-17T03:10:01Z', model: 'genailab-maas-gpt-5.4-mini', input_hash: 'sha256:1a2b3c', output_hash: 'sha256:4d5e6f', details_json: { attack_type: 'ransomware', confidence: 0.96 } },
  { id: 2, run_id: 'RUN-demo-grounded', stage: 'retrieve', ts: '2026-11-17T03:10:02Z', model: null, input_hash: 'sha256:4d5e6f', output_hash: 'sha256:7a8b9c', details_json: { chunk_ids: ['PB-RAN-01', 'PB-RAN-02', 'PB-RAN-03', 'PB-RAN-05', 'PB-RAN-07', 'PB-RAN-09'], retrieval_confidence: 0.82 } },
  { id: 3, run_id: 'RUN-demo-grounded', stage: 'generate', ts: '2026-11-17T03:10:05Z', model: 'genailab-maas-gpt-5.4', input_hash: 'sha256:7a8b9c', output_hash: 'sha256:0d1e2f', details_json: { steps: 7 } },
  { id: 4, run_id: 'RUN-demo-grounded', stage: 'verify', ts: '2026-11-17T03:10:06Z', model: 'genailab-maas-gpt-5.4-mini', input_hash: 'sha256:0d1e2f', output_hash: 'sha256:3a4b5c', details_json: { kept: 6, dropped: ['PB-RAN-11'] } },
  { id: 5, run_id: 'RUN-demo-grounded', stage: 'ticket', ts: '2026-11-17T03:12:30Z', model: 'genailab-maas-gpt-5.4', input_hash: 'sha256:3a4b5c', output_hash: 'sha256:6d7e8f', details_json: { ticket_id: 'INC-20261117-001' } },
  { id: 6, run_id: 'RUN-demo-grounded', stage: 'approve', ts: '2026-11-17T03:20:00Z', model: null, input_hash: 'sha256:6d7e8f', output_hash: 'sha256:6d7e8f', details_json: { analyst: 'Demo Analyst', decision: 'approved' } },
];
