import clientNodeImg from "../assets/SimulatorClient.svg";
import NodeConnector from "./NodeConnector";

import type { SimulationStatus } from "../mock-data/simulationData";

type ObservedClientsNodeProps = {
  x: number;
  y: number;
  selected: boolean;
  status: SimulationStatus;
  onSelect: (id: string) => void;
};

function ObservedClientsNode({
  x,
  y,
  selected,
  status,
}: ObservedClientsNodeProps) {
  return (
    <>
      <NodeConnector
        x={x}
        y={y}
        observed
        status={status}
      />

      <div
        className={`client-node observed-node ${
          selected ? "selected" : ""
        }`}
        style={{
          left: `calc(50% + ${x}px)`,
          top: `calc(50% + ${y}px)`,
        }}
        title="Observed Clients"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div className="observed-image">
          <img
            src={clientNodeImg}
            alt="Observed clients"
            draggable={false}
          />
          <span className="observed-indicator">●</span>
        </div>

        <span>Observed Clients</span>
      </div>
    </>
  );
}

export default ObservedClientsNode;
