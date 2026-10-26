
import { useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import {
  defaultPartitionConfig,
  generateDatasetPartition,
  datasetOptions
} from "../mock-data/datasetPartition";

import type {
  DatasetPartition,
  PartitionConfig,
  PartitionMethod,
} from "../mock-data/datasetPartition";

import {
  DatasetStackedBarChart,
  type ChartMode
} from "../components/dataset-stacked-barchart";

import { useDraggableModal } from "./useDraggableModel";

type Props = {
  datasetPartition: DatasetPartition;
  setDatasetPartition: Dispatch<SetStateAction<DatasetPartition>>;
  onClose: () => void;
};

const PAGE_SIZE = 10;

function DatasetDistributionModal({ datasetPartition, setDatasetPartition, onClose }: Props) {
  const [config, setConfig] = useState<PartitionConfig>(
    defaultPartitionConfig
  );

  const dataset = datasetPartition;

  const [selectedDataset, setSelectedDataset] = useState(
    datasetOptions[0].name
  );

  const [group, setGroup] = useState("all");
  const [mode, setMode] = useState<ChartMode>("percentage");
  const [page, setPage] = useState(1);

  const {
    modalRef,
    position,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  } = useDraggableModal();

  const filteredPartitions = useMemo(() => {
    if (group === "all") return dataset.partitions;

    // Matches the current 30 / 50 / 20 client grouping.
    const ranges: Record<string, [number, number]> = {
      group1: [0, 30],
      group2: [30, 80],
      group3: [80, 100],
    };

    const [start, end] = ranges[group] ?? [0, 100];

    return dataset.partitions.slice(start, end);
  }, [dataset, group]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPartitions.length / PAGE_SIZE)
  );

  const visiblePartitions = filteredPartitions.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const totalSamples = dataset.partitions.reduce(
    (sum, partition) => sum + partition.totalSamples,
    0
  );


  function applyPartition() {
    const selected = datasetOptions.find(
      (option) => option.name === selectedDataset
    );

    if (!selected) return;

    const nextConfig: PartitionConfig = {
      ...config,
      numClasses: selected.numClasses,
      samplesPerClient: selected.samplesPerClient,
    };

    setConfig(nextConfig);
    setDatasetPartition({
      ...generateDatasetPartition(nextConfig),
        datasetName: selected.name
    });
    setPage(1);
  }

  function exportCSV() {
    const headers = [
      "Client ID",
      "Total Samples",
      ...Array.from(
        { length: dataset.numClasses },
        (_, index) => `Class ${index}`
      ),
    ];

    const rows = dataset.partitions.map((partition) => [
      partition.clientId,
      partition.totalSamples,
      ...partition.classCounts,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "dataset-partitions.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div
      className="simulation-modal-overlay"
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className="simulation-modal dataset-distribution-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Dataset Distribution"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
        }}
      >
        <header
          className="simulation-modal-header draggable-modal-header"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <h2>Dataset Distribution</h2>

          <button
            type="button"
            className="simulation-modal-close-button"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className="simulation-modal-body">
          <div className="dataset-summary">
            <div>
              <span>Clients</span>
              <strong>{dataset.partitions.length}</strong>
            </div>

            <div>
              <span>Total Samples</span>
              <strong>{totalSamples.toLocaleString()}</strong>
            </div>

            <div>
              <span>Classes</span>
              <strong>{dataset.numClasses}</strong>
            </div>
          </div>

          <h3>Class Distribution</h3>

          <div className="dataset-controls">
            <label>
              Client Group
              <select
                value={group}
                onChange={(event) => {
                  setGroup(event.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All Clients</option>
                <option value="group1">Group 1 (30)</option>
                <option value="group2">Group 2 (50)</option>
                <option value="group3">Group 3 (20)</option>
              </select>
            </label>

            <label>
              Display Mode
              <select
                value={mode}
                onChange={(event) =>
                  setMode(event.target.value as ChartMode)
                }
              >
                <option value="percentage">Percentage (%)</option>
                <option value="count">Sample Count</option>
              </select>
            </label>
          </div>

          <DatasetStackedBarChart
            partitions={visiblePartitions}
            numClasses={dataset.numClasses}
            mode={mode}
          />

          <h3>Partition Configuration</h3>

          <div className="dataset-controls">
            <label>
              Partition Method
              <select
                value={config.method}
                onChange={(event) =>
                  setConfig({
                    ...config,
                    method: event.target.value as PartitionMethod,
                  })
                }
              >
                <option value="iid">IID</option>
                <option value="dirichlet">Dirichlet Non-IID</option>
                <option value="label-skew">Label Skew</option>
              </select>
            </label>

            <label>
              Dataset
              <select
                value={selectedDataset}
                onChange={(event) => setSelectedDataset(event.target.value)}
              >
                {datasetOptions.map((dataset) => (
                  <option key={dataset.name} value={dataset.name}>
                    {dataset.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Classes
              <input
                type="number"
                min={1}
                max={20}
                value={config.numClasses}
                onChange={(event) =>
                  setConfig({
                    ...config,
                    numClasses: Number(event.target.value),
                  })
                }
              />
            </label>

            <label>
              Samples / Client
              <input
                type="number"
                min={1}
                value={config.samplesPerClient}
                onChange={(event) =>
                  setConfig({
                    ...config,
                    samplesPerClient: Number(event.target.value),
                  })
                }
              />
            </label>

            {config.method === "dirichlet" && (
              <div className="dataset-alpha-control">
                <div className="dataset-alpha-header">
                  <label htmlFor="dirichlet-alpha">
                    Dirichlet Alpha (α)
                  </label>

                  <strong>{config.alpha.toFixed(2)}</strong>
                </div>

                <input
                  id="dirichlet-alpha"
                  type="range"
                  min={0}
                  max={0.1}
                  step={0.01}
                  value={config.alpha}
                  onChange={(event) =>
                    setConfig({
                      ...config,
                      alpha: Number(event.target.value),
                    })
                  }
                />

                <div className="dataset-alpha-labels">
                  <span>0.00 — Highly Non-IID</span>
                  <span>0.10 — Less skewed</span>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            className="dataset-apply-button"
            onClick={applyPartition}
          >
            Apply Partition
          </button>
        </div>

        <footer className="dataset-modal-footer">
          <div className="dataset-pagination">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>

            <span>
              Page {page} / {totalPages}
            </span>

            <button
              type="button"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>

          <button
            type="button"
            className="dataset-export-button"
            onClick={exportCSV}
          >
            Export CSV
          </button>
        </footer>

      </div>
    </div>
  );
}

export default DatasetDistributionModal;
