
export type ClientSettings = {
  general: {
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

export type Client = {
  id: string;
  name: string;
  groupId: number;
};

export type ClientNode = {
  id: number;
  clientIds: string[];
  settings: ClientSettings;
};

export type ObservedClient = {
  clientId: string;
};

export const clientSettingsOptions = {
  lossFunctions: ["cross_entropy", "mse", "binary_cross_entropy"],
  modelArchitectures: ["cnn", "resnet18", "mlp"],
  mlTasks: ["classification", "regression"],
  validationMethods: ["holdout", "k_fold"],
  optimizers: ["Adam", "SGD", "AdamW"],
  metrics: ["accuracy", "precision", "recall", "f1", "loss"],
  datasets: ["mnist", "fashion_mnist", "cifar10"],
} as const;

export const defaultClientSettings: ClientSettings = {
  general: {
    lossFunction: "cross_entropy",
    modelArchitecture: "cnn",
    mlTask: "classification",
    validationMethod: "holdout",
    validationRound: 5,
  },

  train: {
    optimizer: "Adam",
    learningRate: 0.001,
    batchSize: 32,
    localEpochs: 5,
    weightDecay: 0.0001,
  },

  validateTest: {
    validationBatchSize: 32,
    validationMetric: "accuracy",
    testMetric: "accuracy",
    evaluationEnabled: true,
  },

  dataset: {
    preDataset: "mnist",
    heterogenity: 0.5,
    totalPartitions: 100,
  },
};

// Each client belongs to exactly one training group.
const groupSizes = [30, 50, 20];

export const clients: Client[] = groupSizes.flatMap(
  (size, groupIndex) => {
    const precedingCount = groupSizes
      .slice(0, groupIndex)
      .reduce((sum, count) => sum + count, 0);

    return Array.from({ length: size }, (_, index) => {
      const id = String(precedingCount + index + 1).padStart(3, "0");

      return {
        id: `C-${id}`,
        name: `Client ${id}`,
        groupId: groupIndex + 1,
      };
    });
  }
);

export const clientGroups: ClientNode[] = groupSizes.map(
  (_, index) => {
    const groupId = index + 1;

    const settings = structuredClone(defaultClientSettings);

    if (groupId === 2) {
      settings.train.optimizer = "SGD";
      settings.train.batchSize = 64;
    }

    if (groupId === 3) {
      settings.train.learningRate = 0.0001;
      settings.train.batchSize = 16;
    }

    return {
      id: groupId,
      clientIds: clients
        .filter((client) => client.groupId === groupId)
        .map((client) => client.id),
      settings,
    };
  }
);

// Initial observation list.
// These clients remain in their original training groups.
export const initialObservedClients: ObservedClient[] = [
  { clientId: "C-017" },
  { clientId: "C-032" },
];
