/**
 * BlobbieDirector
 * Centralized high-performance animation coordinator and global pointer tracker.
 * Ensures butter-smooth 60fps animations across all living blobbie instances
 * with zero redundant event listeners and automatic offscreen pausing.
 */

import {
  BlobbieConfig,
  calculateContourPoints,
  CONTOUR_POINTS,
  easeInOutCubic,
  interpolateBlobbie,
} from './blobbieEngine';

export type BlobbieGazeFocus = 'cursor' | 'down' | 'neutral';

export interface BlobbieState {
  readonly canvas: HTMLCanvasElement;
  config: BlobbieConfig;
  fromConfig: BlobbieConfig;
  toConfig: BlobbieConfig;
  fromPoints: Float32Array;
  toPoints: Float32Array;
  currentPoints: Float32Array;
  morphProgress: number;
  phase: number;
  blinkStart: number;
  nextBlink: number;
  nextLook: number;
  gaze: [number, number];
  gazeTarget: [number, number];
  pop: number;
  blinkVal: number;
  gazeFocus: BlobbieGazeFocus;
  interactive: boolean;
  outline: boolean;
  isVisible: boolean;
  onPop?: () => void;
}

class BlobbieDirector {
  private static instance: BlobbieDirector | null = null;
  private instances = new Set<BlobbieState>();
  private isRunning = false;
  private lastTime = 0;
  private pointer = { on: 0, x: 0, y: 0, t: 0 };
  private intersectionObserver: IntersectionObserver | null = null;

  private constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener(
        'pointermove',
        (e) => {
          this.pointer = {
            on: 1,
            x: e.clientX,
            y: e.clientY,
            t: performance.now() / 1000,
          };
        },
        { passive: true }
      );

      if ('IntersectionObserver' in window) {
        this.intersectionObserver = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              const canvas = entry.target as HTMLCanvasElement;
              for (const inst of this.instances) {
                if (inst.canvas === canvas) {
                  inst.isVisible = entry.isIntersecting;
                  break;
                }
              }
            }
          },
          { threshold: 0.05 }
        );
      }
    }
  }

  public static getInstance(): BlobbieDirector {
    if (!BlobbieDirector.instance) {
      BlobbieDirector.instance = new BlobbieDirector();
    }
    return BlobbieDirector.instance;
  }

  public register(
    canvas: HTMLCanvasElement,
    initialConfig: BlobbieConfig,
    options?: {
      interactive?: boolean;
      gazeFocus?: BlobbieGazeFocus;
      outline?: boolean;
    }
  ): {
    setConfig: (newConfig: BlobbieConfig, immediate?: boolean) => void;
    setGazeFocus: (focus: BlobbieGazeFocus) => void;
    triggerPop: () => void;
    triggerBlink: () => void;
    destroy: () => void;
  } {
    const points = calculateContourPoints(initialConfig);
    const now = performance.now() / 1000;

    const state: BlobbieState = {
      canvas,
      config: initialConfig,
      fromConfig: initialConfig,
      toConfig: initialConfig,
      fromPoints: points,
      toPoints: points,
      currentPoints: new Float32Array(points),
      morphProgress: 1,
      phase: Math.random() * 6,
      blinkStart: -9,
      nextBlink: now + 1 + Math.random() * 3,
      nextLook: now + 1 + Math.random() * 3,
      gaze: [0, 0],
      gazeTarget: [0, 0],
      pop: 0,
      blinkVal: 0,
      gazeFocus: options?.gazeFocus ?? 'cursor',
      interactive: options?.interactive ?? true,
      outline: options?.outline ?? false,
      isVisible: true,
    };

    this.instances.add(state);
    if (this.intersectionObserver) {
      this.intersectionObserver.observe(canvas);
    }

    if (!this.isRunning) {
      this.startLoop();
    }

    return {
      setConfig: (newConfig: BlobbieConfig, immediate = false) => {
        if (immediate) {
          const newPts = calculateContourPoints(newConfig);
          state.fromConfig = newConfig;
          state.toConfig = newConfig;
          state.fromPoints = newPts;
          state.toPoints = newPts;
          state.currentPoints = new Float32Array(newPts);
          state.morphProgress = 1;
        } else {
          state.fromConfig = interpolateBlobbie(
            state.fromConfig,
            state.toConfig,
            state.morphProgress
          );
          state.fromPoints = new Float32Array(state.currentPoints);
          state.toConfig = newConfig;
          state.toPoints = calculateContourPoints(newConfig);
          state.morphProgress = 0;
        }
      },
      setGazeFocus: (focus: BlobbieGazeFocus) => {
        state.gazeFocus = focus;
      },
      triggerPop: () => {
        state.pop = 1;
        state.blinkStart = performance.now() / 1000;
      },
      triggerBlink: () => {
        state.blinkStart = performance.now() / 1000;
      },
      destroy: () => {
        this.instances.delete(state);
        if (this.intersectionObserver) {
          this.intersectionObserver.unobserve(canvas);
        }
        if (this.instances.size === 0) {
          this.stopLoop();
        }
      },
    };
  }

  private startLoop() {
    this.isRunning = true;
    this.lastTime = performance.now() / 1000;
    const loop = () => {
      if (!this.isRunning) return;
      const t = performance.now() / 1000;
      const dt = Math.min(0.05, t - this.lastTime);
      this.lastTime = t;

      for (const inst of this.instances) {
        if (inst.isVisible) {
          this.updateInstance(inst, t, dt);
          this.drawInstance(inst, t);
        }
      }

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  private stopLoop() {
    this.isRunning = false;
  }

  private updateInstance(inst: BlobbieState, t: number, dt: number) {
    // Advance morphing transition
    if (inst.morphProgress < 1) {
      inst.morphProgress = Math.min(1, inst.morphProgress + dt / 0.65);
    }

    // Natural blinking physics
    if (t > inst.nextBlink) {
      inst.blinkStart = t;
      inst.nextBlink = t + (Math.random() < 0.2 ? 0.45 : 2.2 + Math.random() * 3.5);
    }
    const blinkU = (t - inst.blinkStart) / 0.32;
    inst.blinkVal =
      blinkU >= 0 && blinkU < 1
        ? blinkU < 0.42
          ? blinkU / 0.42
          : 1 - (blinkU - 0.42) / 0.58
        : 0;

    // Gaze and Eye Movement
    if (inst.gazeFocus === 'down') {
      // Focus eye contact downward (e.g. user typing in composer)
      inst.gazeTarget = [0, 0.85];
    } else if (inst.gazeFocus === 'neutral') {
      inst.gazeTarget = [0, 0];
    } else if (
      inst.interactive &&
      this.pointer.on &&
      t - this.pointer.t < 4.5
    ) {
      // Follow cursor coordinates relative to canvas center
      const rect = inst.canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        let x = (this.pointer.x - rect.left - rect.width / 2) / 220;
        let y = (this.pointer.y - rect.top - rect.height / 2) / 220;
        const dist = Math.hypot(x, y);
        if (dist > 1) {
          x /= dist;
          y /= dist;
        }
        inst.gazeTarget = [x, y];
      }
    } else if (t > inst.nextLook) {
      // Idle natural glance shifts
      inst.gazeTarget =
        Math.random() < 0.35
          ? [0, 0]
          : [Math.random() * 1.8 - 0.9, (Math.random() * 1.6 - 0.8) * 0.7];
      inst.nextLook = t + 1.2 + Math.random() * 3.2;
    }

    // Exponential smoothing for gaze acceleration
    const gazeLerp = 1 - Math.exp(-dt * 10);
    inst.gaze[0] += (inst.gazeTarget[0] - inst.gaze[0]) * gazeLerp;
    inst.gaze[1] += (inst.gazeTarget[1] - inst.gaze[1]) * gazeLerp;

    // Squash & stretch decay
    inst.pop *= Math.exp(-dt * 4.5);
  }

  private drawInstance(inst: BlobbieState, t: number) {
    const ctx = inst.canvas.getContext('2d');
    if (!ctx) return;

    const width = inst.canvas.width;
    if (width === 0) return;

    const radius = width * 0.4;
    const k = easeInOutCubic(inst.morphProgress);
    const p = interpolateBlobbie(inst.fromConfig, inst.toConfig, inst.morphProgress);

    // Interpolate contour points
    const cp = inst.currentPoints;
    for (let i = 0; i < cp.length; i++) {
      cp[i] = inst.fromPoints[i] + (inst.toPoints[i] - inst.fromPoints[i]) * k;
    }

    const [gx, gy] = inst.gaze;
    // Gentle natural breathing oscillation
    const breath = 1 + 0.02 * Math.sin(t * 1.7 + inst.phase);

    ctx.clearRect(0, 0, width, width);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.save();

    // Center translation with subtle gaze lean and breathing wobble
    ctx.translate(
      width / 2 + gx * 0.04 * radius,
      width / 2 + (0.025 * Math.sin(t * 1.1 + inst.phase) + gy * 0.03) * radius
    );

    // Squash & stretch scaling
    ctx.scale(
      breath * (1 + 0.12 * inst.pop),
      breath * (1 - 0.08 * inst.pop)
    );

    // Draw smooth vector body path
    ctx.beginPath();
    const getX = (i: number) => cp[((i % CONTOUR_POINTS) + CONTOUR_POINTS) % CONTOUR_POINTS * 2] * radius;
    const getY = (i: number) => cp[((i % CONTOUR_POINTS) + CONTOUR_POINTS) % CONTOUR_POINTS * 2 + 1] * radius;

    ctx.moveTo((getX(0) + getX(1)) / 2, (getY(0) + getY(1)) / 2);
    for (let i = 1; i <= CONTOUR_POINTS; i++) {
      ctx.quadraticCurveTo(
        getX(i),
        getY(i),
        (getX(i) + getX(i + 1)) / 2,
        (getY(i) + getY(i + 1)) / 2
      );
    }
    ctx.closePath();
    ctx.fillStyle = p.color;
    ctx.fill();

    if (inst.outline) {
      ctx.lineWidth = radius * 0.04;
      ctx.strokeStyle = '#0a0a0a';
      ctx.stroke();
    }

    // Draw Eyes with gaze direction and eyelid contraction during blink
    const eyeVerticalScale = Math.max(0.08, 1 - 0.92 * inst.blinkVal) * (1 + 0.25 * inst.pop);

    // Optical sizing: prevent eyes from shrinking into unreadable hairlines at small sizes
    const cssWidth = parseFloat(inst.canvas.style.width) || width;
    const renderRatio = width / (cssWidth || 1);
    const cssRadius = cssWidth * 0.4;
    const opticalBoost = cssRadius < 28 ? Math.min(1.4, 1 + (28 - cssRadius) / 36) : 1;

    for (let i = 0; i < 2; i++) {
      const side = i ? 1 : -1;
      const perspectiveShrink = 1 - 0.14 * gx * side;
      const eyeX =
        (p.fx + gx * 0.16 + (side * p.sp) / 2 * (1 - 0.25 * Math.abs(gx))) * radius;
      const eyeY = (p.fy + gy * 0.12) * radius;
      let eyeWidth = 0.15 * p.es * perspectiveShrink * radius * opticalBoost;
      let eyeHeight = 0.42 * p.es * perspectiveShrink * radius * opticalBoost;

      // Ensure eyes never drop below 2.5 CSS pixels in physical width
      const minEyeWidth = 2.5 * renderRatio;
      if (eyeWidth < minEyeWidth) {
        const factor = minEyeWidth / eyeWidth;
        eyeWidth = minEyeWidth;
        eyeHeight *= Math.min(1.2, factor);
      }

      ctx.save();
      ctx.translate(eyeX, eyeY);
      ctx.rotate(p.tilt);
      ctx.scale(1, eyeVerticalScale);
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(-eyeWidth / 2, -eyeHeight / 2, eyeWidth, eyeHeight, eyeWidth / 2);
      } else {
        ctx.arc(0, 0, eyeWidth / 2, 0, Math.PI * 2);
      }
      ctx.fillStyle = '#0a0a0a';
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }
}

export const blobbieDirector = BlobbieDirector.getInstance();
