/**
 * Attestation Panel - Display verification receipts
 * 
 * SOLID Principles:
 * - Single Responsibility: Display attestation data
 * - Open/Closed: Extensible with new visualizations
 * - Dependency Inversion: Accepts attestation via props
 * 
 * Purpose: Show per-turn proof of what the model saw
 */

import React, { useState } from 'react';
import type {
  TurnAttestation,
  AppliedSnippet,
  TokenBudget,
  AttestationDiagnostic,
} from '../../lib/verification/attestationTypes';
import { Button } from './Button';

interface AttestationPanelProps {
  attestation: TurnAttestation | null;
  effectivePrompt?: string;
  onCopyPrompt?: () => void;
  className?: string;
}

export function AttestationPanel({
  attestation,
  effectivePrompt,
  onCopyPrompt,
  className = '',
}: AttestationPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'snippets' | 'diagnostics' | 'prompt'>('overview');

  if (!attestation) {
    return (
      <div className={`attestation-panel ${className}`}>
        <div className="attestation-panel__empty">
          <p>No attestation data available</p>
          <p className="text-sm text-gray-500">
            Attestation receipts are generated during runtime context compilation
          </p>
        </div>
      </div>
    );
  }

  const healthColor = attestation.diagnostics.some((d) => d.level === 'error')
    ? 'red'
    : attestation.diagnostics.some((d) => d.level === 'warning')
    ? 'yellow'
    : 'green';

  const healthLabel = attestation.diagnostics.some((d) => d.level === 'error')
    ? 'Issues Detected'
    : attestation.diagnostics.some((d) => d.level === 'warning')
    ? 'Warnings'
    : 'Healthy';

  return (
    <div className={`attestation-panel ${className}`}>
      {/* Header */}
      <div className="attestation-panel__header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg">🧾 Attestation Receipt</h3>
            <span className={`badge badge--${healthColor}`}>{healthLabel}</span>
          </div>
          <Button
            size="small"
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Proof of what the model saw on turn {attestation.turnId}
        </p>
      </div>

      {/* Compact Summary (Always Visible) */}
      <div className="attestation-panel__summary">
        <div className="summary-grid">
          <SummaryItem
            label="Scope ID"
            value={attestation.scopeId}
            mono
            tooltip="Unique identifier: location + agent + prompt hash"
          />
          <SummaryItem
            label="Prompt Hash"
            value={attestation.promptHash}
            mono
            tooltip="First 16 chars of SHA-256 hash of system prompt"
          />
          <SummaryItem
            label="SPEC Hash"
            value={attestation.specHash}
            mono
            tooltip="Hash of embedded SPEC JSON"
          />
          <SummaryItem
            label="Snippets Applied"
            value={`${attestation.snippetsApplied.length}${!attestation.snippetsEnabled ? ' (disabled)' : ''}`}
            badge={attestation.snippetsApplied.length > 0}
            badgeColor="blue"
          />
          <SummaryItem
            label="Token Budget"
            value={`${attestation.tokenBudget.total} / ${attestation.tokenBudget.maxTokens}`}
            badge={attestation.tokenBudget.exceeded}
            badgeColor="red"
            badgeText={attestation.tokenBudget.exceeded ? 'EXCEEDED' : undefined}
          />
          <SummaryItem
            label="Last Turns Used"
            value={`${attestation.lastTurnsUsed}`}
          />
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="attestation-panel__details">
          {/* Tabs */}
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'overview' ? 'tab--active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`tab ${activeTab === 'snippets' ? 'tab--active' : ''}`}
              onClick={() => setActiveTab('snippets')}
            >
              Snippets ({attestation.snippetsApplied.length})
            </button>
            <button
              className={`tab ${activeTab === 'diagnostics' ? 'tab--active' : ''}`}
              onClick={() => setActiveTab('diagnostics')}
            >
              Diagnostics ({attestation.diagnostics.length})
            </button>
            {effectivePrompt && (
              <button
                className={`tab ${activeTab === 'prompt' ? 'tab--active' : ''}`}
                onClick={() => setActiveTab('prompt')}
              >
                Effective Prompt
              </button>
            )}
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === 'overview' && (
              <OverviewTab attestation={attestation} />
            )}
            {activeTab === 'snippets' && (
              <SnippetsTab snippets={attestation.snippetsApplied} />
            )}
            {activeTab === 'diagnostics' && (
              <DiagnosticsTab diagnostics={attestation.diagnostics} />
            )}
            {activeTab === 'prompt' && effectivePrompt && (
              <PromptTab
                prompt={effectivePrompt}
                onCopy={onCopyPrompt}
              />
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .attestation-panel {
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          background: white;
          padding: 16px;
          margin: 16px 0;
        }

        .attestation-panel__empty {
          text-align: center;
          padding: 32px;
          color: #666;
        }

        .attestation-panel__header {
          margin-bottom: 16px;
        }

        .attestation-panel__summary {
          background: #f5f5f5;
          padding: 16px;
          border-radius: 6px;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }

        .badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }

        .badge--green {
          background: #d4edda;
          color: #155724;
        }

        .badge--yellow {
          background: #fff3cd;
          color: #856404;
        }

        .badge--red {
          background: #f8d7da;
          color: #721c24;
        }

        .attestation-panel__details {
          margin-top: 16px;
          border-top: 1px solid #e0e0e0;
          padding-top: 16px;
        }

        .tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
          border-bottom: 2px solid #e0e0e0;
        }

        .tab {
          padding: 8px 16px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 14px;
          color: #666;
          border-bottom: 2px solid transparent;
          margin-bottom: -2px;
          transition: all 0.2s;
        }

        .tab:hover {
          color: #333;
        }

        .tab--active {
          color: #007bff;
          border-bottom-color: #007bff;
          font-weight: 600;
        }

        .tab-content {
          min-height: 200px;
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function SummaryItem({
  label,
  value,
  mono = false,
  badge = false,
  badgeColor = 'blue',
  badgeText,
  tooltip,
}: {
  label: string;
  value: string;
  mono?: boolean;
  badge?: boolean;
  badgeColor?: 'blue' | 'red' | 'green';
  badgeText?: string;
  tooltip?: string;
}) {
  return (
    <div className="summary-item" title={tooltip}>
      <div className="summary-item__label">{label}</div>
      <div className={`summary-item__value ${mono ? 'font-mono text-sm' : ''}`}>
        {value}
        {badge && badgeText && (
          <span className={`badge badge--${badgeColor} ml-2`}>
            {badgeText}
          </span>
        )}
      </div>
      <style jsx>{`
        .summary-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .summary-item__label {
          font-size: 12px;
          color: #666;
          font-weight: 500;
        }

        .summary-item__value {
          font-size: 14px;
          color: #333;
          word-break: break-all;
        }

        .font-mono {
          font-family: 'Courier New', monospace;
        }

        .text-sm {
          font-size: 13px;
        }

        .ml-2 {
          margin-left: 8px;
        }
      `}</style>
    </div>
  );
}

function OverviewTab({ attestation }: { attestation: TurnAttestation }) {
  return (
    <div className="overview-tab">
      <section>
        <h4>🎯 Scope & Identity</h4>
        <InfoRow label="Scope ID" value={attestation.scopeId} mono />
        <InfoRow label="Location ID" value={attestation.locationId} />
        <InfoRow label="Agent ID" value={attestation.agentId} />
        <InfoRow label="Prompt Hash" value={attestation.promptHash} mono />
        <InfoRow label="SPEC Hash" value={attestation.specHash} mono />
      </section>

      <section>
        <h4>📊 Token Budget</h4>
        <TokenBudgetBar budget={attestation.tokenBudget} />
      </section>

      <section>
        <h4>⚙️ Configuration</h4>
        <InfoRow label="Model" value={attestation.model} />
        <InfoRow label="Temperature" value={`${attestation.temperature}`} />
        <InfoRow label="Max Tokens" value={`${attestation.maxTokens}`} />
        <InfoRow
          label="Snippets Enabled"
          value={attestation.snippetsEnabled ? 'Yes' : 'No'}
        />
        <InfoRow
          label="Guard Enabled"
          value={attestation.guardEnabled ? 'Yes' : 'No'}
        />
      </section>

      <section>
        <h4>📝 Context Included</h4>
        <InfoRow label="Snippets Applied" value={`${attestation.snippetsApplied.length}`} />
        <InfoRow label="Last Turns Used" value={`${attestation.lastTurnsUsed}`} />
        <InfoRow
          label="Summary Included"
          value={attestation.summaryIncluded ? 'Yes' : 'No'}
        />
      </section>

      <style jsx>{`
        .overview-tab {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        section h4 {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 12px;
          color: #333;
        }

        section {
          background: #f9f9f9;
          padding: 16px;
          border-radius: 6px;
        }
      `}</style>
    </div>
  );
}

function SnippetsTab({ snippets }: { snippets: AppliedSnippet[] }) {
  if (snippets.length === 0) {
    return (
      <div className="empty-state">
        <p>No snippets were applied for this turn</p>
        <p className="text-sm text-gray-500">
          Snippets are learned corrections that improve responses
        </p>
      </div>
    );
  }

  return (
    <div className="snippets-tab">
      {snippets.map((snippet, idx) => (
        <div key={snippet.id} className="snippet-card">
          <div className="snippet-card__header">
            <span className="snippet-card__number">#{idx + 1}</span>
            <span className="snippet-card__source">{snippet.source}</span>
            <span className="snippet-card__length">{snippet.charLength} chars</span>
          </div>
          <div className="snippet-card__trigger">
            <strong>Trigger:</strong> {snippet.trigger}
          </div>
          <div className="snippet-card__content">
            <strong>Response:</strong> {snippet.content}
          </div>
          <div className="snippet-card__footer">
            Applied: {new Date(snippet.appliedAt).toLocaleString()}
          </div>
        </div>
      ))}

      <style jsx>{`
        .snippets-tab {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .snippet-card {
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          padding: 16px;
          background: white;
        }

        .snippet-card__header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .snippet-card__number {
          font-weight: 600;
          color: #007bff;
        }

        .snippet-card__source {
          background: #e7f3ff;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          color: #0056b3;
        }

        .snippet-card__length {
          font-size: 12px;
          color: #666;
        }

        .snippet-card__trigger,
        .snippet-card__content {
          margin-bottom: 8px;
          line-height: 1.5;
        }

        .snippet-card__footer {
          font-size: 12px;
          color: #666;
          border-top: 1px solid #f0f0f0;
          padding-top: 8px;
          margin-top: 8px;
        }

        .empty-state {
          text-align: center;
          padding: 48px;
          color: #666;
        }
      `}</style>
    </div>
  );
}

function DiagnosticsTab({ diagnostics }: { diagnostics: AttestationDiagnostic[] }) {
  if (diagnostics.length === 0) {
    return (
      <div className="empty-state">
        <p>✅ No issues detected</p>
        <p className="text-sm text-gray-500">
          All verification checks passed successfully
        </p>
      </div>
    );
  }

  const errors = diagnostics.filter((d) => d.level === 'error');
  const warnings = diagnostics.filter((d) => d.level === 'warning');
  const info = diagnostics.filter((d) => d.level === 'info');

  return (
    <div className="diagnostics-tab">
      {errors.length > 0 && (
        <section>
          <h4>❌ Errors ({errors.length})</h4>
          {errors.map((d, idx) => (
            <DiagnosticCard key={idx} diagnostic={d} />
          ))}
        </section>
      )}

      {warnings.length > 0 && (
        <section>
          <h4>⚠️ Warnings ({warnings.length})</h4>
          {warnings.map((d, idx) => (
            <DiagnosticCard key={idx} diagnostic={d} />
          ))}
        </section>
      )}

      {info.length > 0 && (
        <section>
          <h4>ℹ️ Info ({info.length})</h4>
          {info.map((d, idx) => (
            <DiagnosticCard key={idx} diagnostic={d} />
          ))}
        </section>
      )}

      <style jsx>{`
        .diagnostics-tab {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        section h4 {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 12px;
        }
      `}</style>
    </div>
  );
}

function DiagnosticCard({ diagnostic }: { diagnostic: AttestationDiagnostic }) {
  const levelColor = {
    error: 'red',
    warning: 'yellow',
    info: 'blue',
  };

  return (
    <div className={`diagnostic-card diagnostic-card--${levelColor[diagnostic.level]}`}>
      <div className="diagnostic-card__header">
        <span className="diagnostic-card__code">{diagnostic.code}</span>
      </div>
      <div className="diagnostic-card__message">{diagnostic.message}</div>
      {diagnostic.suggestion && (
        <div className="diagnostic-card__suggestion">
          <strong>💡 Suggestion:</strong> {diagnostic.suggestion}
        </div>
      )}

      <style jsx>{`
        .diagnostic-card {
          border-left: 4px solid;
          padding: 12px 16px;
          background: #f9f9f9;
          margin-bottom: 12px;
        }

        .diagnostic-card--red {
          border-left-color: #dc3545;
        }

        .diagnostic-card--yellow {
          border-left-color: #ffc107;
        }

        .diagnostic-card--blue {
          border-left-color: #17a2b8;
        }

        .diagnostic-card__header {
          margin-bottom: 8px;
        }

        .diagnostic-card__code {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          font-weight: 600;
          color: #666;
        }

        .diagnostic-card__message {
          font-size: 14px;
          color: #333;
          margin-bottom: 8px;
        }

        .diagnostic-card__suggestion {
          font-size: 13px;
          color: #666;
          background: white;
          padding: 8px;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}

function PromptTab({ prompt, onCopy }: { prompt: string; onCopy?: () => void }) {
  return (
    <div className="prompt-tab">
      <div className="prompt-tab__header">
        <p>Effective prompt sent to the model (all messages combined)</p>
        {onCopy && (
          <Button size="small" onClick={onCopy}>
            📋 Copy
          </Button>
        )}
      </div>
      <pre className="prompt-tab__content">{prompt}</pre>

      <style jsx>{`
        .prompt-tab__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .prompt-tab__header p {
          font-size: 14px;
          color: #666;
        }

        .prompt-tab__content {
          background: #1e1e1e;
          color: #d4d4d4;
          padding: 16px;
          border-radius: 6px;
          font-family: 'Courier New', monospace;
          font-size: 13px;
          line-height: 1.5;
          overflow-x: auto;
          max-height: 600px;
          overflow-y: auto;
        }
      `}</style>
    </div>
  );
}

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="info-row">
      <span className="info-row__label">{label}:</span>
      <span className={`info-row__value ${mono ? 'font-mono' : ''}`}>{value}</span>

      <style jsx>{`
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e0e0e0;
        }

        .info-row:last-child {
          border-bottom: none;
        }

        .info-row__label {
          font-size: 13px;
          color: #666;
        }

        .info-row__value {
          font-size: 13px;
          color: #333;
          font-weight: 500;
        }

        .font-mono {
          font-family: 'Courier New', monospace;
        }
      `}</style>
    </div>
  );
}

function TokenBudgetBar({ budget }: { budget: TokenBudget }) {
  const percentage = Math.min((budget.total / budget.maxTokens) * 100, 100);
  const barColor = budget.exceeded ? '#dc3545' : percentage > 80 ? '#ffc107' : '#28a745';

  return (
    <div className="token-budget-bar">
      <div className="token-budget-bar__info">
        <span>{budget.total.toLocaleString()} tokens used</span>
        <span>{budget.maxTokens.toLocaleString()} max</span>
      </div>
      <div className="token-budget-bar__bar">
        <div className="token-budget-bar__fill" style={{ width: `${percentage}%`, backgroundColor: barColor }} />
      </div>
      <div className="token-budget-bar__breakdown">
        <div>System: {budget.systemPrompt}</div>
        <div>SPEC: {budget.spec}</div>
        <div>Snippets: {budget.snippets}</div>
        <div>Context: {budget.context}</div>
        <div>Summary: {budget.summary}</div>
        <div>Last Turns: {budget.lastTurns}</div>
      </div>

      <style jsx>{`
        .token-budget-bar {
          margin-top: 8px;
        }

        .token-budget-bar__info {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          margin-bottom: 8px;
          color: #666;
        }

        .token-budget-bar__bar {
          height: 24px;
          background: #e0e0e0;
          border-radius: 4px;
          overflow: hidden;
          position: relative;
        }

        .token-budget-bar__fill {
          height: 100%;
          transition: width 0.3s ease;
        }

        .token-budget-bar__breakdown {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-top: 12px;
          font-size: 12px;
          color: #666;
        }
      `}</style>
    </div>
  );
}

