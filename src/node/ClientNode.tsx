
import clientNodeImg from "../assets/SimulatorClient.svg";

import type { PositionedClientNode } from "./nodePositions";

import NodeConnector from "./NodeConnector";

import type { SimulationStatus } from "../mock-data/simulationData";
type ClientProps = {
  node: PositionedClientNode;
  selected: boolean;
  onSelect: (id: number) => void;
  status: SimulationStatus;
};

function ClientNode({
  node,
  selected,
  status,
  onSelect,
}: ClientProps) {
  return (
    <>
      <NodeConnector x={node.x} y={node.y} status={status} />

      <div
        className={`client-node ${selected ? "selected" : ""}`}
        style={{
          left: `calc(50% + ${node.x}px)`,
          top: `calc(50% + ${node.y}px)`,
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(node.id);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onSelect(node.id);
        }}
      >
        <img
          src={clientNodeImg}
          alt={`Node ${node.id}`}
          draggable={false}
        />

        <span>Node {node.id}</span>
      </div>
    </>
  );
}

export default ClientNode;
