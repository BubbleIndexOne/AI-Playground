/**
 * BlobbieAvatar Component
 * Living, interactive procedural vector avatar rendered on HTML5 canvas.
 */

import { useEffect, useMemo, useRef } from 'react';
import { BlobbieConfig, fromSeed } from './blobbieEngine';
import { blobbieDirector, BlobbieGazeFocus } from './BlobbieDirector';

export type BlobbieSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'hero';

const SIZE_MAP: Record<BlobbieSize, number> = {
  xs: 22,
  sm: 28,
  md: 38,
  lg: 52,
  xl: 80,
  '2xl': 140,
  hero: 180,
};

interface BlobbieAvatarProps {
  readonly config?: BlobbieConfig | string | null;
  readonly size?: BlobbieSize | number;
  readonly interactive?: boolean;
  readonly gazeFocus?: BlobbieGazeFocus;
  readonly outline?: boolean;
  readonly className?: string;
  readonly onClick?: () => void;
  readonly title?: string;
}

export function BlobbieAvatar({
  config,
  size = 'md',
  interactive = true,
  gazeFocus = 'cursor',
  outline = false,
  className = '',
  onClick,
  title,
}: BlobbieAvatarProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const controllerRef = useRef<ReturnType<typeof blobbieDirector.register> | null>(
    null
  );

  const pixelSize = typeof size === 'number' ? size : SIZE_MAP[size] ?? 38;

  const resolvedConfig = useMemo<BlobbieConfig>(() => {
    if (!config) {
      return fromSeed('default-agent');
    }
    if (typeof config === 'string') {
      return fromSeed(config);
    }
    return config;
  }, [config]);

  // Handle initialization and registration with the Director
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    canvas.width = pixelSize * dpr;
    canvas.height = pixelSize * dpr;
    canvas.style.width = `${pixelSize}px`;
    canvas.style.height = `${pixelSize}px`;

    const controller = blobbieDirector.register(canvas, resolvedConfig, {
      interactive,
      gazeFocus,
      outline,
    });
    controllerRef.current = controller;

    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, [pixelSize, interactive, outline]);

  // Update configuration when resolvedConfig changes
  useEffect(() => {
    if (controllerRef.current) {
      controllerRef.current.setConfig(resolvedConfig);
    }
  }, [resolvedConfig]);

  // Update gaze focus (e.g. looking down at composer when typing)
  useEffect(() => {
    if (controllerRef.current) {
      controllerRef.current.setGazeFocus(gazeFocus);
    }
  }, [gazeFocus]);

  const handleClick = () => {
    if (controllerRef.current) {
      controllerRef.current.triggerPop();
    }
    onClick?.();
  };

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={title || 'Living Blobbie Avatar'}
      title={title}
      onClick={handleClick}
      className={`select-none shrink-0 cursor-pointer transition-transform hover:scale-105 active:scale-95 ${className}`}
      style={{
        width: `${pixelSize}px`,
        height: `${pixelSize}px`,
      }}
    />
  );
}
