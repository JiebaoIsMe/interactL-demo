
import { useEffect, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";

import { clients } from "../mock-data/client";

import type {
  SimulationState,
  SimulationRound,
  SimulationPhase,
  ClientRoundMetric,
  GlobalRoundMetric,
} from "../mock-data/simulationData";

import SimulationUI from "./SimulationUI";

import type {
  DatasetPartition,
} from "../mock-data/datasetPartition";

const ROUND_INTERVAL = 1500;
const TOTAL_ROUNDS = 100;

const PHASES: {
  phase: SimulationPhase;
  start: number;
}[] = [
  { phase: "selecting", start: 0 },
  { phase: "training", start: 200 },
  { phase: "aggregating", start: 900 },
  { phase: "evaluating", start: 1250 },
];

export const createInitialState = (): SimulationState => ({
  currentRound: 0,
  totalRounds: TOTAL_ROUNDS,
  running: false,
  status: "idle",
  phase: "idle",
  rounds: [],
  globalMetrics: [],
});

function generateRound(round: number): SimulationRound {
  const metrics: ClientRoundMetric[] = clients.map(
    (client, index) => {
      const selected = (index + round) % 2 === 0;

      if (!selected) {
        return {
          clientId: client.id,
          round,
          status: "unparticipated",
        };
      }

      return {
        clientId: client.id,
        round,
        status: "participated",
        trainLoss: Number(
          Math.max(
            0.1,
            0.8 - round * 0.05 + index * 0.005
          ).toFixed(4)
        ),
        trainAccuracy: Number(
          Math.min(
            0.99,
            0.65 + round * 0.025
          ).toFixed(4)
        ),
        validationLoss: Number(
          Math.max(
            0.1,
            0.9 - round * 0.04
          ).toFixed(4)
        ),
        validationAccuracy: Number(
          Math.min(
            0.99,
            0.62 + round * 0.02
          ).toFixed(4)
        ),
      };
    }
  );

  return {
    round,
    status: "completed",
    selectedClientIds: metrics
      .filter((metric) => metric.status === "participated")
      .map((metric) => metric.clientId),
    metrics,
  };
}

function generateGlobalMetric(
  round: SimulationRound
): GlobalRoundMetric {
  return {
    round: round.round,
    accuracy: Number(
      Math.min(
        0.99,
        0.6 + round.round * 0.035
      ).toFixed(4)
    ),
    loss: Number(
      Math.max(
        0.1,
        0.95 - round.round * 0.09
      ).toFixed(4)
    ),
    participatingClients: round.selectedClientIds.length,
  };
}

type SimulationEngineProps = {
  simulationState: SimulationState;
  setSimulationState: Dispatch<SetStateAction<SimulationState>>;
  datasetPartition: DatasetPartition;
  setDatasetPartition: Dispatch<SetStateAction<DatasetPartition>>;
  observedClientIds: string[];
};

function SimulationEngine({
  simulationState,
  setSimulationState,
  datasetPartition,
  setDatasetPartition,
  observedClientIds,
}: SimulationEngineProps) {
  // Tracks elapsed time within the current round.
  // This allows Pause / Resume to preserve phase progress.
  const elapsedRef = useRef(0);
  const lastTickRef = useRef<number | null>(null);

  // Keep the latest simulation state accessible to the timer.
  const stateRef = useRef(simulationState);
  stateRef.current = simulationState;

  function startSimulation() {
    const previous = stateRef.current;

    if (
      previous.status === "running" ||
      previous.status === "completed"
    ) {
      return;
    }

    // Starting from idle begins a new round.
    // Resuming from paused preserves elapsed progress.
    if (previous.status === "idle") {
      elapsedRef.current = 0;
    }

    lastTickRef.current = null;

    const phase = PHASES.reduce<SimulationPhase>(
      (current, entry) =>
        elapsedRef.current >= entry.start
          ? entry.phase
          : current,
      "selecting"
    );

    setSimulationState((current) => ({
      ...current,
      running: true,
      status: "running",
      phase,
    }));
  }

  function pauseSimulation() {
    setSimulationState((previous) => {
      if (previous.status !== "running") {
        return previous;
      }

      return {
        ...previous,
        running: false,
        status: "paused",
      };
    });
  }

  function resetSimulation() {
    elapsedRef.current = 0;
    lastTickRef.current = null;
    setSimulationState(createInitialState());
  }

  useEffect(() => {
    if (simulationState.status !== "running") {
      lastTickRef.current = null;
      return;
    }

    let frameId = 0;
    let cancelled = false;

    const tick = (timestamp: number) => {
      if (cancelled) return;

      if (lastTickRef.current === null) {
        lastTickRef.current = timestamp;
      }

      const delta = Math.max(
        0,
        timestamp - lastTickRef.current
      );

      lastTickRef.current = timestamp;
      elapsedRef.current += delta;

      const previous = stateRef.current;

      if (previous.status !== "running") return;

      // Complete exactly one round after ROUND_INTERVAL.
      if (elapsedRef.current >= ROUND_INTERVAL) {
        elapsedRef.current -= ROUND_INTERVAL;

        const nextRound = previous.currentRound + 1;
        const roundData = generateRound(nextRound);
        const globalMetric = generateGlobalMetric(roundData);

        const completed =
          nextRound >= previous.totalRounds;

        const nextState: SimulationState = {
          ...previous,
          currentRound: nextRound,
          running: !completed,
          status: completed ? "completed" : "running",
          phase: completed ? "completed" : "selecting",
          rounds: [...previous.rounds, roundData],
          globalMetrics: [
            ...previous.globalMetrics,
            globalMetric,
          ],
        };

        // Update ref immediately so the next frame
        // sees the newest completed round.
        stateRef.current = nextState;
        setSimulationState(nextState);

        if (completed) {
          elapsedRef.current = 0;
          lastTickRef.current = null;
          return;
        }
      } else {
        // Determine phase from elapsed time.
        let currentPhase: SimulationPhase = "selecting";

        for (const entry of PHASES) {
          if (elapsedRef.current >= entry.start) {
            currentPhase = entry.phase;
          }
        }

        if (previous.phase !== currentPhase) {
          const nextState: SimulationState = {
            ...previous,
            phase: currentPhase,
          };

          stateRef.current = nextState;
          setSimulationState(nextState);
        }
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
      lastTickRef.current = null;
    };
  }, [simulationState.status, setSimulationState]);

  return (
    <SimulationUI
      simulation={simulationState}
      datasetPartition={datasetPartition}
      setDatasetPartition={setDatasetPartition}
      rounds={simulationState.rounds}
      observedClientIds={observedClientIds}
      onStart={startSimulation}
      onPause={pauseSimulation}
      onReset={resetSimulation}
    />
  );
}

export default SimulationEngine;
