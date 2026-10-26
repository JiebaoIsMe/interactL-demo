export type ServerSettings = {
  general: {
    rounds: number;
    fractionFit: number;
    aggregationFunction: string;
    lossFunction: string;
    modelArchitecture: string;
    mlTask: string;
    validationMethod: string;
    validationRound: number;
    };

  train: {
    optimizer: string;
    learningRate: number;
    batchSize: number;
    localEpochs: number;
    weightDecay: number;
  };

  validateTest: {
    validationBatchSize: number;
    validationMetric: string;
    testMetric: string;
    evaluationEnabled: boolean;
  };

  dataset: {
    preDataset: string;
    heterogenity: number;
    totalPartitions: number;
  };
};

export const serverSettingsOptions = {
  aggregationFunctions: ["fedavg", "fedavgm", "fedprox"],
  fractionFitMin: 0,
  fractionFitMax: 100,
  roundsMin: 1,
} as const;

export const defaultServerSettings: ServerSettings = {
  general: {
    lossFunction: "cross_entropy",
    modelArchitecture: "cnn",
    mlTask: "classification",
    validationMethod: "holdout",
    validationRound: 5,
    rounds: 100,
    fractionFit: 50,
    aggregationFunction: "fedavg",
  },

  train: {
    optimizer: "Adam",
    learningRate: 0.001,
    batchSize: 32,
    localEpochs: 5,
    weightDecay: 0.0001
  },

  validateTest: {
    validationBatchSize: 32,
    validationMetric: "accuracy",
    testMetric: "accuracy",
    evaluationEnabled: true
  },

  dataset: {
    preDataset: "mnist",
    heterogenity: 0.5,
    totalPartitions: 100
  }
};

// ClientTotal is derived from actual client records rather than stored separately
export function getServerClientTotal(
  groups: { clientIds: string[] }[]
): number {
  return new Set(
    groups.flatMap((group) => group.clientIds)
  ).size;
}
