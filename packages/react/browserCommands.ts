/// <reference types="@vitest/browser/providers/playwright" />

import { BrowserCommand } from 'vitest/node';

export type OptionsPointer = {
  /**
   * Defaults to `left`.
   */
  button?: 'left' | 'right' | 'middle';

  /**
   * defaults to 1. See [UIEvent.detail].
   */
  clickCount?: number;
};

export type MousePosition = {
  x: number;
  y: number;
};

export type OptionsMove = {
  /**
   * Defaults to 1. Sends intermediate `mousemove` events.
   */
  steps?: number;
};

const error = (e: string) => {
  throw new Error(e);
};

export const mouseDown: BrowserCommand<[OptionsPointer]> = async (
  ctx,
  opts?: OptionsPointer,
) => {
  ctx.page.mouse.down(opts);
};

export const mouseUp: BrowserCommand<[OptionsPointer]> = async (
  ctx,
  opts?: OptionsPointer,
) => {
  ctx.page.mouse.up(opts);
};

export const mouseWheel: BrowserCommand<[number, number]> = async (
  ctx,
  deltaX: number,
  deltaY: number,
) => {
  ctx.page.mouse.wheel(deltaX, deltaY);
};

export type TouchOptions = {
  position: MousePosition;
};

export type PointerOptions = {
  position: MousePosition;
  button?: 'left' | 'right' | 'middle';
  pointerId?: number;
};

let touchIdentifier = 0;
let cdpSession;

export const touchStart: BrowserCommand<[TouchOptions]> = async (
  ctx,
  { position: { x, y } },
) => {
  const frame = await ctx.frame();
  const element = await frame.frameElement();
  const boundingBox =
    (await element.boundingBox()) ?? error('No frame bounding box?!!');

  const frameScale =
    (await ctx.iframe.owner().locator('xpath=..').getAttribute('data-scale')) ??
    error('No scale?!!');

  const scaledX = x * parseFloat(frameScale);
  const scaledY = y * parseFloat(frameScale);

  // Use CDP session to dispatch touch event
  cdpSession ??= await ctx.context.newCDPSession(ctx.page);
  await cdpSession.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [
      {
        x: boundingBox.x + scaledX,
        y: boundingBox.y + scaledY,
        id: touchIdentifier,
      },
    ],
    timestamp: Date.now(),
  });
  touchIdentifier += 1;
};

export const touchMove: BrowserCommand<[TouchOptions]> = async (
  ctx,
  { position: { x, y } },
) => {
  const frame = await ctx.frame();
  const element = await frame.frameElement();
  const boundingBox =
    (await element.boundingBox()) ?? error('No frame bounding box?!!');

  const frameScale =
    (await ctx.iframe.owner().locator('xpath=..').getAttribute('data-scale')) ??
    error('No scale?!!');

  const scaledX = x * parseFloat(frameScale);
  const scaledY = y * parseFloat(frameScale);

  // Use CDP session to dispatch touch move event
  cdpSession ??= await ctx.context.newCDPSession(ctx.page);
  await cdpSession.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [
      {
        x: boundingBox.x + scaledX,
        y: boundingBox.y + scaledY,
        id: touchIdentifier, // Use current touch ID
      },
    ],
    timestamp: Date.now(),
  });
};

export const touchEnd: BrowserCommand<[]> = async (ctx) => {
  // Use CDP session to dispatch touch end event
  cdpSession ??= await ctx.context.newCDPSession(ctx.page);
  await cdpSession.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [], // Empty touch points for touchEnd
    timestamp: Date.now(),
  });
};

export const pointerDown: BrowserCommand<[PointerOptions]> = async (
  ctx,
  { position: { x, y }, button = 'left', pointerId = 1 },
) => {
  const frame = await ctx.frame();
  const element = await frame.frameElement();
  const boundingBox =
    (await element.boundingBox()) ?? error('No frame bounding box?!!');

  const frameScale =
    (await ctx.iframe.owner().locator('xpath=..').getAttribute('data-scale')) ??
    error('No scale?!!');

  const scaledX = x * parseFloat(frameScale);
  const scaledY = y * parseFloat(frameScale);

  // Use CDP session to dispatch pointer event
  cdpSession ??= await ctx.context.newCDPSession(ctx.page);
  await cdpSession.send('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    x: boundingBox.x + scaledX,
    y: boundingBox.y + scaledY,
    button: button,
    clickCount: 1,
    pointerType: 'mouse',
  });
};

export const pointerMove: BrowserCommand<[PointerOptions]> = async (
  ctx,
  { position: { x, y }, pointerId = 1 },
) => {
  const frame = await ctx.frame();
  const element = await frame.frameElement();
  const boundingBox =
    (await element.boundingBox()) ?? error('No frame bounding box?!!');

  const frameScale =
    (await ctx.iframe.owner().locator('xpath=..').getAttribute('data-scale')) ??
    error('No scale?!!');

  const scaledX = x * parseFloat(frameScale);
  const scaledY = y * parseFloat(frameScale);

  // Use CDP session to dispatch pointer move event
  cdpSession ??= await ctx.context.newCDPSession(ctx.page);
  await cdpSession.send('Input.dispatchMouseEvent', {
    type: 'mouseMoved',
    x: boundingBox.x + scaledX,
    y: boundingBox.y + scaledY,
    pointerType: 'mouse',
  });
};

export const pointerUp: BrowserCommand<[PointerOptions]> = async (
  ctx,
  { position: { x, y }, button = 'left', pointerId = 1 },
) => {
  const frame = await ctx.frame();
  const element = await frame.frameElement();
  const boundingBox =
    (await element.boundingBox()) ?? error('No frame bounding box?!!');

  const frameScale =
    (await ctx.iframe.owner().locator('xpath=..').getAttribute('data-scale')) ??
    error('No scale?!!');

  const scaledX = x * parseFloat(frameScale);
  const scaledY = y * parseFloat(frameScale);

  // Use CDP session to dispatch pointer up event
  cdpSession ??= await ctx.context.newCDPSession(ctx.page);
  await cdpSession.send('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    x: boundingBox.x + scaledX,
    y: boundingBox.y + scaledY,
    button: button,
    clickCount: 1,
    pointerType: 'mouse',
  });
};

export const mouseMove: BrowserCommand<[MousePosition, OptionsMove?]> = async (
  ctx,
  { x, y },
  opts: OptionsMove = {},
) => {
  const frame = await ctx.frame();
  const element = await frame.frameElement();
  const boundingBox =
    (await element.boundingBox()) ?? error('No frame bounding box?!!');

  const frameScale =
    (await ctx.iframe.owner().locator('xpath=..').getAttribute('data-scale')) ??
    error('No scale?!!');

  const scaledX = x * parseFloat(frameScale);
  const scaledY = y * parseFloat(frameScale);
  await ctx.page.mouse.move(
    boundingBox.x + scaledX,
    boundingBox.y + scaledY,
    opts,
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WithoutFirstArgument<T extends (...args: any[]) => any> = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...args: Parameters<T> extends [any, ...infer R] ? R : never
) => ReturnType<T>;

declare module '@vitest/browser/context' {
  interface BrowserCommands {
    mouseDown: WithoutFirstArgument<typeof mouseDown>;
    mouseUp: WithoutFirstArgument<typeof mouseUp>;
    mouseMove: WithoutFirstArgument<typeof mouseMove>;
    mouseWheel: WithoutFirstArgument<typeof mouseWheel>;
    touchStart: WithoutFirstArgument<typeof touchStart>;
    touchMove: WithoutFirstArgument<typeof touchMove>;
    touchEnd: WithoutFirstArgument<typeof touchEnd>;
    pointerDown: WithoutFirstArgument<typeof pointerDown>;
    pointerMove: WithoutFirstArgument<typeof pointerMove>;
    pointerUp: WithoutFirstArgument<typeof pointerUp>;
  }
}
