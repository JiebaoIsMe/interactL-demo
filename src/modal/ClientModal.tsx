
import { useState } from "react";
import SettingsTabs from "./tab/SettingsTabs";

import {
  defaultClientSettings,
  type Client,
  type ClientNode,
  type ClientSettings,
} from "../mock-data/client";

import {
  simulationRounds,
  getClientRoundMetrics,
  getClientParticipationRate,
} from "../mock-data/simulationData";

import ModalDropdown from "../components/modal-dropdown";
import ModalInput from "../components/modal-input";

import { useDraggableModal } from "./useDraggableModel";

type ClientModalMode = "group" | "client" | "observed";
type ClientView = "clients" | "settings";

type ClientModalProps = {
  groups: ClientNode[];
  clients: Client[];
  selectedGroupId?: number;
  selectedClientId?: string;
  mode?: ClientModalMode;
  observedClientIds: string[];
  onObserve: (clientId: string) => void;
  onUnobserve: (clientId: string) => void;
  onSaveGroup: (
    groupId: number,
    settings: ClientSettings
  ) => void;
  onClose: () => void;
};

function ClientModal({
  groups,
  clients,
  selectedGroupId,
  selectedClientId,
  observedClientIds,
  onObserve,
  onUnobserve,
  onSaveGroup,
  onClose,
}: ClientModalProps) {
  const {
    modalRef,
    position,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  } = useDraggableModal();

  const [activeView, setActiveView] =
    useState<ClientView>("clients");

  const [filterGroupId, setFilterGroupId] =
    useState<number | null>(selectedGroupId ?? null);

  const [settingsGroupId, setSettingsGroupId] =
    useState<number | null>(
      selectedGroupId ?? groups[0]?.id ?? null
    );

  const [search, setSearch] = useState(
    selectedClientId ?? ""
  );

  const [focusedClientId, setFocusedClientId] =
    useState<string | null>(
      selectedClientId ?? null
    );

  const [observedOnly, setObservedOnly] = useState(false);

  const selectedGroup = groups.find(
    (group) => group.id === settingsGroupId
  );

  const [draftSettings, setDraftSettings] =
    useState<ClientSettings>(() =>
      structuredClone(
        groups.find(
          (group) =>
            group.id ===
            (selectedGroupId ?? groups[0]?.id)
        )?.settings ?? defaultClientSettings
      )
    );

  const focusedClient = clients.find(
    (client) => client.id === focusedClientId
  );

  const matchingClients = clients.filter((client) => {
    const matchesGroup =
      filterGroupId === null ||
      client.groupId === filterGroupId;

    const query = search.trim().toLowerCase();

    const matchesSearch =
      client.id.toLowerCase().includes(query) ||
      client.name.toLowerCase().includes(query);

    const matchesObservation =
      !observedOnly ||
      observedClientIds.includes(client.id);

    return (
      matchesGroup &&
      matchesSearch &&
      matchesObservation
    );
  });

  const clientHistory = focusedClient
    ? getClientRoundMetrics(
        focusedClient.id,
        simulationRounds
      )
    : [];

  const participationRate = focusedClient
    ? getClientParticipationRate(
        focusedClient.id,
        simulationRounds
      )
    : 0;

  const completedRounds = clientHistory.filter(
    (metric) => metric.status === "participated"
  ).length;

  const latestMetric = [...clientHistory]
    .reverse()
    .find(
      (metric) => metric.status === "participated"
    );

  function handleSelectClient(client: Client) {
    setFocusedClientId(client.id);
  }

  function handleGroupChange(value: string) {
    setFilterGroupId(
      value === "all" ? null : Number(value)
    );
  }

  function handleSettingsGroupChange(value: string) {
    const nextGroupId = Number(value);

    const nextGroup = groups.find(
      (group) => group.id === nextGroupId
    );

    if (!nextGroup) return;

    setSettingsGroupId(nextGroupId);
    setDraftSettings(
      structuredClone(nextGroup.settings)
    );
  }

  function formatMetric(value?: number) {
    return value === undefined
      ? "—"
      : value.toFixed(4);
  }

  if (!selectedGroup) {
    return null;
  }

  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) =>
        event.stopPropagation()
      }
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className="modal client-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Client Configuration"
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
          <h2>Client Manager</h2>

          <button
            type="button"
            className="modal-close-button"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </header>

        {/* Main navigation */}
        <nav
          className="client-view-tabs"
          aria-label="Client manager views"
        >
          <button
            type="button"
            className={
              activeView === "clients" ? "active" : ""
            }
            aria-current={
              activeView === "clients"
                ? "page"
                : undefined
            }
            onClick={() =>
              setActiveView("clients")
            }
          >
            Clients
          </button>

          <button
            type="button"
            className={
              activeView === "settings" ? "active" : ""
            }
            aria-current={
              activeView === "settings"
                ? "page"
                : undefined
            }
            onClick={() =>
              setActiveView("settings")
            }
          >
            Group Settings
          </button>
        </nav>

        {/* Clients view */}
        {activeView === "clients" && (
          <div className="client-modal-browser">
            <div className="client-modal-controls">
              <ModalDropdown
                label="Client Group"
                value={String(
                  filterGroupId ?? "all"
                )}
                onChange={handleGroupChange}
                options={[
                  {
                    value: "all",
                    label: "All Groups",
                  },
                  ...groups.map((group) => ({
                    value: String(group.id),
                    label: `Group ${group.id} (${group.clientIds.length} clients)`,
                  })),
                ]}
              />
            </div>

            <ModalInput
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search by client ID or name..."
              aria-label="Search clients"
            />

            <label className="client-observed-filter">
              <input
                type="checkbox"
                checked={observedOnly}
                onChange={(event) =>
                  setObservedOnly(
                    event.target.checked
                  )
                }
              />
              Observed clients only
            </label>

            <div className="client-modal-list">
              {matchingClients.map((client) => {
                const observed =
                  observedClientIds.includes(
                    client.id
                  );

                return (
                  <div
                    key={client.id}
                    className={`client-modal-row ${
                      focusedClientId === client.id
                        ? "active"
                        : ""
                    }`}
                  >
                    <button
                      type="button"
                      className="client-modal-select"
                      onClick={() =>
                        handleSelectClient(client)
                      }
                    >
                      <strong>{client.id}</strong>

                      <span>{client.name}</span>

                      <small>
                        Group {client.groupId}
                      </small>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        observed
                          ? onUnobserve(client.id)
                          : onObserve(client.id)
                      }
                    >
                      {observed
                        ? "Remove"
                        : "Observe"}
                    </button>
                  </div>
                );
              })}

              {matchingClients.length === 0 && (
                <p>No matching clients found.</p>
              )}
            </div>

            {/* Existing client monitoring */}
            {focusedClient && (
              <section className="client-monitoring">
                <h3>
                  {focusedClient.name} (
                  {focusedClient.id})
                </h3>

                <p>
                  Original Group:{" "}
                  {focusedClient.groupId}
                </p>

                <div className="client-monitoring-summary">
                  <div>
                    <strong>
                      {participationRate.toFixed(1)}%
                    </strong>
                    <span>
                      Participation Rate
                    </span>
                  </div>

                  <div>
                    <strong>
                      {completedRounds}
                    </strong>
                    <span>
                      Completed Rounds
                    </span>
                  </div>

                  <div>
                    <strong>
                      {latestMetric
                        ?.validationAccuracy !==
                      undefined
                        ? `${(
                            latestMetric.validationAccuracy *
                            100
                          ).toFixed(1)}%`
                        : "—"}
                    </strong>
                    <span>
                      Latest Validation Accuracy
                    </span>
                  </div>
                </div>

                <h4>
                  Round Participation History
                </h4>

                <div className="client-history-scroll">
                  <table className="client-history-table">
                    <thead>
                      <tr>
                        <th>Round</th>
                        <th>Status</th>
                        <th>Train Loss</th>
                        <th>Train Accuracy</th>
                        <th>Validation Loss</th>
                        <th>
                          Validation Accuracy
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {clientHistory.map(
                        (metric) => (
                          <tr key={metric.round}>
                            <td>
                              {metric.round}
                            </td>

                            <td>
                              {metric.status}
                            </td>

                            <td>
                              {formatMetric(
                                metric.trainLoss
                              )}
                            </td>

                            <td>
                              {metric.trainAccuracy ===
                              undefined
                                ? "—"
                                : `${(
                                    metric.trainAccuracy *
                                    100
                                  ).toFixed(1)}%`}
                            </td>

                            <td>
                              {formatMetric(
                                metric.validationLoss
                              )}
                            </td>

                            <td>
                              {metric.validationAccuracy ===
                              undefined
                                ? "—"
                                : `${(
                                    metric.validationAccuracy *
                                    100
                                  ).toFixed(1)}%`}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>

                  {clientHistory.length === 0 && (
                    <p>
                      No simulation history available.
                    </p>
                  )}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Group Settings view */}
        {activeView === "settings" && (
          <section className="client-settings-view">
            <div className="client-settings-group-selector">
              <ModalDropdown
                label="Configure Group"
                value={String(
                  settingsGroupId
                )}
                onChange={
                  handleSettingsGroupChange
                }
                options={groups.map(
                  (group) => ({
                    value: String(group.id),
                    label: `Group ${group.id} (${group.clientIds.length} clients)`,
                  })
                )}
              />
            </div>

            <SettingsTabs
              mode="client"
              settings={draftSettings}
              groupId={selectedGroup.id}
              clientTotal={
                selectedGroup.clientIds.length
              }
              onChange={setDraftSettings}
            />
          </section>
        )}

        {/* Footer */}
        <footer className="modal-footer client-modal-footer">
          <button
            type="button"
            onClick={onClose}
          >
            Close
          </button>

          <button
            type="button"
            className="modal-save"
            onClick={() => {
              if (!selectedGroup) return;

              onSaveGroup(selectedGroup.id, draftSettings);
            }}
            disabled={!selectedGroup}
          >
            Save Changes
          </button>
        </footer>
      </div>
    </div>
  );
}

export default ClientModal;
