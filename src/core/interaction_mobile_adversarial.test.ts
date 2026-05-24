import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InputManager } from './InputManager';

describe('Mobile Interaction Adversarial Tests', () => {
  let canvas: HTMLCanvasElement;
  let inputManager: InputManager;

  const mockConfig = {
    findNode: vi.fn(),
    onDragStart: vi.fn(),
    onDragMove: vi.fn(),
    onDragEnd: vi.fn(),
    logEvent: vi.fn(),
  };

  beforeEach(() => {
    document.body.innerHTML = '<canvas id="gameCanvas"></canvas>';
    canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    inputManager = new InputManager('gameCanvas', mockConfig);
  });

  const simulateDevice = (width: number, height: number, left: number, top: number) => {
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
      width,
      height,
      left,
      top,
      right: left + width,
      bottom: top + height,
      x: left,
      y: top,
    } as DOMRect);
  };

  it('should correctly map coordinates on a standard mobile screen (375x667)', () => {
    // Canvas is scaled to fit width (375px)
    // CSS: width: 100%, aspect-ratio: 1/1 -> rect: 375x375
    simulateDevice(375, 375, 0, 100);

    // Simulate touch at center of canvas
    // clientX = rect.left + 375/2 = 187.5
    // clientY = rect.top + 375/2 = 100 + 187.5 = 287.5
    const event = new PointerEvent('pointerdown', {
      clientX: 187.5,
      clientY: 287.5,
    });

    // We need to trigger the handler manually since we are in JSDOM
    (inputManager as any).handlePointerDown(event);

    const state = inputManager.getState();
    expect(state.mouseX).toBeCloseTo(300, 1);
    expect(state.mouseY).toBeCloseTo(300, 1);
  });

  it('should correctly map coordinates on a large tablet (1024x768)', () => {
    // Canvas is 600px (max-width) centered in 1024px
    // rect: 600x600, left: (1024-600)/2 = 212
    simulateDevice(600, 600, 212, 50);

    const event = new PointerEvent('pointerdown', {
      clientX: 212 + 150, // 1/4 of the way in
      clientY: 50 + 150,  // 1/4 of the way down
    });

    (inputManager as any).handlePointerDown(event);

    const state = inputManager.getState();
    expect(state.mouseX).toBeCloseTo(150, 1);
    expect(state.mouseY).toBeCloseTo(150, 1);
  });

  it('should handle extreme zoom or scale factors correctly', () => {
    // Very small canvas (e.g. extremely zoomed out or small window)
    simulateDevice(100, 100, 10, 10);

    const event = new PointerEvent('pointerdown', {
      clientX: 10 + 25,
      clientY: 10 + 75,
    });

    (inputManager as any).handlePointerDown(event);

    const state = inputManager.getState();
    expect(state.mouseX).toBeCloseTo(150, 1);
    expect(state.mouseY).toBeCloseTo(450, 1);
  });

  it('should prevent crash when canvas has 0 width/height', () => {
    simulateDevice(0, 0, 0, 0);

    const event = new PointerEvent('pointerdown', {
      clientX: 100,
      clientY: 100,
    });

    expect(() => (inputManager as any).handlePointerDown(event)).not.toThrow();
  });
});
