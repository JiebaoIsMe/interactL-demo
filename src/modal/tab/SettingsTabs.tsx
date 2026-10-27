import { useState } from "react";

import GeneralTab from "./GeneralTab";
import TrainTab from "./TrainTab";
import ValidateTab from "./ValidateTab";
import DatasetTab from "./DatasetTab";

import type { ClientSettings } from "../../mock-data/client";
import type { ServerSettings } from "../../mock-data/server";

type Tab = "general" | "dataset";

type SettingsTabsProps =
  | {
      mode: "client";
      settings: ClientSettings;
      groupId?: number;
      clientTotal: number;
      onChange: (settings: ClientSettings) => void;
    }
  | {
      mode: "server";
      settings: ServerSettings;
      clientTotal: number;
      onChange: (settings: ServerSettings) => void;
    };

export default function SettingsTabs(props: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const [advancedOpen, setAdvancedOpen] = useState(false);

  function updateClientSection<K extends keyof ClientSettings>(
    section: K,
    values: Partial<ClientSettings[K]>
  ) {
    if (props.mode !== "client") return;

    const updated: ClientSettings = {
      ...props.settings,
      [section]: {
        ...props.settings[section],
        ...values,
      },
    };

    props.onChange(updated);
  }

  function updateServerSection<K extends keyof ServerSettings>(
    section: K,
    values: Partial<ServerSettings[K]>
  ) {
    if (props.mode !== "server") return;

    const updated: ServerSettings = {
      ...props.settings,
      [section]: {
        ...props.settings[section],
        ...values,
      },
    };

    props.onChange(updated);
  }

  return (
    <>
      <nav className="node-modal-tabs" aria-label="Settings sections">
        <button
          type="button"
          className={activeTab === "general" ? "active" : ""}
          onClick={() => setActiveTab("general")}
        >
          General
        </button>

        <button
          type="button"
          className={activeTab === "dataset" ? "active" : ""}
          onClick={() => setActiveTab("dataset")}
        >
          Dataset
        </button>
      </nav>

      <div className="node-modal-content">
        {props.mode === "client" ? (
          activeTab === "general" ? (
            <div className="node-modal-sections">
              <section className="node-modal-section">
                <h3>Basic Training</h3>
                <TrainTab
                  settings={props.settings.train}
                  fields="basic"
                  onChange={(values: Partial<ClientSettings["train"]>) =>
                    updateClientSection("train", values)
                  }
                />
              </section>

              <details
                className="client-settings-advanced"
                open={advancedOpen}
                onToggle={(event) =>
                  setAdvancedOpen(event.currentTarget.open)
                }
              >
                <summary>Advanced Settings</summary>
                <div className="client-settings-advanced-content">
                  <section className="node-modal-section">
                    <h3>Model &amp; Validation Schedule</h3>
                    <GeneralTab
                      mode="client"
                      settings={props.settings.general}
                      groupId={props.groupId}
                      clientTotal={props.clientTotal}
                      onChange={(values: Partial<ClientSettings["general"]>) =>
                        updateClientSection("general", values)
                      }
                    />
                  </section>

                  <hr className="node-modal-separator" />

                  <section className="node-modal-section">
                    <h3>Training Regularization</h3>
                    <TrainTab
                      settings={props.settings.train}
                      fields="advanced"
                      onChange={(values: Partial<ClientSettings["train"]>) =>
                        updateClientSection("train", values)
                      }
                    />
                  </section>

                  <hr className="node-modal-separator" />

                  <section className="node-modal-section">
                    <h3>Validation / Test</h3>
                    <ValidateTab
                      settings={props.settings.validateTest}
                      onChange={(values: Partial<ClientSettings["validateTest"]>) =>
                        updateClientSection("validateTest", values)
                      }
                    />
                  </section>
                </div>
              </details>
            </div>
          ) : (
            <section className="node-modal-section">
              <h3>Dataset</h3>
              <DatasetTab
                settings={props.settings.dataset}
                onChange={(values: Partial<ClientSettings["dataset"]>) =>
                  updateClientSection("dataset", values)
                }
              />
            </section>
          )
        ) : activeTab === "general" ? (
          <div className="node-modal-sections">
            <section className="node-modal-section">
              <h3>General</h3>
              <GeneralTab
                mode="server"
                settings={props.settings.general}
                clientTotal={props.clientTotal}
                onChange={(values: Partial<ServerSettings["general"]>) =>
                  updateServerSection("general", values)
                }
              />
            </section>

            <hr className="node-modal-separator" />

            <section className="node-modal-section">
              <h3>Train</h3>
              <TrainTab
                settings={props.settings.train}
                onChange={(values: Partial<ServerSettings["train"]>) =>
                  updateServerSection("train", values)
                }
              />
            </section>

            <hr className="node-modal-separator" />

            <section className="node-modal-section">
              <h3>Validation / Test</h3>
              <ValidateTab
                settings={props.settings.validateTest}
                onChange={(values: Partial<ServerSettings["validateTest"]>) =>
                  updateServerSection("validateTest", values)
                }
              />
            </section>
          </div>
        ) : (
          <section className="node-modal-section">
            <h3>Dataset</h3>
            <DatasetTab
              settings={props.settings.dataset}
              onChange={(values: Partial<ServerSettings["dataset"]>) =>
                updateServerSection("dataset", values)
              }
            />
          </section>
        )}
      </div>
    </>
  );
}
