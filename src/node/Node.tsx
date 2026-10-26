
import { Users, Eye, Server, Network } from "lucide-react";

import { useState } from "react";
import { createPortal } from "react-dom";

import ServerNode from "./ServerNode";
import ClientNode from "./ClientNode";
import ServerModal from "../modal/ServerModal";
import ClientModal from "../modal/ClientModal";
import ObservedClientsModal from "../modal/ObservedClientModal";
import ObservedClientsNode from "./ObservedClientNode";

import HudButton from "../components/hud-button";
import { HudDockItems } from "../components/hud-dock";

import { generateClientPositions } from "./nodePositions";

import type { SimulationState } from "../mock-data/simulationData";

import type {
  DatasetPartition,
} from "../mock-data/datasetPartition";

import {
  clients as initialClients,
  clientGroups,
  initialObservedClients,
  type ClientNode as ClientNodeType,
  type ClientSettings,
} from "../mock-data/client";

import {
  defaultServerSettings,
  type ServerSettings,
} from "../mock-data/server";

const positionedClients = generateClientPositions(clientGroups);

const observedPosition = {
  id: "observed",
  x: 100,
  y: 100 - 30,
};

type ModalType = "client" | "server" | "observed" | null;

type NodeProps = {
  simulationState: SimulationState;
  datasetPartition: DatasetPartition;
};

function Node({ simulationState, datasetPartition }: NodeProps) {
  // Client group configurations
  const [clientNodes, setClientNodes] = useState<ClientNodeType[]>(
    () => structuredClone(clientGroups)
  );

  // Individual clients
  const [clients] = useState(() => initialClients);

  // Server configuration
  const [serverSettings, setServerSettings] =
    useState<ServerSettings>(
      () => structuredClone(defaultServerSettings)
    );

  // Selected client group
  const [selectedNodeId, setSelectedNodeId] =
    useState<number | null>(null);

  // Observed clients (visual monitoring only)
  const [observedClientIds, setObservedClientIds] =
    useState<string[]>(
      () => initialObservedClients.map((client) => client.clientId)
    );

  // Observed Client
  const [observeNodeSelected, setObserveNodeSelected] = useState(false);

  // Modal visibility
  const [activeModal, setActiveModal] =
    useState<ModalType>(null);

  const clientTotal = clients.length;

  function observeClient(clientId: string) {
    // Validate client IDs before adding them to the observation list.
    if (!clients.some((client) => client.id === clientId)) {
      return;
    }

    // Prevent duplicate observations.
    setObservedClientIds((previous) =>
      previous.includes(clientId)
        ? previous
        : [...previous, clientId]
    );
  }

  function unobserveClient(clientId: string) {
    setObservedClientIds((previous) =>
      previous.filter((id) => id !== clientId)
    );
  }

  function saveNodeSettings(
    nodeId: number,
    settings: ClientSettings
  ) {
    setClientNodes((previous) =>
      previous.map((node) =>
        node.id === nodeId
          ? { ...node, settings }
          : node
      )
    );

    setActiveModal(null);
  }

  function saveServerSettings(settings: ServerSettings) {
    setServerSettings(settings);
    setActiveModal(null);
  }

  function openClientModal(nodeId?: number) {
    setSelectedNodeId(nodeId ?? null);
    setObserveNodeSelected(false);
    setActiveModal("client");
  }

  function openServerModal() {
    setActiveModal("server");
  }

  function openObservedClientModal() {
    setObserveNodeSelected(true);
    setSelectedNodeId(null);
    setActiveModal("observed");
  }

  function closeModal() {
    setActiveModal(null);
  }

  return (
    <>
      {/* Workspace node toolbar */}
      <HudDockItems>
        <HudButton
          icon={Users}
          label="Clients"
          onClick={() => openClientModal()}
        />

        <HudButton
          icon={Eye}
          label="Observed"
          onClick={() => openObservedClientModal()}
        />

        <HudButton
          icon={Server}
          label="Server"
          onClick={() => openServerModal()}
        />

        <HudButton
          icon={Network}
          label="Network"
          disabled
        />
      </HudDockItems>

      {/* Central server node*/}
      <ServerNode onOpen={openServerModal} />

      {/* Client group nodes */}
      {positionedClients.map((position) => {
        const node = clientNodes.find(
          (item) => item.id === position.id
        );

        if (!node) return null;

        return (
          <ClientNode
            key={node.id}
            node={{
              ...node,
              x: position.x,
              y: position.y,
            }}
            selected={selectedNodeId === node.id}
            status={simulationState.status}
            onSelect={(id) => {
              setSelectedNodeId(id);
              setObserveNodeSelected(false);
            }}
          />
        );
      })}

      {/*Observed Clients Node*/}
      <ObservedClientsNode
        x={observedPosition.x}
        y={observedPosition.y}
        status={simulationState.status}
        selected={observeNodeSelected}
        onSelect={() => {
          setObserveNodeSelected(true);
          setSelectedNodeId(null);
        }}
      />

      {/* Server configuration modal */}
      {activeModal === "server" && (
        createPortal(
          <ServerModal
            settings={serverSettings}
            clientTotal={clientTotal}
            onSave={saveServerSettings}
            onClose={closeModal}
          />,
          document.body
        )
      )}

      {/* Client configuration modal */}
      {activeModal === "client" && (
        createPortal(
          <ClientModal
            groups={clientNodes}
            clients={clients}
            selectedGroupId={selectedNodeId ?? undefined}
            observedClientIds={observedClientIds}
            onObserve={observeClient}
            onUnobserve={unobserveClient}
            onSaveGroup={saveNodeSettings}
            onClose={closeModal}
          />,
          document.body
        )
      )}

      {/* Observed Client configuration modal */}
      {activeModal === "observed" && (
        <ObservedClientsModal
          clients={clients}
          rounds={simulationState.rounds}
          observedClientIds={observedClientIds}
          datasetPartition={datasetPartition}
          onObserve={observeClient}
          onUnobserve={unobserveClient}
          onClose={closeModal}
        />
      )}
    </>
  );
}

export default Node;
