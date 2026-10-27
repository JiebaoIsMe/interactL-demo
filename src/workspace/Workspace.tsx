
import { Focus, Minus, Plus } from "lucide-react";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  PointerEvent as ReactPointerEvent,
  WheelEvent as ReactWheelEvent,
} from "react";

import Node from "../node/Node";

import HudButton from "../components/hud-button";
import {
  HudDock,
  HudDockProvider,
} from "../components/hud-dock";

import SimulationEngine, {
  createInitialState,
} from "./SimulationEngine";

import { initialObservedClients } from "../mock-data/client";

import type {
  SimulationState,
} from "../mock-data/simulationData";

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

type DragStart = {
  pointerId: number;
  clientX: number;
  clientY: number;
  positionX: number;
  positionY: number;
};

function Workspace() {
  const [datasetPartition, setDatasetPartition] = useState(
    () => generateDatasetPartition(defaultPartitionConfig)
  );

  const [simulationState, setSimulationState] =
    useState<SimulationState>(createInitialState);

  const [observedClientIds, setObservedClientIds] =
    useState<string[]>(
      () =>
        initialObservedClients.map(
          (client) => client.clientId
        )
    );

  const containerRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState(1);

  const [position, setPosition] = useState<Position>({
    x: 0,
    y: 0,
  });

  const [isDragging, setIsDragging] = useState(false);

  const dragStartRef = useRef<DragStart | null>(null);

  const clampZoom = useCallback((value: number) => {
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
  }, []);

  const clampPosition = useCallback(
    (
      nextPosition: Position,
      nextZoom: number
    ): Position => {
      const container = containerRef.current;

      if (!container) return nextPosition;

      const { width, height } =
        container.getBoundingClientRect();

      const scaledWidth = WORKSPACE_SIZE * nextZoom;
      const scaledHeight = WORKSPACE_SIZE * nextZoom;

      const clampAxis = (
        value: number,
        viewportSize: number,
        contentSize: number
      ) => {
        if (contentSize <= viewportSize) {
          return (viewportSize - contentSize) / 2;
        }

        return Math.max(
          viewportSize - contentSize,
          Math.min(0, value)
        );
      };

      return {
        x: clampAxis(
          nextPosition.x,
          width,
          scaledWidth
        ),
        y: clampAxis(
          nextPosition.y,
          height,
          scaledHeight
        ),
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

  // Center workspace on mount.
  useEffect(() => {
    recenterWorkspace();
  }, [recenterWorkspace]);

  // Keep position valid when the viewport changes.
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

      const mouseX = clientX - rect.left;
      const mouseY = clientY - rect.top;

      const canvasX = (mouseX - position.x) / zoom;
      const canvasY = (mouseY - position.y) / zoom;

      const nextPosition = {
        x: mouseX - canvasX * newZoom,
        y: mouseY - canvasY * newZoom,
      };

      setZoom(newZoom);
      setPosition(
        clampPosition(nextPosition, newZoom)
      );
    },
    [
      zoom,
      position,
      clampZoom,
      clampPosition,
    ]
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
    if (!event.ctrlKey) return;

    event.preventDefault();
    event.stopPropagation();

    const direction =
      event.deltaY < 0 ? 1 : -1;

    zoomAtPoint(
      zoom + direction * ZOOM_STEP,
      event.clientX,
      event.clientY
    );
  };

  // Desktop left-click and mobile single-finger drag.
  const handlePointerDown = (
    event: ReactPointerEvent<HTMLDivElement>
  ) => {
    if (
      event.pointerType === "mouse" &&
      event.button !== 0
    ) {
      return;
    }

    if (!event.isPrimary) return;
    if (dragStartRef.current !== null) return;

    const target = event.target as HTMLElement;

    // Preserve node and control interactions.
    if (
      target.closest(
        [
          "button",
          "input",
          "select",
          "textarea",
          "a",
          "[role='button']",
          "[contenteditable='true']",
          ".client-node",
          ".server-node",
          ".observed-clients-node",
          ".modal",
          ".hud-actions",
          ".hud-dock",
          ".hud-zoom",
          ".simulation-control-stack",
        ].join(",")
      )
    ) {
      return;
    }

    event.preventDefault();

    dragStartRef.current = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      positionX: position.x,
      positionY: position.y,
    };

    event.currentTarget.setPointerCapture(
      event.pointerId
    );

    setIsDragging(true);
  };

  const handlePointerMove = (
    event: ReactPointerEvent<HTMLDivElement>
  ) => {
    const start = dragStartRef.current;

    if (
      !start ||
      start.pointerId !== event.pointerId
    ) {
      return;
    }

    const deltaX =
      event.clientX - start.clientX;

    const deltaY =
      event.clientY - start.clientY;

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

  const finishDragging = (
    event: ReactPointerEvent<HTMLDivElement>
  ) => {
    const start = dragStartRef.current;

    if (
      !start ||
      start.pointerId !== event.pointerId
    ) {
      return;
    }

    dragStartRef.current = null;
    setIsDragging(false);

    if (
      event.currentTarget.hasPointerCapture(
        event.pointerId
      )
    ) {
      event.currentTarget.releasePointerCapture(
        event.pointerId
      );
    }
  };

  const handleLostPointerCapture = (
    event: ReactPointerEvent<HTMLDivElement>
  ) => {
    if (
      dragStartRef.current?.pointerId !==
      event.pointerId
    ) {
      return;
    }

    dragStartRef.current = null;
    setIsDragging(false);
  };

  return (
    <div className="mainlayout">
      <div
        ref={containerRef}
        className="container"
        onWheel={handleWheel}
      >
        {/* Workspace zoom controls */}
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

        {/* Desktop and mobile draggable workspace */}
        <div
          className={`workspace ${
            isDragging ? "dragging" : ""
          }`}
          style={{
            width: WORKSPACE_SIZE,
            height: WORKSPACE_SIZE,
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
            transformOrigin: "top left",
            touchAction: "none",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishDragging}
          onPointerCancel={finishDragging}
          onLostPointerCapture={
            handleLostPointerCapture
          }
        >
          <Node
            simulationState={simulationState}
            datasetPartition={datasetPartition}
            observedClientIds={observedClientIds}
            setObservedClientIds={
              setObservedClientIds
            }
          />
        </div>

        {/* Simulation control panel */}
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
