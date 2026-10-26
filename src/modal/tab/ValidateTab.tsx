import {type ClientSettings, clientSettingsOptions } from "../../mock-data/client";

import ModalDropdown from "../../components/modal-dropdown";
import ModalInput from "../../components/modal-input";
import ModalCheckbox from "../../components/modal-checkbox";

// Client test val settings same as Server settings
type ValidateSettings = ClientSettings["validateTest"];

type ValidateTabProps = {
  settings: ValidateSettings;
  onChange: (values: Partial<ValidateSettings>) => void;
};
function ValidateTab({ settings, onChange }: ValidateTabProps) {
  return (
    <div className="node-modal-fields">
      <ModalInput
        label="Validation Batch Size"
        type="number"
        min={8}
        max={128}
        step={16}
        value={settings.validationBatchSize}
        onChange={(e) =>
          onChange({ validationBatchSize: Number(e.target.value) })
        }
      />

      <ModalDropdown
        label="Validation Metric"
        value={settings.validationMetric}
        options={clientSettingsOptions.metrics}
        onChange={(validationMetric) => onChange({ validationMetric })}
      />

      <ModalDropdown
        label="Test Metric"
        value={settings.testMetric}
        options={clientSettingsOptions.metrics}
        onChange={(testMetric) => onChange({ testMetric })}
      />

      <ModalCheckbox
        label="Enable evaluation"
        checked={settings.evaluationEnabled}
        onChange={(evaluationEnabled) => onChange({ evaluationEnabled })}
      />
    </div>
  );
}

export default ValidateTab;
