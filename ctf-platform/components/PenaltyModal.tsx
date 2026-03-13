"use client";

import React from "react";

interface PenaltyModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  penaltyCost: number;
}

export default function PenaltyModal({
  isOpen,
  onConfirm,
  onCancel,
  penaltyCost,
}: PenaltyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title glitch" data-text="WARNING: PENALTY">
          WARNING: PENALTY
        </h2>
        <div className="modal-body">
          <p>You have exceeded the 10 free attempts threshold.</p>
          <p>
            This submission will cost{" "}
            <span className="penalty-amount">{penaltyCost}</span> points from
            your team's score.
          </p>
          <p className="modal-question">Do you want to proceed?</p>
        </div>
        <div className="modal-actions">
          <button onClick={onCancel} className="modal-btn cancel">
            ABORT
          </button>
          <button onClick={onConfirm} className="modal-btn confirm">
            PROCEED
          </button>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(5px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 10000;
          animation: fadeIn 0.3s ease;
        }

        .modal-content {
          background: #111;
          border: 2px solid var(--accent-color);
          border-radius: 8px;
          padding: 40px;
          max-width: 450px;
          width: 90%;
          text-align: center;
          box-shadow: 0 0 30px rgba(255, 0, 60, 0.2);
          position: relative;
        }

        .modal-title {
          font-family: "Fira Code", monospace;
          color: var(--accent-color);
          font-size: 1.8rem;
          margin-bottom: 25px;
        }

        .modal-body {
          margin-bottom: 30px;
          font-family: "Fira Code", monospace;
          line-height: 1.6;
        }

        .penalty-amount {
          color: var(--accent-color);
          font-weight: bold;
          font-size: 1.2rem;
        }

        .modal-question {
          margin-top: 20px;
          font-weight: bold;
          color: #fff;
        }

        .modal-actions {
          display: flex;
          gap: 20px;
          justify-content: center;
        }

        .modal-btn {
          padding: 12px 30px;
          font-family: "Fira Code", monospace;
          font-weight: bold;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .confirm {
          background: var(--accent-color);
          color: #fff;
          border: none;
          box-shadow: 0 0 15px rgba(255, 0, 60, 0.3);
        }

        .confirm:hover {
          background: #ff2b5a;
          box-shadow: 0 0 20px rgba(255, 0, 60, 0.5);
        }

        .cancel {
          background: transparent;
          color: var(--text-secondary);
          border: 1px solid #444;
        }

        .cancel:hover {
          border-color: #666;
          color: #fff;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
