import { type ClientSettings, clientSettingsOptions } from "../../mock-data/client";

import ModalDropdown from "../../components/modal-dropdown";
import ModalInput from "../../components/modal-input";

// Client training settings have the same shape as server training settings.
type TrainSettings = ClientSettings["train"];

type TrainTabProps = {
  settings: TrainSettings;
  onChange: (values: Partial<TrainSettings>) => void;
  fields?: "all" | "basic" | "advanced";
};

function TrainTab({ settings, onChange, fields = "all" }: TrainTabProps) {
  return (
    <div className="node-modal-fields">
      {fields !== "advanced" && (
        <>
          <ModalDropdown
            label="Optimizer"
            value={settings.optimizer}
            options={clientSettingsOptions.optimizers}
            onChange={(optimizer) => onChange({ optimizer })}
          />

          <ModalInput
            label="Learning Rate"
            type="number"
            min={0.0001}
            max={1}
            step={0.0001}
            value={settings.learningRate}
            onChange={(e) => onChange({ learningRate: Number(e.target.value) })}
          />

          <ModalInput
            label="Batch Size"
            type="number"
            min={8}
            max={128}
            step={16}
            value={settings.batchSize}
            onChange={(e) => onChange({ batchSize: Number(e.target.value) })}
          />

          <ModalInput
            label="Local Epochs"
            type="number"
            min={1}
            max={50}
            step={1}
            value={settings.localEpochs}
            onChange={(e) => onChange({ localEpochs: Number(e.target.value) })}
          />
        </>
      )}

      {fields !== "basic" && (
        <ModalInput
          label="Weight Decay"
          type="number"
          min={0}
          max={0.8}
          step={0.001}
          value={settings.weightDecay}
          onChange={(e) => onChange({ weightDecay: Number(e.target.value) })}
        />
      )}
    </div>
  );
}

export default TrainTab;
