
import { Focus, Minus, Plus } from "lucide-react";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  MouseEvent as ReactMouseEvent,
  WheelEvent as ReactWheelEvent,
} from "react";

import Node from "../node/Node";

import HudButton from "../components/hud-button";
import { HudDock, HudDockProvider } from "../components/hud-dock";

import SimulationEngine, {
  createInitialState,
} from "./SimulationEngine";

import { initialObservedClients } from "../mock-data/client";

import type { SimulationState } from "../mock-data/simulationData";

import {
  defaultPartitionConfig,
  generateDatasetPartition,
} from "../mock-data/datasetPartition";

const WORKSPACE_SIZE = 3000;

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.1;

type Position = {
  x: number;
  y: number;
};

function Workspace() {
  const [datasetPartition, setDatasetPartition] = useState(() =>
    generateDatasetPartition(defaultPartitionConfig)
  );

  const [simulationState, setSimulationState] =
    useState<SimulationState>(createInitialState);

  // Shared observed-client state.
  // Used by Node and SimulationEngine.
  const [observedClientIds, setObservedClientIds] =
    useState<string[]>(
      () => initialObservedClients.map((client) => client.clientId)
    );

  const containerRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState(1);

  const [position, setPosition] = useState<Position>({
    x: 0,
    y: 0,
  });

  const [isDragging, setIsDragging] = useState(false);

  const dragStartRef = useRef<{
    mouseX: number;
    mouseY: number;
    positionX: number;
    positionY: number;
  } | null>(null);

  const clampZoom = useCallback((value: number) => {
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
  }, []);

  const clampPosition = useCallback(
    (nextPosition: Position, nextZoom: number): Position => {
      const container = containerRef.current;

      if (!container) {
        return nextPosition;
      }

      const { width, height } =
        container.getBoundingClientRect();

      const scaledWidth = WORKSPACE_SIZE * nextZoom;
      const scaledHeight = WORKSPACE_SIZE * nextZoom;

      const minX = Math.min(0, width - scaledWidth);
      const minY = Math.min(0, height - scaledHeight);

      const maxX = Math.max(
        0,
        (width - scaledWidth) / 2
      );

      const maxY = Math.max(
        0,
        (height - scaledHeight) / 2
      );

      return {
        x: Math.min(maxX, Math.max(minX, nextPosition.x)),
        y: Math.min(maxY, Math.max(minY, nextPosition.y)),
      };
    },
    []
  );

  const recenterWorkspace = useCallback(() => {
    const container = containerRef.current;

    if (!container) return;

    const { width, height } =
      container.getBoundingClientRect();

    setZoom(1);

    setPosition({
      x: (width - WORKSPACE_SIZE) / 2,
      y: (height - WORKSPACE_SIZE) / 2,
    });
  }, []);

  // Center the workspace on mount.
  useEffect(() => {
    recenterWorkspace();
  }, [recenterWorkspace]);

  // Keep the workspace within bounds when the container resizes.
  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    const observer = new ResizeObserver(() => {
      setPosition((previous) =>
        clampPosition(previous, zoom)
      );
    });

    observer.observe(container);

    return () => observer.disconnect();
  }, [zoom, clampPosition]);

  const zoomAtPoint = useCallback(
    (
      nextZoom: number,
      clientX: number,
      clientY: number
    ) => {
      const container = containerRef.current;

      if (!container) return;

      const rect = container.getBoundingClientRect();

      const newZoom = clampZoom(nextZoom);

      // Mouse position relative to the container.
      const mouseX = clientX - rect.left;
      const mouseY = clientY - rect.top;

      // Canvas coordinate currently under the mouse.
      const canvasX = (mouseX - position.x) / zoom;
      const canvasY = (mouseY - position.y) / zoom;

      // Preserve the same canvas point under the cursor.
      const nextPosition = {
        x: mouseX - canvasX * newZoom,
        y: mouseY - canvasY * newZoom,
      };

      setZoom(newZoom);

      setPosition(
        clampPosition(nextPosition, newZoom)
      );
    },
    [zoom, position, clampZoom, clampPosition]
  );

  const zoomAtCenter = useCallback(
    (direction: 1 | -1) => {
      const container = containerRef.current;

      if (!container) return;

      const rect = container.getBoundingClientRect();

      zoomAtPoint(
        zoom + direction * ZOOM_STEP,
        rect.left + rect.width / 2,
        rect.top + rect.height / 2
      );
    },
    [zoom, zoomAtPoint]
  );

  const handleWheel = (
    event: ReactWheelEvent<HTMLDivElement>
  ) => {
    // Ctrl + scroll to zoom.
    if (!event.ctrlKey) return;

    event.preventDefault();
    event.stopPropagation();

    const direction = event.deltaY < 0 ? 1 : -1;

    zoomAtPoint(
      zoom + direction * ZOOM_STEP,
      event.clientX,
      event.clientY
    );
  };

  const handleMouseDown = (
    event: ReactMouseEvent<HTMLDivElement>
  ) => {
    // Only drag with the left mouse button.
    if (event.button !== 0) return;

    // Ignore buttons, inputs, and interactive elements.
    if (
      (event.target as HTMLElement).closest(
        "button, input, select, textarea, .client-node, .server-node"
      )
    ) {
      return;
    }

    event.preventDefault();

    dragStartRef.current = {
      mouseX: event.clientX,
      mouseY: event.clientY,
      positionX: position.x,
      positionY: position.y,
    };

    setIsDragging(true);
  };

  // Workspace drag.
  useEffect(() => {
    const workspace = workspaceRef.current;

    if (!workspace || !isDragging) return;

    const handleMouseMove = (event: MouseEvent) => {
      const start = dragStartRef.current;

      if (!start) return;

      const deltaX = event.clientX - start.mouseX;
      const deltaY = event.clientY - start.mouseY;

      setPosition(
        clampPosition(
          {
            x: start.positionX + deltaX,
            y: start.positionY + deltaY,
          },
          zoom
        )
      );
    };

    const handleMouseUp = () => {
      dragStartRef.current = null;
      setIsDragging(false);
    };

    workspace.addEventListener(
      "mousemove",
      handleMouseMove
    );

    workspace.addEventListener(
      "mouseup",
      handleMouseUp
    );

    return () => {
      workspace.removeEventListener(
        "mousemove",
        handleMouseMove
      );

      workspace.removeEventListener(
        "mouseup",
        handleMouseUp
      );
    };
  }, [isDragging, zoom, clampPosition]);

  return (
    <div className="mainlayout">
      <div
        ref={containerRef}
        className="container"
        onWheel={handleWheel}
      >
        {/* Workspace HUD controls */}
        <div className="hud-zoom hud-glass">
          <HudButton
            icon={Plus}
            aria-label="Zoom in"
            onClick={() => zoomAtCenter(1)}
          />

          <HudButton
            icon={Minus}
            aria-label="Zoom out"
            onClick={() => zoomAtCenter(-1)}
          />

          <HudButton
            icon={Focus}
            label="Recenter"
            onClick={recenterWorkspace}
          />

          <span className="hud-zoom-level hud-num">
            {Math.round(zoom * 100)}%
          </span>
        </div>

        <HudDock />

        {/* Zoomable and draggable workspace */}
        <div
          ref={workspaceRef}
          className={`workspace ${
            isDragging ? "dragging" : ""
          }`}
          style={{
            width: WORKSPACE_SIZE,
            height: WORKSPACE_SIZE,
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
            transformOrigin: "top left",
          }}
          onMouseDown={handleMouseDown}
        >
          <Node
            simulationState={simulationState}
            datasetPartition={datasetPartition}
            observedClientIds={observedClientIds}
            setObservedClientIds={setObservedClientIds}
          />
        </div>

        {/* Simulation Control Panel */}
        <SimulationEngine
          simulationState={simulationState}
          setSimulationState={setSimulationState}
          datasetPartition={datasetPartition}
          setDatasetPartition={setDatasetPartition}
          observedClientIds={observedClientIds}
        />
      </div>
    </div>
  );
}

export default function WorkspaceWithDock() {
  return (
    <HudDockProvider>
      <Workspace />
    </HudDockProvider>
  );
}
