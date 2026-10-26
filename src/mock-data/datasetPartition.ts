
import { clients } from "./client";

export type PartitionMethod =
  | "iid"
  | "dirichlet"
  | "label-skew";

export type ClientPartition = {
  clientId: string;
  totalSamples: number;
  classCounts: number[];
};

export type DatasetPartition = {
  datasetName: string;
  numClasses: number;
  method: PartitionMethod;
  alpha?: number;
  partitions: ClientPartition[];
};

export type PartitionConfig = {
  method: PartitionMethod;
  numClasses: number;
  samplesPerClient: number;
  alpha: number;
  seed: number;
};

export const defaultPartitionConfig: PartitionConfig = {
  method: "dirichlet",
  numClasses: 10,
  samplesPerClient: 500,
  alpha: 0.5,
  seed: 42,
};

export type DatasetOption = {
  name: string;
  numClasses: number;
  samplesPerClient: number;
};

export const datasetOptions: DatasetOption[] = [
  {
    name: "MNIST",
    numClasses: 10,
    samplesPerClient: 500,
  },
  {
    name: "Fashion-MNIST",
    numClasses: 10,
    samplesPerClient: 500,
  },
  {
    name: "CIFAR-10",
    numClasses: 10,
    samplesPerClient: 500,
  },
];

// Deterministic pseudo-random generator
function createRandom(seed: number) {
  let state = seed >>> 0;

  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function normalRandom(random: () => number) {
  const u = Math.max(random(), Number.EPSILON);
  const v = random();

  return Math.sqrt(-2 * Math.log(u)) *
    Math.cos(2 * Math.PI * v);
}

// Gamma sampling for Dirichlet distribution
function sampleGamma(
  shape: number,
  random: () => number
): number {
  if (shape < 1) {
    return sampleGamma(shape + 1, random) *
      Math.pow(Math.max(random(), 1e-12), 1 / shape);
  }

  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);

  while (true) {
    const x = normalRandom(random);
    const v = Math.pow(1 + c * x, 3);

    if (v <= 0) continue;

    const u = random();

    if (
      u < 1 - 0.0331 * Math.pow(x, 4) ||
      Math.log(Math.max(u, 1e-12)) <
        0.5 * x * x + d * (1 - v + Math.log(v))
    ) {
      return d * v;
    }
  }
}

function sampleDirichlet(
  classes: number,
  alpha: number,
  random: () => number
): number[] {
  const values = Array.from(
    { length: classes },
    () => sampleGamma(alpha, random)
  );

  const total = values.reduce((sum, value) => sum + value, 0);

  return values.map((value) => value / total);
}

function proportionsToCounts(
  proportions: number[],
  totalSamples: number
): number[] {
  const exact = proportions.map(
    (value) => value * totalSamples
  );

  const counts = exact.map(Math.floor);
  const remaining = totalSamples - counts.reduce((sum, count) => sum + count, 0);

  const order = exact
    .map((value, index) => ({
      index,
      fraction: value - Math.floor(value),
    }))
    .sort((a, b) => b.fraction - a.fraction);

  for (let i = 0; i < remaining; i++) {
    counts[order[i].index]++;
  }

  return counts;
}

export function generateDatasetPartition(config: PartitionConfig): DatasetPartition {
  const random = createRandom(config.seed);

  const numClasses = Math.max(
    1,
    Math.floor(config.numClasses)
  );

  const samplesPerClient = Math.max(
    1,
    Math.floor(config.samplesPerClient)
  );

  const partitions = clients.map((client) => {
    let proportions: number[];

    if (config.method === "iid") {
      proportions = Array(numClasses).fill(1 / numClasses);
    } else if (config.method === "label-skew") {
      const dominantClass = Math.floor(
        random() * numClasses
      );

      proportions = Array(numClasses).fill(
        numClasses === 1 ? 1 : 0.2 / (numClasses - 1)
      );

      proportions[dominantClass] =
        numClasses === 1 ? 1 : 0.8;
    } else {
      proportions = sampleDirichlet(
        numClasses,
        Math.max(config.alpha, 0.01),
        random
      );
    }

    const classCounts = proportionsToCounts(
      proportions,
      samplesPerClient
    );

    return {
      clientId: client.id,
      totalSamples: samplesPerClient,
      classCounts
    };
  });

  return {
    datasetName: "Mock Dataset",
    numClasses,
    method: config.method,
    alpha:
      config.method === "dirichlet"
        ? config.alpha
        : undefined,
    partitions,
  };
}
