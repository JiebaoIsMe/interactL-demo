
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

type Transform = {
  position: Position;
  zoom: number;
};

type DragStart = {
  pointerId: number;
  clientX: number;
  clientY: number;
  positionX: number;
  positionY: number;
};

type PinchStart = {
  distance: number;
  zoom: number;
  canvasX: number;
  canvasY: number;
};

function getDistance(a: Position, b: Position): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function getMidpoint(a: Position, b: Position): Position {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}

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

  // Keep the latest transform available to pointer handlers.
  const transformRef = useRef<Transform>({
    position: { x: 0, y: 0 },
    zoom: 1,
  });

  const activePointersRef = useRef<Map<number, Position>>(
    new Map()
  );

  const dragStartRef = useRef<DragStart | null>(null);
  const pinchStartRef = useRef<PinchStart | null>(null);

  const clampZoom = useCallback((value: number): number => {
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
  }, []);

  const clampPosition = useCallback(
    (
      nextPosition: Position,
      nextZoom: number
    ): Position => {
      const container = containerRef.current;

      if (!container) {
        return nextPosition;
      }

      const { width, height } =
        container.getBoundingClientRect();

      const scaledWidth = WORKSPACE_SIZE * nextZoom;
      const scaledHeight = WORKSPACE_SIZE * nextZoom;

      const clampAxis = (
        value: number,
        viewportSize: number,
        contentSize: number
      ): number => {
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

  const updateTransform = useCallback(
    (nextPosition: Position, nextZoom: number) => {
      const safeZoom = clampZoom(nextZoom);
      const safePosition = clampPosition(
        nextPosition,
        safeZoom
      );

      transformRef.current = {
        position: safePosition,
        zoom: safeZoom,
      };

      setPosition(safePosition);
      setZoom(safeZoom);
    },
    [clampZoom, clampPosition]
  );

  const recenterWorkspace = useCallback(() => {
    const container = containerRef.current;

    if (!container) return;

    const { width, height } =
      container.getBoundingClientRect();

    updateTransform(
      {
        x: (width - WORKSPACE_SIZE) / 2,
        y: (height - WORKSPACE_SIZE) / 2,
      },
      1
    );
  }, [updateTransform]);

  // Center the workspace on mount.
  useEffect(() => {
    recenterWorkspace();
  }, [recenterWorkspace]);

  // Keep workspace inside the viewport after resizing.
  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    const observer = new ResizeObserver(() => {
      const current = transformRef.current;

      updateTransform(
        current.position,
        current.zoom
      );
    });

    observer.observe(container);

    return () => observer.disconnect();
  }, [updateTransform]);

  // Preserve the existing zoom-at-cursor behavior.
  const zoomAtPoint = useCallback(
    (
      nextZoom: number,
      clientX: number,
      clientY: number
    ) => {
      const container = containerRef.current;

      if (!container) return;

      const rect = container.getBoundingClientRect();

      const {
        position: currentPosition,
        zoom: currentZoom,
      } = transformRef.current;

      const newZoom = clampZoom(nextZoom);

      const mouseX = clientX - rect.left;
      const mouseY = clientY - rect.top;

      const canvasX =
        (mouseX - currentPosition.x) / currentZoom;

      const canvasY =
        (mouseY - currentPosition.y) / currentZoom;

      updateTransform(
        {
          x: mouseX - canvasX * newZoom,
          y: mouseY - canvasY * newZoom,
        },
        newZoom
      );
    },
    [clampZoom, updateTransform]
  );

  const zoomAtCenter = useCallback(
    (direction: 1 | -1) => {
      const container = containerRef.current;

      if (!container) return;

      const rect = container.getBoundingClientRect();

      zoomAtPoint(
        transformRef.current.zoom +
          direction * ZOOM_STEP,
        rect.left + rect.width / 2,
        rect.top + rect.height / 2
      );
    },
    [zoomAtPoint]
  );

  const handleWheel = (
    event: ReactWheelEvent<HTMLDivElement>
  ) => {
    // Preserve Ctrl + scroll zoom on desktop.
    if (!event.ctrlKey) return;

    event.preventDefault();
    event.stopPropagation();

    const direction = event.deltaY < 0 ? 1 : -1;

    zoomAtPoint(
      transformRef.current.zoom +
        direction * ZOOM_STEP,
      event.clientX,
      event.clientY
    );
  };

  const startDrag = (
    pointerId: number,
    clientX: number,
    clientY: number
  ) => {
    const currentPosition =
      transformRef.current.position;

    dragStartRef.current = {
      pointerId,
      clientX,
      clientY,
      positionX: currentPosition.x,
      positionY: currentPosition.y,
    };

    pinchStartRef.current = null;
    setIsDragging(true);
  };

  const startPinch = () => {
    const pointers = Array.from(
      activePointersRef.current.values()
    );

    if (pointers.length !== 2) return;

    const container = containerRef.current;

    if (!container) return;

    const [first, second] = pointers;

    const midpoint = getMidpoint(
      first,
      second
    );

    const rect = container.getBoundingClientRect();

    const {
      position: currentPosition,
      zoom: currentZoom,
    } = transformRef.current;

    const localX = midpoint.x - rect.left;
    const localY = midpoint.y - rect.top;

    pinchStartRef.current = {
      distance: Math.max(
        1,
        getDistance(first, second)
      ),
      zoom: currentZoom,
      canvasX:
        (localX - currentPosition.x) / currentZoom,
      canvasY:
        (localY - currentPosition.y) / currentZoom,
    };

    dragStartRef.current = null;
    setIsDragging(false);
  };

  const handlePointerDown = (
    event: ReactPointerEvent<HTMLDivElement>
  ) => {
    // Desktop dragging uses left mouse button only.
    if (
      event.pointerType === "mouse" &&
      event.button !== 0
    ) {
      return;
    }

    // Do not mix mouse and touch gestures.
    if (
      activePointersRef.current.size > 0 &&
      event.pointerType === "mouse"
    ) {
      return;
    }

    const target = event.target as HTMLElement;

    // Keep buttons, nodes and modal controls interactive.
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

    if (activePointersRef.current.size >= 2) {
      return;
    }

    event.preventDefault();

    activePointersRef.current.set(
      event.pointerId,
      {
        x: event.clientX,
        y: event.clientY,
      }
    );

    event.currentTarget.setPointerCapture(
      event.pointerId
    );

    if (activePointersRef.current.size === 2) {
      startPinch();
      return;
    }

    startDrag(
      event.pointerId,
      event.clientX,
      event.clientY
    );
  };

  const handlePointerMove = (
    event: ReactPointerEvent<HTMLDivElement>
  ) => {
    const pointers = activePointersRef.current;

    if (!pointers.has(event.pointerId)) {
      return;
    }

    pointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    // Two-finger pinch and simultaneous pan.
    if (
      pointers.size === 2 &&
      pinchStartRef.current
    ) {
      const [first, second] = Array.from(
        pointers.values()
      );

      const pinch = pinchStartRef.current;
      const container = containerRef.current;

      if (!container) return;

      const rect = container.getBoundingClientRect();

      const midpoint = getMidpoint(
        first,
        second
      );

      const distance = Math.max(
        1,
        getDistance(first, second)
      );

      const nextZoom = clampZoom(
        pinch.zoom *
          (distance / pinch.distance)
      );

      const nextPosition = {
        x:
          midpoint.x -
          rect.left -
          pinch.canvasX * nextZoom,
        y:
          midpoint.y -
          rect.top -
          pinch.canvasY * nextZoom,
      };

      updateTransform(
        nextPosition,
        nextZoom
      );

      return;
    }

    // Single-pointer drag (desktop or mobile).
    if (
      pointers.size === 1 &&
      dragStartRef.current?.pointerId ===
        event.pointerId
    ) {
      const start = dragStartRef.current;

      const deltaX =
        event.clientX - start.clientX;

      const deltaY =
        event.clientY - start.clientY;

      updateTransform(
        {
          x: start.positionX + deltaX,
          y: start.positionY + deltaY,
        },
        transformRef.current.zoom
      );
    }
  };

  const finishPointer = (
    event: ReactPointerEvent<HTMLDivElement>
  ) => {
    const pointers = activePointersRef.current;

    if (!pointers.has(event.pointerId)) {
      return;
    }

    pointers.delete(event.pointerId);

    dragStartRef.current = null;
    pinchStartRef.current = null;

    if (
      event.currentTarget.hasPointerCapture(
        event.pointerId
      )
    ) {
      event.currentTarget.releasePointerCapture(
        event.pointerId
      );
    }

    // When one finger remains after a pinch,
    // continue smoothly as a single-finger drag.
    if (pointers.size === 1) {
      const [pointerId, pointer] =
        Array.from(pointers.entries())[0];

      startDrag(
        pointerId,
        pointer.x,
        pointer.y
      );
    } else {
      setIsDragging(false);
    }
  };

  const handleLostPointerCapture = (
    event: ReactPointerEvent<HTMLDivElement>
  ) => {
    const pointers = activePointersRef.current;

    if (!pointers.has(event.pointerId)) {
      return;
    }

    pointers.delete(event.pointerId);

    dragStartRef.current = null;
    pinchStartRef.current = null;

    if (pointers.size === 1) {
      const [pointerId, pointer] =
        Array.from(pointers.entries())[0];

      startDrag(
        pointerId,
        pointer.x,
        pointer.y
      );
    } else {
      setIsDragging(false);
    }
  };

  return (
    <div className="mainlayout">
      <div
        ref={containerRef}
        className="container"
        onWheel={handleWheel}
        style={{
          touchAction: "none",
          overscrollBehavior: "contain",
        }}
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
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishPointer}
          onPointerCancel={finishPointer}
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
