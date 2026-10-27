
import { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import SettingsTabs from "./tab/SettingsTabs";

import type { ServerSettings } from "../mock-data/server";

import { useDraggableModal } from "./useDraggableModel";

type ServerModalProps = {
  settings: ServerSettings;
  clientTotal: number;
  onSave: (settings: ServerSettings) => void;
  onClose: () => void;
};

function ServerModal({
  settings,
  clientTotal,
  onSave,
  onClose,
}: ServerModalProps) {
  const [draftSettings, setDraftSettings] =
    useState<ServerSettings>(() => structuredClone(settings));

  const {
    modalRef,
    position,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  } = useDraggableModal();

  function handleSave() {
    onSave(structuredClone(draftSettings));
  }

  return createPortal(
    <div
      className="modal-overlay"
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className="modal server-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="server-modal-title"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
        }}
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <header
          className="modal-header draggable-modal-header"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div className="server-modal-heading">
            <h2 id="server-modal-title">
              Server Configuration
            </h2>
          </div>

          <button
            type="button"
            className="modal-close-button"
            aria-label="Close server configuration"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </header>

        {/* Scrollable settings */}
        <div className="modal-body server-modal-body">
          <SettingsTabs
            mode="server"
            settings={draftSettings}
            clientTotal={clientTotal}
            onChange={setDraftSettings}
          />
        </div>

        {/* Footer */}
        <footer className="modal-footer">
          <button
            type="button"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="button"
            className="modal-save"
            onClick={handleSave}
          >
            Save Changes
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}

export default ServerModal;
