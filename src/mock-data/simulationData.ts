import { clients } from "./client";
import type { Client } from "./client";

export type PaticipationStatus =
  | "participated"
  | "unparticipated"
  | "training"
  | "uploading"
  | "disconnected"
  | "failed";

export type SimulationStatus =
  | "idle"
  | "running"
  | "paused"
  | "completed";

export type SimulationPhase =
  | "idle"
  | "selecting"
  | "training"
  | "aggregating"
  | "evaluating"
  | "completed";

export type ClientRoundMetric = {
  clientId: string;
  round: number;
  status: PaticipationStatus;
  trainLoss?: number;
  trainAccuracy?: number;
  validationLoss?: number;
  validationAccuracy?: number;
}

export type GlobalRoundMetric = {
  round: number;
  accuracy: number;
  loss: number;
  participatingClients: number
}
export type SimulationRound = {
  round: number;
  status: SimulationStatus;
  selectedClientIds: string[];
  metrics: ClientRoundMetric[];
}

export type SimulationState = {
  currentRound: number;
  totalRounds: number;
  running: boolean;
  status: SimulationStatus;
  phase: SimulationPhase;
  rounds: SimulationRound[];
  globalMetrics: GlobalRoundMetric[];
};

function getMockMetrics(round: number, allClients: Client[]): ClientRoundMetric[] {

  return allClients.map((client, index) => {
    const selected = (index + round) % 2 === 0;

    if (!selected) {
      return {
        round,
        clientId: client.id,
        status: "unparticipated",
      };
    }

    return {
      round,
      clientId: client.id,
      status: "participated",
      trainLoss: Number(
        Math.max(0.1, 0.8 - round * 0.05 + index * 0.005).toFixed(4)
      ),
      trainAccuracy: Number(
        Math.min(0.99, 0.65 + round * 0.025).toFixed(4)
      ),
      validationLoss: Number(
        Math.max(0.1, 0.9 - round * 0.04).toFixed(4)
      ),
      validationAccuracy: Number(
        Math.min(0.99, 0.62 + round * 0.02).toFixed(4)
      )
    };
  });
}

export const simulationRounds: SimulationRound[] =
  Array.from({ length: 8 }, (_, index) => {
    const round = index + 1;
    const metrics = getMockMetrics(round, clients);
    return {
      round,
      status: "completed",
      selectedClientIds: metrics
        .filter((metric) => metric.status !== "unparticipated")
        .map((metric) => metric.clientId),
      metrics,
    };
});

export const globalRoundMetrics: GlobalRoundMetric[] =
  simulationRounds.map((round) => ({
    round: round.round,
    accuracy: Number(
      Math.min(0.99, 0.6 + round.round * 0.035).toFixed(4)
    ),
    loss: Number(
      Math.max(0.1, 0.95 - round.round * 0.09).toFixed(4)
    ),
    participatingClients: round.selectedClientIds.length
  }));

export const initialSimulationState: SimulationState = {
  currentRound: 8,
  totalRounds: 100,
  running: false,
  status: "paused",
  phase: "training",
  rounds: simulationRounds,
  globalMetrics: globalRoundMetrics
};

export function getClientRoundMetrics(clientId: string, rounds: SimulationRound[]) {
  return rounds
    .flatMap((round)=>round.metrics)
    .filter((metric) => metric.clientId == clientId)
    .sort((a,b) => a.round - b.round)
}


export function getClientParticipationRate(clientId: string, rounds: SimulationRound[]): number {
  const history = getClientRoundMetrics(clientId, rounds);
  if (history.length == 0) return 0;

  return (
    (history.filter(
      (metric) => metric.status === "participated"
    ).length / history.length) * 100
  );
}
