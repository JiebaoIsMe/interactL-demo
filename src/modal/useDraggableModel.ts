
import { useRef, useState } from "react";
import type { PointerEvent } from "react";

type Position = {
  x: number;
  y: number;
};

export function useDraggableModal() {
  const [position, setPosition] = useState<Position>({
    x: 0,
    y: 0,
  });

  const modalRef = useRef<HTMLDivElement>(null);

  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  } | null>(null);

  function handlePointerDown(event: PointerEvent<HTMLElement>) {
    if (event.button !== 0) return;

    const target = event.target as HTMLElement;

    // Do not drag when interacting with header controls.
    if (
      target.closest(
        "button, input, select, textarea, a"
      )
    ) {
      return;
    }

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      initialX: position.x,
      initialY: position.y,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    const drag = dragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const modal = modalRef.current;
    if (!modal) return;

    const rect = modal.getBoundingClientRect();

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;

    // Calculate the modal's position before the current drag.
    const baseLeft = rect.left - position.x;
    const baseTop = rect.top - position.y;

    const nextX = drag.initialX + deltaX;
    const nextY = drag.initialY + deltaY;

    const clampedX = Math.max(
      -baseLeft,
      Math.min(
        window.innerWidth - baseLeft - rect.width,
        nextX
      )
    );

    const clampedY = Math.max(
      -baseTop,
      Math.min(
        window.innerHeight - baseTop - rect.height,
        nextY
      )
    );

    setPosition({
      x: clampedX,
      y: clampedY,
    });
  }

  function handlePointerUp(event: PointerEvent<HTMLElement>) {
    if (dragRef.current?.pointerId !== event.pointerId) {
      return;
    }

    dragRef.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return {
    modalRef,
    position,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  };
}
