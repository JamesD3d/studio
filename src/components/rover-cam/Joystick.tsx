"use client";
// -- src/components/rover-cam/Joystick.tsx
import type { FC, TouchEvent, MouseEvent } from 'react';
import React, { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface JoystickProps {
  size?: number;
  stickSize?: number;
  baseColor?: string;
  stickColor?: string;
  onMove: (dx: number, dy: number) => void;
  onStop: () => void;
  disabled?: boolean;
}

const Joystick: FC<JoystickProps> = ({
  size = 100,
  stickSize = 50,
  baseColor = "bg-muted/50",
  stickColor = "bg-primary",
  onMove,
  onStop,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const baseRef = useRef<HTMLDivElement>(null);

  const maxRadius = (size - stickSize) / 2;
  const stickCenter = stickSize / 2;
  const baseCenter = size / 2;

  const handleInteractionStart = (clientX: number, clientY: number) => {
    if (disabled || !baseRef.current) return;
    setIsDragging(true);
    updatePosition(clientX, clientY);
  };

  const handleInteractionMove = (clientX: number, clientY: number) => {
    if (!isDragging || disabled || !baseRef.current) return;
    updatePosition(clientX, clientY);
  };

  const handleInteractionEnd = () => {
    if (!isDragging || disabled) return;
    setIsDragging(false);
    setPosition({ x: 0, y: 0 }); // Reset stick to center
    onStop();
  };

  const updatePosition = (clientX: number, clientY: number) => {
    if (!baseRef.current) return;
    const rect = baseRef.current.getBoundingClientRect();
    
    // Calculate position relative to the center of the joystick base
    let x = clientX - rect.left - baseCenter;
    let y = clientY - rect.top - baseCenter;

    const distance = Math.sqrt(x * x + y * y);

    if (distance > maxRadius) {
      const angle = Math.atan2(y, x);
      x = maxRadius * Math.cos(angle);
      y = maxRadius * Math.sin(angle);
    }
    
    setPosition({ x, y });

    // Calculate normalized values (-1 to 1)
    const dx = x / maxRadius;
    const dy = y / maxRadius;
    onMove(dx, dy);
  };

  // Touch events
  const onTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    e.preventDefault(); // Prevent scrolling
    handleInteractionStart(e.touches[0].clientX, e.touches[0].clientY);
  };
  const onTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleInteractionMove(e.touches[0].clientX, e.touches[0].clientY);
  };
  const onTouchEnd = () => {
    handleInteractionEnd();
  };

  // Mouse events
  const onMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    handleInteractionStart(e.clientX, e.clientY);
    
    const onGlobalMouseMove = (ev: globalThis.MouseEvent) => handleInteractionMove(ev.clientX, ev.clientY);
    const onGlobalMouseUp = () => {
      handleInteractionEnd();
      window.removeEventListener('mousemove', onGlobalMouseMove);
      window.removeEventListener('mouseup', onGlobalMouseUp);
    };

    window.addEventListener('mousemove', onGlobalMouseMove);
    window.addEventListener('mouseup', onGlobalMouseUp);
  };

  const stickStyle = {
    width: `${stickSize}px`,
    height: `${stickSize}px`,
    transform: `translate(${position.x}px, ${position.y}px)`,
    left: `${baseCenter - stickCenter}px`, // Center the stick initially
    top: `${baseCenter - stickCenter}px`,  // Center the stick initially
  };

  return (
    <div
      ref={baseRef}
      className={cn(
        "relative rounded-full cursor-pointer select-none touch-none flex items-center justify-center",
        baseColor,
        disabled && "opacity-50 cursor-not-allowed"
      )}
      style={{ width: `${size}px`, height: `${size}px` }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
    >
      <div
        className={cn(
          "absolute rounded-full shadow-md transition-transform duration-75 ease-linear",
          stickColor
        )}
        style={stickStyle}
      />
    </div>
  );
};

export default Joystick;
