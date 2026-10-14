/**
 * [INPUT]: Agent 单独建立的可信授权/工具元数据，以及不可信的结构化响应
 * [OUTPUT]: 纯数据操作门禁、保留未知来源的最小证据摘要与累计额度校验；不执行任何工具
 * [POS]: 联网证据的确定性辅助契约；不是身份认证、沙箱或联网执行器
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
export const OPERATIONS = ['deployment-metadata', 'resource-metadata', 'usage-aggregate', 'telemetry-query', 'issues-list', 'issues-detail', 'notification-policies', 'notification-history'] as const;
export type Operation = typeof OPERATIONS[number];
export type Budget = { requests: number; pages: number; rows: number; timeMs: number };
export type Scope = {
  accountId: string; projectId: string; environment: string; resourceId: string;
  deploymentVersion: string; timeMode: 'interval' | 'snapshot'; windowStart: string; windowEnd: string;
};
export type TrustedPlan = {
  mode: 'offline' | 'connected';
  consent?: { source: 'user'; explicit: true; scope: Scope; operations: Operation[];
    approvedBudget: Budget; expandedBudgetApproved?: boolean; expandedWindowApproved?: boolean; accountWideUsageApproved?: boolean; accountWideNotificationsApproved?: boolean;
    telemetryIncidentalWritesAccepted?: boolean };
  budget: Budget; startedAtMs: number; deadlineMs: number;
  resourceLabel: string; environmentLabel: string;
};
export type VerifiedCapability = {
  provenance: 'trusted-tool-registry'; verified: true; toolId: string; schemaFingerprint: string;
  operations: Operation[]; timeFiltering: 'supported' | 'snapshot-only'; method: 'GET' | 'POST'; route: string; toolReference: string; source: 'connector' | 'isolated-cli';
  effect: 'read' | 'telemetry-dry-with-incidental-metadata';
  telemetryDrySupported?: boolean; existingPermissions: ('read' | 'write')[];
  requiredPermission: 'read' | 'write';
  cliIsolation?: { trustedBinary: true; isolatedCwd: true; noExecutableConfig: true;
    noEnvFilesInAncestors: true; noTargetCode: true; noAutoInstall: true };
};
export type OperationIntent = {
  operation: Operation; toolId: string; schemaFingerprint: string; scope: Scope;
  method: 'GET' | 'POST'; route: string; purpose: 'read'; savedQueryAction: 'none'; dry?: boolean; reserve: Budget; pageSize?: number;
};
export type Reason = 'ok' | 'offline' | 'consent-missing' | 'scope-mismatch' | 'tool-missing'
  | 'schema-unverified' | 'operation-blocked' | 'mutation-blocked' | 'dry-required'
  | 'cli-isolation-unproven' | 'invalid-budget' | 'budget-exhausted' | 'deadline'
  | 'missing' | 'forbidden' | 'rate-limited' | 'tool-error' | 'truncated'
  | 'invalid-response' | 'no-issues-unsupported' | 'permission-missing';
export type Decision = { allowed: boolean; reason: Reason };
const scopeKeys: (keyof Scope)[] = ['accountId', 'projectId', 'environment', 'resourceId',
  'deploymentVersion', 'timeMode', 'windowStart', 'windowEnd'];
export const DEFAULT_CONNECTED_CEILING: Readonly<Budget> = Object.freeze({ requests: 10, pages: 3, rows: 100, timeMs: 60000 });
const budgetKeys: (keyof Budget)[] = ['requests', 'pages', 'rows', 'timeMs'];
const SAFE_ROUTES: Record<Operation, readonly string[]> = {
  'deployment-metadata': ['/accounts/{account_id}/workers/scripts/{script_name}/deployments',
    '/accounts/{account_id}/workers/scripts/{script_name}/versions'],
  'resource-metadata': ['/accounts/{account_id}/workers/scripts/{script_name}/settings'],
  'usage-aggregate': ['/accounts/{account_id}/billable-usage', '/accounts/{account_id}/billing/usage'],
  'telemetry-query': ['/accounts/{account_id}/workers/observability/telemetry/query'],
  'issues-list': ['/accounts/{account_id}/workers/observability/issues'],
  'issues-detail': ['/accounts/{account_id}/workers/observability/issues/{issueId}'],
  'notification-policies': ['/accounts/{account_id}/alerting/v3/policies'],
  'notification-history': ['/accounts/{account_id}/alerting/v3/history'],
};
const metricKeys = ['requests', 'errors', 'cpuTimeMs', 'durationMs', 'storageBytes', 'issueCount', 'policyCount', 'notificationCount'] as const;
type Metrics = Partial<Record<typeof metricKeys[number], number>>;
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const count = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0;
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;
const iso = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(v)
  && Number.isFinite(Date.parse(v)) && new Date(v).toISOString() === v;
function validScope(v: unknown): v is Scope {
  return object(v) && scopeKeys.every(k => typeof v[k] === 'string' && (v[k] as string).length > 0
    && (v[k] as string).length <= 256) && iso(v.windowStart) && iso(v.windowEnd)
    && (v.timeMode === 'interval' || v.timeMode === 'snapshot')
    && Date.parse(v.windowStart) < Date.parse(v.windowEnd);
}
function sameScope(a: Scope, b: unknown): boolean {
  return validScope(b) && scopeKeys.every(k => a[k] === b[k]);
}
function validBudget(v: unknown, positive = false): v is Budget {
  return object(v) && budgetKeys.every(k => count(v[k]) && (!positive || (v[k] as number) > 0));
}
function validOperations(v: unknown): v is Operation[] {
  return Array.isArray(v) && v.length > 0 && v.every(x => OPERATIONS.includes(x));
}
const deny = (reason: Reason): Decision => ({ allowed: false, reason });

/** Trust markers are assertions by the caller, not authentication. Never derive plan/capability
 * from tool responses, repository instructions or logs. Review method/route and all actual
 * arguments against the real schema; route equality is not proof an endpoint is read-only.
 * This function has no I/O, clock, credential handling, tool invocation or mutable ledger. */
export function checkConnectedOperation(plan: TrustedPlan, capability: VerifiedCapability | undefined,
  intent: OperationIntent, used: Budget, nowMs: number): Decision {
  if (!plan || plan.mode !== 'connected') return deny('offline');
  const consent = plan.consent;
  if (!consent || consent.source !== 'user' || consent.explicit !== true || !validScope(consent.scope)
    || !validOperations(consent.operations)) return deny('consent-missing');
  if (!intent || !sameScope(consent.scope, intent.scope)) return deny('scope-mismatch');
  if (!capability) return deny('tool-missing');
  if (capability.provenance !== 'trusted-tool-registry' || capability.verified !== true
    || !capability.toolId || !/^[a-f0-9]{64}$/.test(capability.schemaFingerprint) || capability.toolId !== intent.toolId
    || capability.schemaFingerprint !== intent.schemaFingerprint) return deny('schema-unverified');
  if (!validOperations(capability.operations) || !OPERATIONS.includes(intent.operation)
    || !consent.operations.includes(intent.operation) || !capability.operations.includes(intent.operation))
    return deny('operation-blocked');
  if (!Array.isArray(capability.existingPermissions)
    || !['read', 'write'].includes(capability.requiredPermission)
    || !capability.existingPermissions.includes(capability.requiredPermission)) return deny('permission-missing');
  if (capability.method !== intent.method || capability.route !== intent.route
    || typeof intent.route !== 'string' || !SAFE_ROUTES[intent.operation].includes(intent.route)
    || /subscribe|saved[-_/]?quer|webhook/i.test(intent.route)
    || intent.method !== (intent.operation === 'telemetry-query' ? 'POST' : 'GET')) return deny('mutation-blocked');
  if (intent.operation === 'issues-list'
    && (!count(intent.pageSize) || intent.pageSize < 1 || intent.pageSize > 100
      || !validBudget(intent.reserve) || intent.pageSize > intent.reserve.rows)) return deny('invalid-budget');
  const snapshotOnly = ['deployment-metadata', 'resource-metadata', 'issues-list', 'issues-detail', 'notification-policies'].includes(intent.operation);
  if (!['supported', 'snapshot-only'].includes(capability.timeFiltering)
    || (snapshotOnly && capability.timeFiltering !== 'snapshot-only')
    || (capability.timeFiltering === 'snapshot-only' && intent.scope.timeMode !== 'snapshot'))
    return deny('scope-mismatch');
  if (['notification-policies', 'notification-history'].includes(intent.operation)
    && (consent.accountWideNotificationsApproved !== true || intent.scope.projectId !== 'account-all'
      || intent.scope.resourceId !== 'account-all' || intent.scope.environment !== 'account-all'
      || intent.scope.deploymentVersion !== 'unknown')) return deny('scope-mismatch');
  if (intent.operation === 'usage-aggregate' && (consent.accountWideUsageApproved !== true
    || intent.scope.projectId !== 'account-all' || intent.scope.resourceId !== 'account-all'
    || intent.scope.environment !== 'account-all' || intent.scope.deploymentVersion !== 'unknown'))
    return deny('scope-mismatch');
  if (intent.purpose !== 'read' || intent.savedQueryAction !== 'none') return deny('mutation-blocked');
  if (intent.operation === 'telemetry-query') {
    if (capability.requiredPermission !== 'write') return deny('permission-missing');
    if (intent.dry !== true || capability.telemetryDrySupported !== true) return deny('dry-required');
    if (capability.effect !== 'telemetry-dry-with-incidental-metadata'
      || consent.telemetryIncidentalWritesAccepted !== true) return deny('mutation-blocked');
  } else if (capability.effect !== 'read') return deny('mutation-blocked');
  if (capability.source === 'isolated-cli') {
    const i = capability.cliIsolation;
    if (!i || i.trustedBinary !== true || i.isolatedCwd !== true || i.noExecutableConfig !== true
      || i.noEnvFilesInAncestors !== true || i.noTargetCode !== true || i.noAutoInstall !== true)
      return deny('cli-isolation-unproven');
  } else if (capability.source !== 'connector') return deny('schema-unverified');
  if (!validBudget(plan.budget, true) || !validBudget(consent.approvedBudget, true)
    || budgetKeys.some(k => plan.budget[k] !== consent.approvedBudget[k])
    || (consent.expandedBudgetApproved !== true && budgetKeys.some(k => plan.budget[k] > DEFAULT_CONNECTED_CEILING[k]))
    || (Date.parse(consent.scope.windowEnd) - Date.parse(consent.scope.windowStart) > 86400000
      && consent.expandedWindowApproved !== true) || !validBudget(used) || !validBudget(intent.reserve)
    || intent.reserve.requests < 1 || intent.reserve.pages < 1 || intent.reserve.timeMs < 1)
    return deny('invalid-budget');
  if (intent.scope.timeMode === 'snapshot' && (!count(nowMs)
    || nowMs < Date.parse(intent.scope.windowStart)
    || nowMs + intent.reserve.timeMs > Date.parse(intent.scope.windowEnd))) return deny('scope-mismatch');
  if (!count(nowMs) || !count(plan.startedAtMs) || !count(plan.deadlineMs)
    || plan.deadlineMs <= plan.startedAtMs || nowMs < plan.startedAtMs
    || nowMs + intent.reserve.timeMs > plan.deadlineMs
    || nowMs - plan.startedAtMs + intent.reserve.timeMs > plan.budget.timeMs) return deny('deadline');
  if (budgetKeys.some(k => !Number.isSafeInteger(used[k] + intent.reserve[k])
    || used[k] + intent.reserve[k] > plan.budget[k])) return deny('budget-exhausted');
  return { allowed: true, reason: 'ok' };
}

export type TrustedReceipt = {
  provenance: 'trusted-execution'; usage: Budget; observedAt: string; localDeploymentMatched: boolean;
};
export type Observation = {
  evidenceId: string; operation: Operation; source: 'connector' | 'isolated-cli' | 'unknown';
  toolReference: string; schemaFingerprint: string | null;
  status: 'observed' | 'unknown'; reason: Reason; scopeMatched: boolean;
  resourceLabel: string; environmentLabel: string;
  observedAt: string | null; timeMode: 'interval' | 'snapshot' | 'unknown'; windowStart: string | null; windowEnd: string | null;
  deploymentMatch: 'matched' | 'mismatched' | 'unknown';
  requests: number; pages: number; rows: number;
  dataDelay: 'unknown'; sampling: 'unknown'; retention: 'unknown'; metrics: Metrics;
};
const label = (v: unknown, kind: string) => typeof v === 'string' && new RegExp(`^${kind}-[1-9][0-9]{0,3}$`).test(v)
  ? v : `${kind}-unknown`;

/** Raw messages, log rows, bodies, arbitrary keys and response-supplied labels never survive.
 * Numeric metrics are allowlisted summaries, not a guarantee of accurate billing or safe logs.
 * Caller records every requested item, including skipped/failed calls, and maintains actual usage. */
export function summarizeConnectedEvidence(evidenceId: string, plan: TrustedPlan,
  capability: VerifiedCapability | undefined, intent: OperationIntent, used: Budget,
  nowMs: number, receipt: TrustedReceipt | undefined, response: unknown): Observation {
  const decision = checkConnectedOperation(plan, capability, intent, used, nowMs);
  const out: Observation = {
    evidenceId: /^CE-[1-9][0-9]{0,3}$/.test(evidenceId) ? evidenceId : 'CE-unknown',
    operation: OPERATIONS.includes(intent?.operation) ? intent.operation : 'resource-metadata',
    source: capability?.source === 'connector' || capability?.source === 'isolated-cli' ? capability.source : 'unknown',
    toolReference: label(capability?.toolReference, 'tool'),
    schemaFingerprint: /^[a-f0-9]{64}$/.test(capability?.schemaFingerprint ?? '') ? capability!.schemaFingerprint : null,
    status: 'unknown', reason: decision.reason, scopeMatched: false,
    resourceLabel: label(plan?.resourceLabel, 'resource'), environmentLabel: label(plan?.environmentLabel, 'environment'),
    observedAt: null, timeMode: validScope(plan?.consent?.scope) ? plan.consent!.scope.timeMode : 'unknown',
    windowStart: validScope(plan?.consent?.scope) ? plan.consent!.scope.windowStart : null,
    windowEnd: validScope(plan?.consent?.scope) ? plan.consent!.scope.windowEnd : null,
    deploymentMatch: 'unknown', requests: 0, pages: 0, rows: 0,
    dataDelay: 'unknown', sampling: 'unknown', retention: 'unknown', metrics: {},
  };
  if (!decision.allowed) return out;
  if (!receipt) return { ...out, reason: 'missing' };
  if (receipt.provenance !== 'trusted-execution' || !validBudget(receipt.usage)
    || receipt.usage.requests < 1 || !iso(receipt.observedAt) || Date.parse(receipt.observedAt) < nowMs)
    return { ...out, reason: 'invalid-response' };
  const actual = receipt.usage;
  out.observedAt = receipt.observedAt;
  out.requests = actual.requests; out.pages = actual.pages; out.rows = actual.rows;
  if (intent.scope.timeMode === 'snapshot' && (Date.parse(receipt.observedAt) < Date.parse(intent.scope.windowStart)
    || Date.parse(receipt.observedAt) > Date.parse(intent.scope.windowEnd))) return { ...out, reason: 'scope-mismatch' };
  if (Date.parse(receipt.observedAt) - nowMs > intent.reserve.timeMs
    || budgetKeys.some(k => actual[k] > intent.reserve[k])) return { ...out, reason: 'budget-exhausted' };
  if (Date.parse(receipt.observedAt) > plan.deadlineMs) return { ...out, reason: 'deadline' };
  if (!object(response)) return { ...out, reason: 'missing' };
  if (response.httpStatus === 403) return { ...out, reason: 'forbidden' };
  if (response.httpStatus === 429) return { ...out, reason: 'rate-limited' };
  if (response.httpStatus !== 200) return { ...out, reason: 'tool-error' };
  if (actual.pages < 1) return { ...out, reason: 'invalid-response' };
  if (response.noIssues === true) return { ...out, reason: 'no-issues-unsupported' };
  if (response.truncated !== false || response.hasMore !== false) return { ...out, reason: 'truncated' };
  const observedScope = object(response.scope) ? response.scope : {};
  const knownVersion = typeof observedScope.deploymentVersion === 'string'
    && observedScope.deploymentVersion !== 'unknown' && intent.scope.deploymentVersion !== 'unknown';
  const mappedScope = { ...observedScope, deploymentVersion: intent.scope.deploymentVersion };
  if (!sameScope(intent.scope, mappedScope) || (knownVersion
    && observedScope.deploymentVersion !== intent.scope.deploymentVersion)) {
    out.deploymentMatch = object(response.scope) && typeof response.scope.deploymentVersion === 'string'
      && response.scope.deploymentVersion !== intent.scope.deploymentVersion ? 'mismatched' : 'unknown';
    return { ...out, reason: 'scope-mismatch' };
  }
  if (!object(response.metrics))
    return { ...out, reason: 'invalid-response' };
  if (metricKeys.some(k => (response.metrics as Record<string, unknown>)[k] !== undefined && !finite((response.metrics as Record<string, unknown>)[k])))
    return { ...out, reason: 'invalid-response' };
  for (const key of metricKeys) if (finite(response.metrics[key])) out.metrics[key] = response.metrics[key];
  return { ...out, status: 'observed', reason: 'ok', scopeMatched: true,
    deploymentMatch: knownVersion && receipt.localDeploymentMatched === true ? 'matched' : 'unknown',
    observedAt: receipt.observedAt };
}

export type ConnectedEvidence = {
  schemaVersion: 1; mode: 'bounded-evidence'; status: 'observed' | 'partial' | 'unknown';
  requests: number; budget: Budget; observations: Observation[];
  gaps: { evidenceId: string; reason: Reason }[];
};

/** Accept only summaries produced above, never raw responses. Does not validate a full report. */
export function buildConnectedEvidence(observations: Observation[], budget: Budget): ConnectedEvidence {
  if (!validBudget(budget, true) || !observations.length
    || new Set(observations.map(o => o.evidenceId)).size !== observations.length)
    throw new Error('Invalid evidence set');
  const totals = { requests: 0, pages: 0, rows: 0 };
  const countKeys = ['requests', 'pages', 'rows'] as const;
  for (const observation of observations) for (const key of countKeys) {
    if (!count(observation[key]) || !count(totals[key] + observation[key]))
      throw new Error('Invalid evidence counts');
    totals[key] += observation[key];
  }
  const gaps = observations.filter(o => o.status !== 'observed').map(o => ({ evidenceId: o.evidenceId, reason: o.reason }));
  const allUnknown = gaps.length === observations.length;
  if (countKeys.some(key => totals[key] > budget[key]))
    gaps.push({ evidenceId: 'collection-budget', reason: 'budget-exhausted' });
  return { schemaVersion: 1, mode: 'bounded-evidence',
    status: allUnknown ? 'unknown' : gaps.length ? 'partial' : 'observed',
    requests: totals.requests,
    budget: { requests: budget.requests, pages: budget.pages, rows: budget.rows, timeMs: budget.timeMs },
    observations, gaps };
}

export function isCompatibleReportEnvelope(report: unknown): boolean {
  if (!object(report) || !object(report.audit)) return false;
  if (report.schemaVersion === 1) return report.audit.mode === 'offline-read-only' && report.connectedEvidence === undefined;
  if (report.schemaVersion === 3 && object(report.scanner) && report.scanner.mode === 'on-demand') {
    if (report.audit.mode === 'offline-read-only') return report.connectedEvidence === undefined;
    return report.audit.mode === 'offline-plus-connected-evidence' && object(report.connectedEvidence)
      && report.connectedEvidence.schemaVersion === 1 && report.connectedEvidence.mode === 'bounded-evidence';
  }
  return report.schemaVersion === 2 && report.audit.mode === 'offline-plus-connected-evidence'
    && object(report.connectedEvidence) && report.connectedEvidence.schemaVersion === 1
    && report.connectedEvidence.mode === 'bounded-evidence';
}
