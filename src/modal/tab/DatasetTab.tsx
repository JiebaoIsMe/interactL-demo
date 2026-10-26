import {type ClientSettings, clientSettingsOptions } from "../../mock-data/client";

import ModalDropdown from "../../components/modal-dropdown";
import ModalInput from "../../components/modal-input";

// Client dataset settings same as Server settings
type DatasetSettings = ClientSettings["dataset"];

type DatasetTabProps = {
  settings: DatasetSettings;
  onChange: (values: Partial<DatasetSettings>) => void;
};

function DatasetTab({ settings, onChange }: DatasetTabProps) {
  return (
    <div className="node-modal-fields">
      <ModalDropdown
        label="Pretrained Dataset"
        value={settings.preDataset}
        options={clientSettingsOptions.datasets}
        onChange={(preDataset) => onChange({ preDataset })}
      />

      <ModalInput
        label="Data Skewness (Heterogeneity 0 - 1)"
        type="number"
        min={0}
        max={1}
        step={0.1}
        value={settings.heterogenity}
        onChange={(e) => onChange({ heterogenity: Number(e.target.value) })}
      />

      <ModalInput
        label="Partitions"
        type="number"
        min={1}
        max={100}
        step={1}
        value={settings.totalPartitions}
        onChange={(e) =>
          onChange({ totalPartitions: Number(e.target.value) })
        }
      />
    </div>
  );
}
export default DatasetTab;
