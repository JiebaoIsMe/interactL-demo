import { useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import {
  defaultPartitionConfig,
  generateDatasetPartition,
  datasetOptions,
} from "../mock-data/datasetPartition";
import type {
  DatasetPartition,
  PartitionConfig,
  PartitionMethod,
} from "../mock-data/datasetPartition";
import {
  DatasetStackedBarChart,
  type ChartMode,
} from "../components/dataset-stacked-barchart";
import { useDraggableModal } from "./useDraggableModel";

type Props = {
  datasetPartition: DatasetPartition;
  setDatasetPartition: Dispatch<SetStateAction<DatasetPartition>>;
  onClose: () => void;
};

type GroupFilter = "all" | "group1" | "group2" | "group3";

// type ClientDisplayMode = "all" | "observed";

// const CLIENT_DISPLAY_OPTIONS = [
//   { value: "all", label: "All Clients" },
//   { value: "observed", label: "Observed Clients" },
// ];

const PAGE_SIZE = 10;
const GROUP_RANGES: Record<Exclude<GroupFilter, "all">, [number, number]> = {
  group1: [0, 30],
  group2: [30, 80],
  group3: [80, 100],
};

function DatasetDistributionModal({
  datasetPartition,
  setDatasetPartition,
  onClose,
}: Props) {
  const [config, setConfig] = useState<PartitionConfig>(() => ({
    ...defaultPartitionConfig,
  }));
  const [selectedDataset, setSelectedDataset] = useState(
    () => datasetPartition.datasetName || datasetOptions[0]?.name || ""
  );
  const [group, setGroup] = useState<GroupFilter>("all");
  const [mode, setMode] = useState<ChartMode>("percentage");
  const [page, setPage] = useState(1);
  const [showConfiguration, setShowConfiguration] = useState(true);

  const {
    modalRef,
    position,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  } = useDraggableModal();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const selectedOption = useMemo(
    () => datasetOptions.find((option) => option.name === selectedDataset),
    [selectedDataset]
  );

  const filteredPartitions = useMemo(() => {
    if (group === "all") return datasetPartition.partitions;
    const [start, end] = GROUP_RANGES[group];
    return datasetPartition.partitions.slice(start, end);
  }, [datasetPartition.partitions, group]);

  const totalPages = Math.max(1, Math.ceil(filteredPartitions.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visiblePartitions = useMemo(
    () => filteredPartitions.slice(
      (currentPage - 1) * PAGE_SIZE,
      currentPage * PAGE_SIZE
    ),
    [filteredPartitions, currentPage]
  );

  const totalSamples = useMemo(
    () => datasetPartition.partitions.reduce(
      (sum, partition) => sum + partition.totalSamples,
      0
    ),
    [datasetPartition.partitions]
  );

  function applyPartition() {
    if (!selectedOption) return;

    const nextConfig: PartitionConfig = {
      ...config,
      numClasses: selectedOption.numClasses,
      samplesPerClient: selectedOption.samplesPerClient,
    };

    setConfig(nextConfig);
    setDatasetPartition({
      ...generateDatasetPartition(nextConfig),
      datasetName: selectedOption.name,
    });
    setPage(1);
  }

  function exportCSV() {
    const headers = [
      "Client ID",
      "Total Samples",
      ...Array.from(
        { length: datasetPartition.numClasses },
        (_, index) => `Class ${index}`
      ),
    ];
    const rows = datasetPartition.partitions.map((partition) => [
      partition.clientId,
      partition.totalSamples,
      ...partition.classCounts,
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "dataset-partitions.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  return (
    <div
      className="simulation-modal-overlay"
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="simulation-modal dataset-distribution-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Dataset Distribution"
        style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      >
        <header
          className="simulation-modal-header draggable-modal-header"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div>
            <h2>Dataset Distribution</h2>
            <p className="dataset-modal-subtitle">
              {datasetPartition.datasetName || "Current dataset"} · {datasetPartition.partitions.length} clients
            </p>
          </div>
          <button
            type="button"
            className="simulation-modal-close-button"
            aria-label="Close dataset distribution"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className="simulation-modal-body">
          <section className="dataset-summary" aria-label="Dataset summary">
            <div><span>Clients</span><strong>{datasetPartition.partitions.length}</strong></div>
            <div><span>Total Samples</span><strong>{totalSamples.toLocaleString()}</strong></div>
            <div><span>Classes</span><strong>{datasetPartition.numClasses}</strong></div>
          </section>

          <section className="dataset-modal-section" aria-labelledby="dataset-distribution-heading">
            <div className="dataset-modal-section-heading">
              <h3 id="dataset-distribution-heading">Class Distribution</h3>
              <span>{filteredPartitions.length} clients · {mode === "percentage" ? "Percentage" : "Sample count"}</span>
            </div>

            <div className="dataset-controls">
              <label>
                Client Group
                <select
                  value={group}
                  onChange={(event) => {
                    setGroup(event.target.value as GroupFilter);
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
                  onChange={(event) => setMode(event.target.value as ChartMode)}
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="count">Sample Count</option>
                </select>
              </label>
            </div>

            <div className="dataset-chart-container">
              <DatasetStackedBarChart
                partitions={visiblePartitions}
                numClasses={datasetPartition.numClasses}
                mode={mode}
              />
            </div>
            <p className="dataset-modal-page-note">
              Showing {filteredPartitions.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredPartitions.length)} of {filteredPartitions.length} clients
            </p>
          </section>

          <section className="dataset-modal-section" aria-labelledby="dataset-configuration-heading">
            <button
              type="button"
              className="dataset-modal-section-toggle"
              aria-expanded={showConfiguration}
              aria-controls="dataset-configuration-content"
              onClick={() => setShowConfiguration((value) => !value)}
            >
              <span id="dataset-configuration-heading">Partition Configuration</span>
              <span aria-hidden="true">{showConfiguration ? "−" : "+"}</span>
            </button>

            {showConfiguration && (
              <div id="dataset-configuration-content" className="dataset-modal-configuration-content">
                <div className="dataset-controls">
                  <label>
                    Partition Method
                    <select
                      value={config.method}
                      onChange={(event) => setConfig((previous) => ({
                        ...previous,
                        method: event.target.value as PartitionMethod,
                      }))}
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
                      onChange={(event) => {
                        const option = datasetOptions.find(
                          (item) => item.name === event.target.value
                        );
                        setSelectedDataset(event.target.value);
                        if (option) setConfig((previous) => ({
                          ...previous,
                          numClasses: option.numClasses,
                          samplesPerClient: option.samplesPerClient,
                        }));
                      }}
                    >
                      {datasetOptions.map((option) => (
                        <option key={option.name} value={option.name}>{option.name}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Classes
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={selectedOption?.numClasses ?? config.numClasses}
                      disabled={Boolean(selectedOption)}
                      onChange={(event) => setConfig((previous) => ({
                        ...previous,
                        numClasses: Number(event.target.value),
                      }))}
                    />
                  </label>
                  <label>
                    Samples / Client
                    <input
                      type="number"
                      min={1}
                      value={selectedOption?.samplesPerClient ?? config.samplesPerClient}
                      disabled={Boolean(selectedOption)}
                      onChange={(event) => setConfig((previous) => ({
                        ...previous,
                        samplesPerClient: Number(event.target.value),
                      }))}
                    />
                  </label>
                </div>

                {config.method === "dirichlet" && (
                  <div className="dataset-alpha-control">
                    <div className="dataset-alpha-header">
                      <label htmlFor="dirichlet-alpha">Dirichlet Alpha (α)</label>
                      <strong>{config.alpha.toFixed(2)}</strong>
                    </div>
                    <input
                      id="dirichlet-alpha"
                      type="range"
                      min={0.01}
                      max={0.1}
                      step={0.01}
                      value={Math.max(0.01, config.alpha)}
                      onChange={(event) => setConfig((previous) => ({
                        ...previous,
                        alpha: Number(event.target.value),
                      }))}
                    />
                    <div className="dataset-alpha-labels">
                      <span>0.01 — Highly Non-IID</span>
                      <span>0.10 — Less skewed</span>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  className="dataset-apply-button"
                  onClick={applyPartition}
                  disabled={!selectedOption}
                >
                  Apply Partition
                </button>
              </div>
            )}
          </section>
        </div>

        <footer className="dataset-modal-footer">
          <div className="dataset-pagination">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage((previous) => Math.max(1, previous - 1))}
            >
              Previous
            </button>
            <span>Page {currentPage} / {totalPages}</span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((previous) => Math.min(totalPages, previous + 1))}
            >
              Next
            </button>
          </div>
          <button type="button" className="dataset-export-button" onClick={exportCSV}>
            Export CSV
          </button>
        </footer>
      </div>
    </div>
  );
}

export default DatasetDistributionModal;
