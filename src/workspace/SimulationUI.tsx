import { useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { createPortal } from "react-dom";

import { Play, Pause, RotateCcw, Database, ChartNoAxesCombined } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import DatasetDistributionModal from "../modal/DatasetModal";
import ModalDropdown from "../components/modal-dropdown";
import HudButton from "../components/hud-button";
import { HudDockItems } from "../components/hud-dock";
import {
  type SimulationState,
  type SimulationRound,
  getClientRoundMetrics,
} from "../mock-data/simulationData";
import type { DatasetPartition } from "../mock-data/datasetPartition";

type SimulationUIProps = {
  simulation: SimulationState;
  datasetPartition: DatasetPartition;
  setDatasetPartition: Dispatch<SetStateAction<DatasetPartition>>;
  rounds: SimulationRound[];
  observedClientIds: string[];
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
};

type ProgressTab = "rounds" | "metrics";
type ClientDisplayMode = "all" | "observed";

const CLIENT_DISPLAY_OPTIONS: { value: ClientDisplayMode; label: string }[] = [
  { value: "all", label: "All Clients" },
  { value: "observed", label: "Observed Clients" },
];

function SimulationUI({
  simulation,
  datasetPartition,
  setDatasetPartition,
  rounds,
  observedClientIds,
  onStart,
  onPause,
  onReset,
}: SimulationUIProps) {
  const [activeTab, setActiveTab] = useState<ProgressTab | null>(null);
  const [showDatasetModal, setShowDatasetModal] = useState(false);
  const [clientDisplayMode, setClientDisplayMode] = useState<ClientDisplayMode>("all");

  const progress = simulation.totalRounds > 0
    ? Math.min(100, (simulation.currentRound / simulation.totalRounds) * 100)
    : 0;

  // The global chart is preserved for All Clients. In Observed Clients mode,
  // calculate the average metrics of participating observed clients per round.
  const observedMetrics = useMemo(() => {
    const byRound = new Map<number, { accuracySum: number; accuracyCount: number; lossSum: number; lossCount: number }>();

    for (const clientId of observedClientIds) {
      for (const metric of getClientRoundMetrics(clientId, rounds)) {
        if (metric.status !== "participated") continue;

        const entry = byRound.get(metric.round) ?? {
          accuracySum: 0,
          accuracyCount: 0,
          lossSum: 0,
          lossCount: 0,
        };

        if (typeof metric.validationAccuracy === "number") {
          entry.accuracySum += metric.validationAccuracy;
          entry.accuracyCount += 1;
        }
        if (typeof metric.validationLoss === "number") {
          entry.lossSum += metric.validationLoss;
          entry.lossCount += 1;
        }
        byRound.set(metric.round, entry);
      }
    }

    return [...byRound.entries()]
      .sort(([a], [b]) => a - b)
      .map(([round, entry]) => ({
        round,
        accuracy: entry.accuracyCount ? entry.accuracySum / entry.accuracyCount : null,
        loss: entry.lossCount ? entry.lossSum / entry.lossCount : null,
      }));
  }, [observedClientIds, rounds]);

  const isObservedMode = clientDisplayMode === "observed";
  const chartData = isObservedMode ? observedMetrics : simulation.globalMetrics;
  const hasObservedData = observedMetrics.some(
    (metric) => metric.accuracy !== null || metric.loss !== null
  );

  return (
    <>
    <div className="simulation-control-stack">
        <div className="simulation-progress-hud" role="status">
          <span className={`simulation-progress-badge ${simulation.status}`}>
            {simulation.status.toUpperCase()}
          </span>

          <strong>
            Round {simulation.currentRound} / {simulation.totalRounds}
          </strong>

          <strong>{Math.round(progress)}%</strong>

          <span>Phase: {simulation.phase}</span>
        </div>

        <div className="hud-actions">
          <HudButton
            icon={Play}
            label={simulation.status === "paused" ? "Resume" : "Start"}
            tone="primary"
            onClick={onStart}
            disabled={simulation.status === "running" || simulation.status === "completed"}
          />
          <HudButton
            icon={Pause}
            label="Pause"
            onClick={onPause}
            disabled={simulation.status !== "running"}
          />
          <HudButton
            icon={RotateCcw}
            label="Reset"
            tone="warn"
            onClick={onReset}
            disabled={simulation.status === "idle"}
          />
        </div>
      </div>

      {showDatasetModal && (
        <DatasetDistributionModal
          datasetPartition={datasetPartition}
          setDatasetPartition={setDatasetPartition}
          onClose={() => setShowDatasetModal(false)}
        />
      )}

      {activeTab !== null && createPortal(
        <div
          className="simulation-modal-overlay"
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            if (event.target === event.currentTarget) setActiveTab(null);
          }}
        >
          <div
            className="simulation-modal"
            role="dialog"
            aria-modal="true"
            aria-label={activeTab === "rounds" ? "Round Progress" : "Simulation Metrics"}
          >
            <header className="simulation-modal-header">
              <h2>{activeTab === "rounds" ? "Rounds Progress" : "Simulation Metrics"}</h2>
              <button
                type="button"
                className="simulation-modal-close-button"
                onClick={() => setActiveTab(null)}
                aria-label="Close modal"
              >
                ×
              </button>
            </header>

            <div className="simulation-modal-body">
              <div className="simulation-round-indicator">
                <span className={`simulation-status ${simulation.status}`}>
                  {simulation.status.toUpperCase()}
                </span>
                <strong>Round {simulation.currentRound} / {simulation.totalRounds}</strong>
              </div>

              {activeTab === "rounds" && (
                <section className="simulation-section">
                  <div>
                    <strong>Round {simulation.currentRound} / {simulation.totalRounds}</strong>
                    <span> {Math.round(progress)} %</span>
                  </div>
                  <p className="simulation-phase">Current phase: {simulation.phase}</p>
                </section>
              )}

              {activeTab === "metrics" && (
                <>
                  <div className="simulation-metrics-controls">
                    <label className="simulation-metrics-filter-label">Display Clients</label>
                    <ModalDropdown<ClientDisplayMode>
                      ariaLabel="Display clients"
                      value={clientDisplayMode}
                      options={CLIENT_DISPLAY_OPTIONS}
                      onChange={setClientDisplayMode}
                    />
                    {isObservedMode && (
                      <span className="simulation-metrics-client-count">
                        {observedClientIds.length} observed
                      </span>
                    )}
                  </div>

                  {isObservedMode && (!observedClientIds.length || !hasObservedData) ? (
                    <div className="simulation-metrics-empty" role="status">
                      {observedClientIds.length === 0
                        ? "No observed clients to display. Observe clients to see their metrics."
                        : "No validation metrics available for the observed clients yet."}
                    </div>
                  ) : (
                    <section className="simulation-chart">
                      {isObservedMode && (
                        <p className="simulation-metrics-caption">
                          Mean validation accuracy and loss of participating observed clients per round.
                        </p>
                      )}
                      <ResponsiveContainer width="100%" height={700}>
                        <LineChart
                          data={chartData}
                          margin={{ top: 10, right: 20, left: 20, bottom: 25 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="round"
                            label={{
                              value: "Rounds",
                              position: "insideBottom",
                              style: { fontSize: 12, fontWeight: 600, fill: "#000000" },
                            }}
                          />
                          <YAxis
                            domain={[0, 1]}
                            label={{
                              value: "Accuracy / Loss",
                              position: "insideLeft",
                              angle: -90,
                              style: { fontSize: 12, fontWeight: 600, fill: "#000000" },
                            }}
                          />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="accuracy"
                            name={isObservedMode ? "Mean Validation Accuracy" : "accuracy"}
                            stroke="#008000"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            connectNulls={false}
                            isAnimationActive={false}
                          />
                          <Line
                            type="monotone"
                            dataKey="loss"
                            name={isObservedMode ? "Mean Validation Loss" : "Loss"}
                            stroke="#ff0000"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            connectNulls={false}
                            isAnimationActive={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </section>
                  )}
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      <HudDockItems>
        <HudButton icon={Database} label="Data Partition" onClick={() => setShowDatasetModal(true)} />
        <HudButton icon={ChartNoAxesCombined} label="Live Metrics" onClick={() => setActiveTab("metrics")} />
      </HudDockItems>
    </>
  );
}

export default SimulationUI;
