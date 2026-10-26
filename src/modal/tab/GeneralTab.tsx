
import {
  clientSettingsOptions,
  type ClientSettings,
} from "../../mock-data/client";

import {
  serverSettingsOptions,
  type ServerSettings,
} from "../../mock-data/server";

import ModalDropdown from "../../components/modal-dropdown";
import ModalInput from "../../components/modal-input";

type ServerGeneral = ServerSettings["general"];
type ClientGeneral = ClientSettings["general"];

type GeneralTabProps =
  | {
      mode: "client";
      settings: ClientGeneral;
      groupId?: number;
      clientTotal: number;
      onChange: (values: Partial<ClientGeneral>) => void;
    }
  | {
      mode: "server";
      settings: ServerGeneral;
      clientTotal: number;
      onChange: (values: Partial<ServerGeneral>) => void;
    }

export default function GeneralTab(props: GeneralTabProps) {
  const { settings, clientTotal } = props;
  return (
    <div className="node-modal-fields">
      {props.mode === "client" && props.groupId !== undefined && (
        <ModalInput
            label="Client Group"
            value={`Group ${props.groupId}`}
            readOnly
            disabled
          />
      )}

      <ModalInput
        label="Total Clients"
        type="number"
        value={clientTotal}
        readOnly
        disabled
      />

      <ModalDropdown
        label="Loss Function"
        value={settings.lossFunction}
        options={clientSettingsOptions.lossFunctions}
        onChange={(lossFunction) => props.onChange({ lossFunction })}
      />

      <ModalDropdown
        label="Model Architecture"
        value={settings.modelArchitecture}
        options={clientSettingsOptions.modelArchitectures}
        onChange={(modelArchitecture) =>
          props.onChange({ modelArchitecture })
        }
      />

      <ModalDropdown
        label="ML Task"
        value={settings.mlTask}
        options={clientSettingsOptions.mlTasks}
        onChange={(mlTask) => props.onChange({ mlTask })}
      />

      <ModalDropdown
        label="Validation Method"
        value={settings.validationMethod}
        options={clientSettingsOptions.validationMethods}
        onChange={(validationMethod) =>
          props.onChange({ validationMethod })
        }
      />

      <ModalInput
        label="Validation Round"
        type="number"
        min={1}
        value={settings.validationRound}
        onChange={(e) =>
          props.onChange({ validationRound: Number(e.target.value) })
        }
      />

      {props.mode=="server" && (
        <>
          <ModalInput
            label="Global Rounds"
            type="number"
            min={serverSettingsOptions.roundsMin}
            value={props.settings.rounds}
            onChange={(e) =>
              props.onChange({ rounds: Number(e.target.value) })
            }
          />

          <ModalInput
            label="Global Rounds"
            type="number"
            min={serverSettingsOptions.roundsMin}
            value={props.settings.rounds}
            onChange={(e) =>
              props.onChange({ rounds: Number(e.target.value) })
            }
          />

          <ModalDropdown
            label="Aggregation Function"
            value={props.settings.aggregationFunction}
            options={serverSettingsOptions.aggregationFunctions}
            onChange={(aggregationFunction) =>
              props.onChange({ aggregationFunction })
            }
          />
        </>
      )}
    </div>
  );
}
