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

        <div className="observed-modal-body">
          {/* Client selection table */}
          <section className="observed-clients-list">
            {filteredClients.length === 0 ? (
              <p className="observed-modal-empty">No matching clients found.</p>
            ) : (
              <div className="observed-clients-table-wrapper">
                <table className="observed-clients-table">
                  <thead>
                    <tr>
                      <th>Client ID</th>
                      <th>Client Name</th>
                      <th>Client Group</th>
                      <th>Info</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredClients.map((client) => {
                      const isObserved = observedClientIds.includes(client.id);

                      return (
                        <tr
                          key={client.id}
                          className={
                            selectedClientId === client.id ? "selected" : ""
                          }
                        >
                          <td className="observed-client-id">{client.id}</td>
                          <td>{client.name}</td>
                          <td>
                            <span className="observed-group-pill">
                              Group {client.groupId}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="observed-view-button"
                              onClick={() => setSelectedClientId(client.id)}
                            >
                              View Info
                            </button>
                          </td>
                          <td>
                            <button
                              type="button"
                              className={`observed-action-button ${
                                isObserved ? "remove" : "observe"
                              }`}
                              onClick={() => {
                                if (isObserved) {
                                  onUnobserve(client.id);

                                  if (selectedClientId === client.id) {
                                    setSelectedClientId(null);
                                  }
                                } else {
                                  onObserve(client.id);
                                }
                              }}
                            >
                              {isObserved ? "Remove" : "Observe"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Individual client monitoring */}
          <section className="observed-modal-details">
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

                <div className="observed-modal-summary">
                  <div>
                    <span>Participation Rate</span>
                    <strong>{participationRate.toFixed(1)}%</strong>
                  </div>

                  <div>
                    <span>Completed Rounds</span>
                    <strong>{completedRounds}</strong>
                  </div>

                  <div>
                    <span>Latest Validation Accuracy</span>
                    <strong>
                      {formatPercentage(
                        latestParticipatedRound?.validationAccuracy
                      )}
                    </strong>
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
                      height={300}
                    />
                  ) : (
                    <p className="observed-modal-empty">
                      No dataset partition available for this client.
                    </p>
                  )}
                </div>

                <h4>Round History</h4>

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

                {selectedClientHistory.length === 0 && (
                  <p className="observed-modal-empty">
                    No simulation history available.
                  </p>
                )}
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
