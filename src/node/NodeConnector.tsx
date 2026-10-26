
import type { SimulationStatus } from "../mock-data/simulationData";

type ConnectorProps = {
  x: number;
  y: number;
  observed?: boolean;
  status: SimulationStatus;
};

function NodeConnector({
  x,
  y,
  observed = false,
  status,
}: ConnectorProps) {
  const distance = Math.hypot(x, y);
  const angle = Math.atan2(y, x);

  const animationActive =
    status === "running" || status === "paused";

  return (
    <div
      className={[
        "node-connector",
        observed ? "observed-connector" : "",
        animationActive ? "simulation-active" : "",
        status === "paused" ? "simulation-paused" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        width: `${Math.max(0, distance - 50)}px`,
        transform: `rotate(${angle}rad) translateX(25px)`,
      }}
    />
  );
}

export default NodeConnector;
