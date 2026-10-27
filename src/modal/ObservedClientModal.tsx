import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import ModalInput from "../components/modal-input";
import ModalDropdown from "../components/modal-dropdown";
import { DatasetStackedBarChart } from "../components/dataset-stacked-barchart";

import { useDraggableModal } from "./useDraggableModel";
import type { Client } from "../mock-data/client";
import type { DatasetPartition } from "../mock-data/datasetPartition";

import {
  type SimulationRound,
  getClientRoundMetrics,
  getClientParticipationRate,
} from "../mock-data/simulationData";

type ObservedClientsModalProps = {
  clients: Client[];
  observedClientIds: string[];
  rounds: SimulationRound[];
  datasetPartition: DatasetPartition;
  onObserve: (clientId: string) => void;
  onUnobserve: (clientId: string) => void;
  onClose: () => void;
};

type FilterMode = "observed" | "all";

const FILTER_OPTIONS: { value: FilterMode; label: string }[] = [
  { value: "observed", label: "Observed Only" },
  { value: "all", label: "All Clients" },
];

function formatNumber(value?: number) {
  return value === undefined ? "—" : value.toFixed(4);
}

function formatPercentage(value?: number) {
  return value === undefined ? "—" : `${(value * 100).toFixed(1)}%`;
}

function ObservedClientsModal({
  clients,
  observedClientIds,
  rounds,
  datasetPartition,
  onObserve,
  onUnobserve,
  onClose,
}: ObservedClientsModalProps) {

  const {
    modalRef,
    position,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  } = useDraggableModal();

  const [search, setSearch] = useState("");
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [filterMode, setFilterMode] = useState<FilterMode>("observed");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(
    null
  );

  // Close modal using Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  // Client list with search and observation filter.
  const filteredClients = useMemo(() => {
    const query = search.trim().toLowerCase();

    return clients.filter((client) => {
      const matchesSearch =
        client.id.toLowerCase().includes(query) ||
        client.name.toLowerCase().includes(query);

      const matchesFilter =
        filterMode === "all" || observedClientIds.includes(client.id);

      return matchesSearch && matchesFilter;
    });
  }, [clients, observedClientIds, search, filterMode]);

  const selectedClient = clients.find(
    (client) => client.id === selectedClientId
  );

  const selectedClientPartition = datasetPartition.partitions.find(
    (partition) => partition.clientId === selectedClientId
  );

  const selectedClientHistory = useMemo(() => {
    if (!selectedClientId) return [];

    return getClientRoundMetrics(selectedClientId, rounds);
  }, [selectedClientId, rounds]);

  const participationRate = selectedClientId
    ? getClientParticipationRate(selectedClientId, rounds)
    : 0;

  const completedRounds = selectedClientHistory.filter(
    (metric) => metric.status === "participated"
  ).length;

  const latestParticipatedRound = [...selectedClientHistory]
    .reverse()
    .find((metric) => metric.status === "participated");

  const latestValidationAccuracy = formatPercentage(
    latestParticipatedRound?.validationAccuracy
  );

  const isSelectedObserved =
    selectedClient !== undefined &&
    observedClientIds.includes(selectedClient.id);

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
        className="modal observed-clients-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Observed Clients"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`
        }}
      >
        <header className="modal-header draggable-modal-header"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div>
            <h2>Observed Clients</h2>
            <p className="observed-modal-subtitle">
              Monitoring {observedClientIds.length} of {clients.length} clients
            </p>
          </div>
          <button
            type="button"
            className="modal-close-button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </header>

        <div className="observed-modal-controls">
          <ModalInput
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by client ID or name..."
            aria-label="Search clients"
          />

          <ModalDropdown<FilterMode>
            ariaLabel="Filter clients"
            value={filterMode}
            options={FILTER_OPTIONS}
            onChange={setFilterMode}
          />
        </div>

        <div
          className="observed-modal-body observed-modal-workspace"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
            alignItems: "start",
            gap: 16,
          }}
        >
          {/* Client browser: selection and observation are independent actions. */}
          <section className="observed-clients-list" aria-label="Client browser" style={{ minWidth: 0 }}>
            <div className="observed-modal-client-header">
              <h3>Client Browser</h3>
              <span>{filteredClients.length} clients</span>
            </div>

            <div
              className="observed-clients-table-wrapper"
              style={{ maxHeight: 520, overflowY: "auto" }}
            >
              {filteredClients.length === 0 ? (
                <p className="observed-modal-empty">No matching clients found.</p>
              ) : (
                <div className="observed-client-browser-list">
                  {filteredClients.map((client) => {
                    const isObserved = observedClientIds.includes(client.id);
                    const isSelected = selectedClientId === client.id;

                    return (
                      <div
                        key={client.id}
                        className={`observed-client-browser-row${isSelected ? " selected" : ""}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: 10,
                          borderBottom: "1px solid #e2e8f0",
                          background: isSelected ? "#ecfeff" : "#fff",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedClientId(client.id)}
                          aria-pressed={isSelected}
                          aria-label={`View ${client.name}, ${client.id}`}
                          style={{
                            flex: 1,
                            minWidth: 0,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-start",
                            gap: 4,
                            padding: 4,
                            border: 0,
                            borderRadius: 0,
                            background: "transparent",
                            textAlign: "left",
                            cursor: "pointer",
                          }}
                        >
                          <strong className="observed-client-id">{client.id}</strong>
                          <span style={{ color: "#334155", fontSize: 13 }}>
                            {client.name}
                          </span>
                          <span style={{ color: "#64748b", fontSize: 12 }}>
                            Group {client.groupId} · {isObserved ? "Observed" : "Not observed"}
                          </span>
                        </button>
                        <button
                          type="button"
                          className={`observed-action-button ${isObserved ? "remove" : "observe"}`}
                          onClick={() => {
                            if (isObserved) {
                              onUnobserve(client.id);
                            } else {
                              onObserve(client.id);
                            }
                          }}
                          aria-label={`${isObserved ? "Remove" : "Observe"} ${client.id}`}
                          style={{ borderRadius: 0 }}
                        >
                          {isObserved ? "Remove" : "Observe"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Individual client monitoring */}
          <section className="observed-modal-details" style={{ minWidth: 0 }}>
            {!selectedClient ? (
              <div className="observed-modal-placeholder">
                Select a client to view its simulation history.
              </div>
            ) : (
              <>
                <div className="observed-modal-client-header">
                  <div>
                    <h3>{selectedClient.name}</h3>
                    <p>
                      {selectedClient.id} · Group {selectedClient.groupId}
                    </p>
                  </div>

                  <span
                    className={`observed-modal-status ${
                      isSelectedObserved ? "active" : ""
                    }`}
                  >
                    {isSelectedObserved ? "Observed" : "Not Observed"}
                  </span>
                </div>

                <div className="observed-modal-summary" aria-label="Client performance summary">
                  <div>
                    <span>Participation Rate</span>
                    <strong>{participationRate.toFixed(1)}%</strong>
                    <small style={{ color: "#64748b", fontSize: 11 }}>
                      Across simulation rounds
                    </small>
                  </div>

                  <div>
                    <span>Completed Rounds</span>
                    <strong>{completedRounds}</strong>
                    <small style={{ color: "#64748b", fontSize: 11 }}>
                      Participated rounds
                    </small>
                  </div>

                  <div>
                    <span>Latest Validation Accuracy</span>
                    <strong>{latestValidationAccuracy}</strong>
                    <small style={{ color: "#64748b", fontSize: 11 }}>
                      {latestParticipatedRound
                        ? `Round ${latestParticipatedRound.round}`
                        : "No recorded accuracy"}
                    </small>
                  </div>
                </div>

                <div className="observed-modal-dataset">
                  <div className="observed-modal-dataset-header">
                    <h4>Dataset Class Distribution</h4>

                    {selectedClientPartition && (
                      <span>
                        {selectedClientPartition.totalSamples.toLocaleString()} samples
                      </span>
                    )}
                  </div>

                  {selectedClientPartition ? (
                    <DatasetStackedBarChart
                      partitions={[selectedClientPartition]}
                      numClasses={datasetPartition.numClasses}
                      mode="percentage"
                      height={220}
                    />
                  ) : (
                    <p className="observed-modal-empty">
                      No dataset partition available for this client.
                    </p>
                  )}
                </div>

                <section className="observed-modal-history" aria-label="Round history">
                  <button
                    type="button"
                    className="observed-modal-history-toggle"
                    aria-expanded={historyExpanded}
                    aria-controls="observed-client-round-history"
                    onClick={() => setHistoryExpanded((expanded) => !expanded)}
                    style={{
                      width: "100%",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 0",
                      background: "transparent",
                      border: 0,
                      borderBottom: "1px solid #cbd5e1",
                      borderRadius: 0,
                      color: "#1e293b",
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <span>Round History ({selectedClientHistory.length})</span>
                    <span aria-hidden="true">{historyExpanded ? "−" : "+"}</span>
                  </button>

                  <div
                    id="observed-client-round-history"
                    hidden={!historyExpanded}
                    style={{ paddingTop: historyExpanded ? 12 : 0 }}
                  >
                      {selectedClientHistory.length === 0 ? (
                        <p className="observed-modal-empty">
                          No simulation history available.
                        </p>
                      ) : (
                        <div className="observed-modal-table-wrapper">
                          <table className="observed-modal-table">
                            <thead>
                              <tr>
                                <th>Round</th>
                                <th>Status</th>
                                <th>Train Loss</th>
                                <th>Train Accuracy</th>
                                <th>Validation Loss</th>
                                <th>Validation Accuracy</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedClientHistory.map((metric) => (
                                <tr key={metric.round}>
                                  <td>{metric.round}</td>
                                  <td>{metric.status}</td>
                                  <td>{formatNumber(metric.trainLoss)}</td>
                                  <td>{formatPercentage(metric.trainAccuracy)}</td>
                                  <td>{formatNumber(metric.validationLoss)}</td>
                                  <td>{formatPercentage(metric.validationAccuracy)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                  </div>
                </section>
              </>
            )}
          </section>
        </div>

        <footer className="modal-footer">
          <button type="button" className="modal-cancel" onClick={onClose}>
            Close
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}

export default ObservedClientsModal;
