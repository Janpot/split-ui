import { render } from 'vitest-browser-react';
import { describe, it, expect } from 'vitest';
import { page, commands } from '@vitest/browser/context';
import { Panel, Resizer } from '.';
import '../browserCommands';
import './styles.css';
import { MousePosition } from '../browserCommands';
import * as React from 'react';

function getCenterPosition(element: Element): MousePosition {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

function offsetPosition(
  pos: MousePosition,
  offset: { x?: number; y?: number } = {},
): MousePosition {
  return {
    x: pos.x + (offset.x ?? 0),
    y: pos.y + (offset.y ?? 0),
  };
}

describe('Panel', () => {
  it('renders panel content correctly', async () => {
    await render(<Panel>Test Content</Panel>);
    await expect.element(page.getByText('Test Content')).toBeInTheDocument();
  });

  it('does simple resize', async () => {
    await render(
      <Panel group direction="row" style={{ width: '1000px' }}>
        <Panel>Left Panel</Panel>
        <Resizer />
        <Panel>Right Panel</Panel>
      </Panel>,
    );

    const resizer = page.getByRole('separator');
    await expect.element(resizer).toBeInTheDocument();

    const leftPanel = page.getByText('Left Panel').element() as HTMLElement;
    const rightPanel = page.getByText('Right Panel').element() as HTMLElement;

    await expect
      .element(resizer)
      .toHaveAttribute('aria-orientation', 'horizontal');
    await expect.element(resizer).toHaveAttribute('aria-valuenow', '497');
    await expect.element(resizer).toHaveAttribute('aria-valuemin', '0');
    await expect.element(resizer).toHaveAttribute('aria-valuemax', '994');

    await expect.poll(() => leftPanel.offsetWidth).toBe(497);
    await expect.poll(() => rightPanel.offsetWidth).toBe(497);

    const resizerPosition = getCenterPosition(await resizer.element());
    await commands.mouseMove(resizerPosition);
    await commands.mouseDown({ button: 'left' });
    await commands.mouseMove(offsetPosition(resizerPosition, { x: 50 }));
    await commands.mouseUp({ button: 'left' });

    await expect.element(resizer).toHaveAttribute('aria-valuenow', '547');
    await expect.poll(() => leftPanel.offsetWidth).toBe(547);
    await expect.poll(() => rightPanel.offsetWidth, { timeout: 500 }).toBe(447);
  });

  it('rebalances after hide', async () => {
    const TestComponent = () => {
      const [show, setShow] = React.useState(true);
      return (
        <>
          <button onClick={() => setShow(!show)}>Toggle Panel</button>
          <Panel group direction="row" style={{ width: '1000px' }}>
            <Panel>Left Panel</Panel>
            {show && (
              <>
                <Resizer />
                <Panel initialSize="200px">Right Panel</Panel>
              </>
            )}
          </Panel>
        </>
      );
    };

    await render(<TestComponent />);

    const resizer = page.getByRole('separator');
    const leftPanel = page.getByText('Left Panel').element() as HTMLElement;
    const rightPanel = page.getByText('Right Panel').element() as HTMLElement;

    await expect.poll(() => leftPanel.offsetWidth).toBe(794);
    await expect.poll(() => rightPanel.offsetWidth).toBe(200);

    const resizerPosition = getCenterPosition(await resizer.element());
    await commands.mouseMove(resizerPosition);
    await commands.mouseDown({ button: 'left' });
    await commands.mouseMove(offsetPosition(resizerPosition, { x: 50 }));
    await commands.mouseUp({ button: 'left' });

    await page.getByRole('button', { name: 'Toggle Panel' }).click();

    await expect.poll(() => leftPanel.offsetWidth).toBe(1000);
  });
});
