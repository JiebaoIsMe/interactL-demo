
import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

import HudButton from "./hud-button";

import "../styles/hud.css";

type DockContextValue = {
  panel: HTMLElement | null;
  setPanel: Dispatch<SetStateAction<HTMLElement | null>>;
};

const HudDockContext = createContext<DockContextValue | null>(null);

function useHudDock() {
  const context = useContext(HudDockContext);

  if (!context) {
    throw new Error(
      "HudDock must be rendered inside HudDockProvider."
    );
  }

  return context;
}

export function HudDockProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [panel, setPanel] = useState<HTMLElement | null>(null);

  return (
    <HudDockContext.Provider value={{ panel, setPanel }}>
      {children}
    </HudDockContext.Provider>
  );
}

export function HudDock() {
  const { setPanel } = useHudDock();

  const [open, setOpen] = useState(() =>
    typeof window === "undefined"
      ? true
      : !window.matchMedia("(max-width: 600px)").matches
  );

  return (
    <aside
      className={`hud-dock ${open ? "" : "collapsed"}`}
      aria-label="Simulator controls"
    >
      <HudButton
        className="hud-dock-tab"
        icon={open ? ChevronRight : ChevronLeft}
        aria-label={open ? "Collapse dock" : "Expand dock"}
        aria-expanded={open}
        onClick={() => setOpen((previous) => !previous)}
      />

      <nav
        ref={setPanel}
        className="hud-dock-panel hud-glass"
        aria-label="Simulator tools"
        inert={!open}
      />
    </aside>
  );
}

export function HudDockItems({
  children,
}: {
  children: ReactNode;
}) {
  const { panel } = useHudDock();

  return panel ? createPortal(children, panel) : null;
}
