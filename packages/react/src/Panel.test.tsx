import { render } from 'vitest-browser-react';
import { describe, it, expect } from 'vitest';
import { page, commands, userEvent } from '@vitest/browser/context';
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

  it('does not persist during drag, only on commit', async () => {
    await render(
      <div>
        <Panel
          group
          direction="row"
          persistenceId="test-persistence"
          style={{ width: '1000px' }}
        >
          <Panel>Left Panel 1</Panel>
          <Resizer aria-label="Resize first panel group" />
          <Panel>Right Panel 1</Panel>
        </Panel>
        <Panel
          group
          direction="row"
          persistenceId="test-persistence"
          style={{ width: '1000px' }}
        >
          <Panel>Left Panel 2</Panel>
          <Resizer aria-label="Resize second panel group" />
          <Panel>Right Panel 2</Panel>
        </Panel>
      </div>,
    );

    const firstResizer = page.getByRole('separator', {
      name: 'Resize first panel group',
    });
    const leftPanel1 = page.getByText('Left Panel 1').element() as HTMLElement;
    const leftPanel2 = page.getByText('Left Panel 2').element() as HTMLElement;

    // Both panels should start at same size
    await expect.poll(() => leftPanel1.offsetWidth).toBe(497);
    await expect.poll(() => leftPanel2.offsetWidth).toBe(497);

    // Start drag on first group's resizer
    const resizerPosition = getCenterPosition(await firstResizer.element());
    await commands.mouseMove(resizerPosition);
    await commands.mouseDown({ button: 'left' });

    // During drag - first panel changes but second should NOT update yet
    await commands.mouseMove(offsetPosition(resizerPosition, { x: 50 }));

    await expect.poll(() => leftPanel1.offsetWidth).toBe(547); // First group updates
    await expect.poll(() => leftPanel2.offsetWidth).toBe(497); // Second group unchanged during drag

    // After mouse release - second group SHOULD now update to match
    await commands.mouseUp({ button: 'left' });

    await expect.poll(() => leftPanel1.offsetWidth).toBe(547);
    await expect.poll(() => leftPanel2.offsetWidth).toBe(547); // Now matches first group
  });

  it('handles RTL horizontal resizing correctly', async () => {
    await render(
      <div dir="rtl">
        <Panel group direction="row" style={{ width: '1000px' }}>
          <Panel>Left Panel</Panel>
          <Resizer aria-label="RTL resize test" />
          <Panel>Right Panel</Panel>
        </Panel>
      </div>,
    );

    const resizer = page.getByRole('separator', { name: 'RTL resize test' });
    const leftPanel = page.getByText('Left Panel').element() as HTMLElement;
    const rightPanel = page.getByText('Right Panel').element() as HTMLElement;

    // Both panels should start at same size
    await expect.poll(() => leftPanel.offsetWidth).toBe(497);
    await expect.poll(() => rightPanel.offsetWidth).toBe(497);

    const resizerPosition = getCenterPosition(await resizer.element());
    await commands.mouseMove(resizerPosition);
    await commands.mouseDown({ button: 'left' });
    await commands.mouseMove(offsetPosition(resizerPosition, { x: 50 })); // Drag right
    await commands.mouseUp({ button: 'left' });

    await expect.poll(() => leftPanel.offsetWidth).toBe(447);
    await expect.poll(() => rightPanel.offsetWidth).toBe(547);
  });

  it('blurs focused resizer when starting drag', async () => {
    await render(
      <Panel group direction="row" style={{ width: '1000px' }}>
        <Panel>Left Panel</Panel>
        <Resizer aria-label="First resizer" />
        <Panel>Middle Panel</Panel>
        <Resizer aria-label="Second resizer" />
        <Panel>Right Panel</Panel>
      </Panel>,
    );

    const firstResizer = page.getByRole('separator', { name: 'First resizer' });
    const secondResizer = page.getByRole('separator', {
      name: 'Second resizer',
    });

    // Focus the first resizer
    await userEvent.keyboard('{Tab}');
    await expect.element(firstResizer).toHaveFocus();

    // Start dragging the second resizer
    const secondResizerPosition = getCenterPosition(
      await secondResizer.element(),
    );
    await commands.mouseMove(secondResizerPosition);
    await commands.mouseDown({ button: 'left' });

    // First resizer should be blurred
    await expect.element(firstResizer).not.toHaveFocus();

    // Clean up
    await commands.mouseUp({ button: 'left' });
  });

  it('handles touch events for resizing', async () => {
    await render(
      <Panel group direction="row" style={{ width: '1000px' }}>
        <Panel>Left Panel</Panel>
        <Resizer aria-label="Touch resizer" />
        <Panel>Right Panel</Panel>
      </Panel>,
    );

    const resizer = page.getByRole('separator', { name: 'Touch resizer' });
    const leftPanel = page.getByText('Left Panel').element() as HTMLElement;
    const rightPanel = page.getByText('Right Panel').element() as HTMLElement;

    // Both panels should start at same size
    await expect.poll(() => leftPanel.offsetWidth).toBe(497);
    await expect.poll(() => rightPanel.offsetWidth).toBe(497);

    // Use touch events for resizing
    const resizerPosition = getCenterPosition(await resizer.element());
    await commands.touchStart({ position: resizerPosition });
    await commands.touchMove({
      position: offsetPosition(resizerPosition, { x: 50 }),
    });
    await commands.touchEnd();

    // Panels should have resized
    await expect.poll(() => leftPanel.offsetWidth).toBe(547);
    await expect.poll(() => rightPanel.offsetWidth).toBe(447);
  });

  it('handles keyboard navigation for resizing', async () => {
    await render(
      <Panel group direction="row" style={{ width: '1000px' }}>
        <Panel>Left Panel</Panel>
        <Resizer aria-label="Keyboard resizer" />
        <Panel>Right Panel</Panel>
      </Panel>,
    );

    const resizer = page.getByRole('separator', { name: 'Keyboard resizer' });
    const leftPanel = page.getByText('Left Panel').element() as HTMLElement;
    const rightPanel = page.getByText('Right Panel').element() as HTMLElement;

    // Both panels should start at same size
    await expect.poll(() => leftPanel.offsetWidth).toBe(497);
    await expect.poll(() => rightPanel.offsetWidth).toBe(497);

    // Focus the resizer and use arrow keys
    await userEvent.keyboard('{Tab}');
    await expect.element(resizer).toHaveFocus();

    // Test right arrow (should expand left panel)
    await userEvent.keyboard('{ArrowRight}');
    await expect.poll(() => leftPanel.offsetWidth).toBe(507); // +10px default step
    await expect.poll(() => rightPanel.offsetWidth).toBe(487);

    // Test left arrow (should shrink left panel)
    await userEvent.keyboard('{ArrowLeft}');
    await expect.poll(() => leftPanel.offsetWidth).toBe(497); // Back to original
    await expect.poll(() => rightPanel.offsetWidth).toBe(497);

    // Test with Shift modifier (larger steps)
    await userEvent.keyboard('{Shift>}{ArrowRight}{/Shift}');
    await expect.poll(() => leftPanel.offsetWidth).toBe(547); // +50px with shift
    await expect.poll(() => rightPanel.offsetWidth).toBe(447);

    // Test with Ctrl modifier (fine steps)
    await userEvent.keyboard('{Control>}{ArrowLeft}{/Control}');
    await expect.poll(() => leftPanel.offsetWidth).toBe(546); // -1px with ctrl
    await expect.poll(() => rightPanel.offsetWidth).toBe(448);
  });

  it('handles vertical orientation', async () => {
    await render(
      <Panel group direction="column" style={{ height: '1000px' }}>
        <Panel>Top Panel</Panel>
        <Resizer aria-label="Vertical resizer" />
        <Panel>Bottom Panel</Panel>
      </Panel>,
    );

    const resizer = page.getByRole('separator', { name: 'Vertical resizer' });
    const topPanel = page.getByText('Top Panel').element() as HTMLElement;
    const bottomPanel = page.getByText('Bottom Panel').element() as HTMLElement;

    // Check ARIA orientation is set correctly
    await expect
      .element(resizer)
      .toHaveAttribute('aria-orientation', 'vertical');

    // Both panels should start at same size
    await expect.poll(() => topPanel.offsetHeight).toBe(497);
    await expect.poll(() => bottomPanel.offsetHeight).toBe(497);

    // Focus resizer and test vertical keyboard navigation
    await userEvent.keyboard('{Tab}');
    await expect.element(resizer).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');

    // Top panel should expand, bottom panel should shrink
    await expect.poll(() => topPanel.offsetHeight).toBe(507);
    await expect.poll(() => bottomPanel.offsetHeight).toBe(487);

    await userEvent.keyboard('{ArrowUp}');
    await expect.poll(() => topPanel.offsetHeight).toBe(497);
    await expect.poll(() => bottomPanel.offsetHeight).toBe(497);
  });
});
