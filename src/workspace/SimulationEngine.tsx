import { useEffect } from 'react';
import type { Dispatch, SetStateAction } from "react";

import { clients } from "../mock-data/client";

import type {
  SimulationState,
  SimulationRound,
  ClientRoundMetric,
  GlobalRoundMetric,
} from "../mock-data/simulationData";

import SimulationUI from "./SimulationUI";

import type {
  DatasetPartition
} from "../mock-data/datasetPartition";

const ROUND_INTERVAL = 1500;
const TOTAL_ROUNDS = 100;

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

function generateGlobalMetric(round: SimulationRound): GlobalRoundMetric {
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
};

function SimulationEngine({simulationState,setSimulationState, datasetPartition, setDatasetPartition}: SimulationEngineProps) {

  function startSimulation() {
    setSimulationState((previous) => {
      if (
        previous.status === "running" ||
        previous.status === "completed"
      ) {
        return previous;
      }

      return {
        ...previous,
        running: true,
        status: "running",
        phase: "training",
      };
    });
  }

  function pauseSimulation() {
    setSimulationState((previous) => {
      if (previous.status !== "running") {
        return previous;
      }

      return {
        ...previous,
        running: false,
        status: "paused"
      };
    });
  }

  function resetSimulation() {
    setSimulationState(createInitialState());
  }


  useEffect(() => {
    if (simulationState.status !== "running") return;

    const interval = window.setInterval(() => {
      setSimulationState((previous) => {
        if (previous.status!== "running") {
          return previous;
        }

        if (previous.currentRound >= previous.totalRounds) {
          return {
            ...previous,
            running: false,
            status: "completed",
            phase: "completed",
          };
        }

        const nextRound = previous.currentRound + 1;

        const roundData = generateRound(nextRound);
        const globalMetric = generateGlobalMetric(roundData);

        const completed =
          nextRound >= previous.totalRounds;

        return {
          ...previous,
          currentRound: nextRound,
          running: !completed,
          status: completed ? "completed" : "running",
          phase: completed ? "completed" : "training",
          rounds: [...previous.rounds, roundData],
          globalMetrics: [
            ...previous.globalMetrics,
            globalMetric,
          ],
        };
      });
    }, ROUND_INTERVAL);

    return () => window.clearInterval(interval);
  }, [simulationState.status]);

  return (
    <SimulationUI
      simulation={simulationState}
      datasetPartition={datasetPartition}
      setDatasetPartition={setDatasetPartition}
      onStart={startSimulation}
      onPause={pauseSimulation}
      onReset={resetSimulation}
    />
  );
}

export default SimulationEngine;
