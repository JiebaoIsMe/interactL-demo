
import { useState } from "react";

import SettingsTabs from "./tab/SettingsTabs";

import type {
  ServerSettings,
} from "../mock-data/server";

import { useDraggableModal } from "./useDraggableModel";
type ServerModalProps = {
  settings: ServerSettings;
  clientTotal: number;
  onSave: (settings: ServerSettings) => void;
  onClose: () => void;
};

function ServerModal({ settings, clientTotal, onSave, onClose }: ServerModalProps) {
  const [draftSettings, setDraftSettings] = useState<ServerSettings>(() => structuredClone(settings));

  const {
    modalRef,
    position,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  } = useDraggableModal();

  return (
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
        aria-label="Server Settings"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
        }}
      >
        <header
          className="modal-header draggable-modal-header"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <h2> Server Configuration </h2>

          <button
            type="button"
            className="modal-close-button"
            onClick={onClose}
          >
            x
          </button>
        </header>

        <SettingsTabs
          mode="server"
          settings={draftSettings}
          clientTotal={clientTotal}
          onChange={setDraftSettings}
        />

        <footer className="modal-footer">
          <button type="button" onClick={onClose}>
            Cancel
          </button>

          <button
            type="button"
            className="modal-save"
            onClick={() => onSave(draftSettings)}
          >
            Save Changes
          </button>
        </footer>
      </div>
    </div>
  );
}

export default ServerModal;
