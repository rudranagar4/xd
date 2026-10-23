import React, { useRef, useEffect } from 'react';
import { X, Download, Upload, RotateCcw, Trash2, ShieldCheck, Database } from 'lucide-react';
import { State } from '../types';
import { exportJson, clearState } from '../utils/storage';
import { buildSampleState } from '../constants';
import { sound } from '../utils/audio';

interface DataModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: State;
  onStateUpdate: (newState: State) => void;
  onShowToast: (message: string, type?: 'success' | 'info' | 'alert') => void;
}

export const DataModal: React.FC<DataModalProps> = ({
  isOpen,
  onClose,
  state,
  onStateUpdate,
  onShowToast,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleExport = () => {
    sound.playTap();
    exportJson(state);
    onShowToast('Data exported successfully as JSON file', 'success');
  };

  const handleImportClick = () => {
    sound.playTap();
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed.checkIns) && Array.isArray(parsed.entries)) {
          const validatedState: State = {
            checkIns: parsed.checkIns,
            entries: parsed.entries,
            actions: Array.isArray(parsed.actions) ? parsed.actions : [],
            theme: parsed.theme || 'auto',
          };
          onStateUpdate(validatedState);
          sound.playSuccess();
          onShowToast('Data restored successfully from backup!', 'success');
          onClose();
        } else {
          onShowToast('Invalid backup file format.', 'alert');
        }
      } catch {
        onShowToast('Failed to parse backup JSON file.', 'alert');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleLoadSample = () => {
    if (window.confirm('Load sample demonstration data? Existing entries will be populated with 7 days of realistic history.')) {
      sound.playSuccess();
      const sample = buildSampleState();
      onStateUpdate(sample);
      onShowToast('Sample demo data loaded!', 'success');
      onClose();
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to delete all entries and check-ins? This cannot be undone.')) {
      sound.playTap();
      const empty = clearState();
      onStateUpdate(empty);
      onShowToast('All data has been cleared.', 'info');
      onClose();
    }
  };

  return (
    <div
      className="modal-backdrop fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-sanctuary-title"
    >
      <div
        className="modal-container glass-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Database size={20} className="modal-title-icon" />
            <h3 id="modal-sanctuary-title" className="modal-title">
              Data Sanctuary &amp; Backups
            </h3>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="privacy-pill">
            <ShieldCheck size={18} className="privacy-icon" />
            <span>
              <strong>100% Private &amp; Offline</strong>: Your entries remain strictly inside your browser's local storage. No trackers, no servers.
            </span>
          </div>

          <div className="modal-actions-list">
            <div className="modal-action-row">
              <div className="action-text">
                <h4 className="action-title">Export Backup (JSON)</h4>
                <p className="action-desc">Download a complete, offline copy of your check-ins and journal.</p>
              </div>
              <button
                type="button"
                id="export-data-btn"
                className="btn btn-primary btn-sm"
                onClick={handleExport}
              >
                <Download size={15} /> Export
              </button>
            </div>

            <div className="modal-action-row">
              <div className="action-text">
                <h4 className="action-title">Import Backup</h4>
                <p className="action-desc">Restore your data from a previous JSON backup file.</p>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".json"
                onChange={handleFileChange}
              />
              <button
                type="button"
                id="import-data-btn"
                className="btn btn-ghost btn-sm"
                onClick={handleImportClick}
              >
                <Upload size={15} /> Import
              </button>
            </div>

            <div className="modal-action-row">
              <div className="action-text">
                <h4 className="action-title">Load Sample Demo Data</h4>
                <p className="action-desc">Populate with 7 days of realistic history to test charts and insights.</p>
              </div>
              <button
                type="button"
                id="load-sample-btn"
                className="btn btn-ghost btn-sm"
                onClick={handleLoadSample}
              >
                <RotateCcw size={15} /> Load Demo
              </button>
            </div>

            <div className="modal-action-row danger-row">
              <div className="action-text">
                <h4 className="action-title">Clear All Data</h4>
                <p className="action-desc">Erase all check-ins, journal reflections, and recorded actions.</p>
              </div>
              <button
                type="button"
                id="clear-data-btn"
                className="btn btn-danger btn-sm"
                onClick={handleReset}
              >
                <Trash2 size={15} /> Reset
              </button>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
