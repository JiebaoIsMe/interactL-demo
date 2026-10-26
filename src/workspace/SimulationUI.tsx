import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { createPortal } from "react-dom";

import {
  Play,
  Pause,
  RotateCcw,
  Eye,
  Database,
  ChartNoAxesCombined,
} from "lucide-react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

import DatasetDistributionModal from "../modal/DatasetModal";

import HudButton from "../components/hud-button";
import { HudDockItems } from "../components/hud-dock";

import {
  type SimulationState,
} from "../mock-data/simulationData"

import type {
  DatasetPartition
} from "../mock-data/datasetPartition";

type SimulationUIProps = {
  simulation: SimulationState;
  datasetPartition: DatasetPartition;
  setDatasetPartition: Dispatch<SetStateAction<DatasetPartition>>;
  // callback functions
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}

type ProgressTab = "rounds" | "metrics";
function SimulationUI({simulation, datasetPartition, setDatasetPartition, onStart, onPause, onReset}: SimulationUIProps) {

  const [activeTab, setActiveTab] = useState<ProgressTab | null>(null);

  const [showDatasetModal, setShowDatasetModal] = useState(false);

  const progress =
    simulation.totalRounds > 0
      ? Math.min(
        100,
        (simulation.currentRound / simulation.totalRounds) * 100
      )
      : 0;

  return (
    <>
      {/*Simulation Panel*/}
      <div className="hud-actions">
        <HudButton
          icon={Play}
          label={simulation.status === "paused" ? "Resume" : "Start"}
          tone="primary"
          onClick={onStart}
          disabled={
            simulation.status === "running" ||
            simulation.status === "completed"
          }
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

        <HudButton
          icon={Eye}
          label="Round"
          onClick={() => setActiveTab("rounds")}
        />
      </div>

      {showDatasetModal && (
        <DatasetDistributionModal
          datasetPartition={datasetPartition}
          setDatasetPartition={setDatasetPartition}
          onClose={() => setShowDatasetModal(false)}
        />
      )}

      {/* Live Progress Modal*/}
      {activeTab !== null &&
        createPortal(
          <div
            className="simulation-modal-overlay"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div
              className="simulation-modal"
              role="dialog"
              aria-modal="true"
              aria-label={
                activeTab === "rounds"
                  ? "Round Progress"
                  : "Simulation Metrics"
              }
            >
              <header className="simulation-modal-header">
                <h2>
                  {activeTab === "rounds"
                    ? "Rounds Progress"
                    : "Simulation Metrics"
                  }
                </h2>

                <button
                  type="button"
                  className="simulation-modal-close-button"
                  onClick={() => setActiveTab(null)}
                >
                  x
                </button>
              </header>

              <div className="simulation-modal-body">

                <div className="simulation-round-indicator">
                  <span
                    className={`simulation-status ${simulation.status}`}
                  >
                    {simulation.status.toUpperCase()}
                  </span>

                  <strong>
                    Round {simulation.currentRound} / {simulation.totalRounds}
                  </strong>
                </div>

                {/*Round Progress Tab*/}
                {activeTab === "rounds" && (
                  <section className="simulation-section">
                    <div>
                      <strong>
                        Round {simulation.currentRound} / {" "}
                        {simulation.totalRounds}
                      </strong>
                      <span> {Math.round(progress)} %</span>
                    </div>
                    <p className="simulation-phase">
                      Current phase: {simulation.phase}
                    </p>
                  </section>
                )}
                {/*Metrics Tab*/}
                {activeTab === "metrics" && (
                  <section className="simulation-chart">
                    <ResponsiveContainer width="100%" height={700}>
                      <LineChart
                        data={simulation.globalMetrics}
                        margin={{ top: 10, right: 20, left: 20, bottom: 25 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="round"
                          label={{
                            value: "Rounds",
                            position: "insideBottom",
                            style: {
                              fontSize: 12,
                              fontWeight: 600,
                              fill:"#000000"
                            }
                          }}
                        />
                        <YAxis
                          domain={[0, 1]}
                          label={{
                            value: "Accuracy / Loss",
                            position: "insideLeft",
                            angle:-90,
                            style: {
                              fontSize: 12,
                              fontWeight: 600,
                              fill: "#000000",
                            }
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="accuracy"
                          name="accuracy"
                          stroke="#008000"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                        />

                        <Line
                          type="monotone"
                          dataKey="loss"
                          name="Loss"
                          stroke="#ff0000"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          isAnimationActive={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </section>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Right dock: simulation tools */}
      <HudDockItems>
        <HudButton
          icon={Database}
          label="Data Partition"
          onClick={() => setShowDatasetModal(true)}
        />

        <HudButton
          icon={ChartNoAxesCombined}
          label="Metrics"
          onClick={() => setActiveTab("metrics")}
        />
      </HudDockItems>
    </>
  );
}

export default SimulationUI;
