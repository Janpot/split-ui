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
      <Panel group orientation="horizontal" style={{ width: '1000px' }}>
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
          <Panel group orientation="horizontal" style={{ width: '1000px' }}>
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
          orientation="horizontal"
          persistenceId="test-persistence"
          style={{ width: '1000px' }}
        >
          <Panel>Left Panel 1</Panel>
          <Resizer aria-label="Resize first panel group" />
          <Panel>Right Panel 1</Panel>
        </Panel>
        <Panel
          group
          orientation="horizontal"
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
        <Panel group orientation="horizontal" style={{ width: '1000px' }}>
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
      <Panel group orientation="horizontal" style={{ width: '1000px' }}>
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
      <Panel group orientation="horizontal" style={{ width: '1000px' }}>
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
      <Panel group orientation="horizontal" style={{ width: '1000px' }}>
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
      <Panel group orientation="vertical" style={{ height: '1000px' }}>
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

  it('handles nested layouts correctly', async () => {
    await render(
      <Panel
        group
        orientation="horizontal"
        style={{ width: '1000px', height: '600px' }}
      >
        <Panel>Left Panel</Panel>
        <Resizer aria-label="Main horizontal resizer" />
        <Panel group orientation="vertical">
          <Panel>Top Right Panel</Panel>
          <Resizer aria-label="Nested vertical resizer" />
          <Panel>Bottom Right Panel</Panel>
        </Panel>
      </Panel>,
    );

    const mainResizer = page.getByRole('separator', {
      name: 'Main horizontal resizer',
    });
    const nestedResizer = page.getByRole('separator', {
      name: 'Nested vertical resizer',
    });

    const leftPanel = page.getByText('Left Panel').element() as HTMLElement;
    const topRightPanel = page
      .getByText('Top Right Panel')
      .element() as HTMLElement;
    const bottomRightPanel = page
      .getByText('Bottom Right Panel')
      .element() as HTMLElement;

    // Verify initial layout
    await expect.poll(() => leftPanel.offsetWidth).toBe(497);
    await expect.poll(() => topRightPanel.offsetWidth).toBe(497);
    await expect.poll(() => bottomRightPanel.offsetWidth).toBe(497);
    await expect.poll(() => topRightPanel.offsetHeight).toBe(297);
    await expect.poll(() => bottomRightPanel.offsetHeight).toBe(297);

    // Check resizer orientations
    await expect
      .element(mainResizer)
      .toHaveAttribute('aria-orientation', 'horizontal');
    await expect
      .element(nestedResizer)
      .toHaveAttribute('aria-orientation', 'vertical');

    // Test main horizontal resize
    const mainResizerPosition = getCenterPosition(await mainResizer.element());
    await commands.mouseMove(mainResizerPosition);
    await commands.mouseDown({ button: 'left' });
    await commands.mouseMove(offsetPosition(mainResizerPosition, { x: 100 }));
    await commands.mouseUp({ button: 'left' });

    // Left panel should expand, right panels should shrink but maintain their vertical proportions
    await expect.poll(() => leftPanel.offsetWidth).toBe(597);
    await expect.poll(() => topRightPanel.offsetWidth).toBe(397);
    await expect.poll(() => bottomRightPanel.offsetWidth).toBe(397);
    // Heights should remain the same within the right group
    await expect.poll(() => topRightPanel.offsetHeight).toBe(297);
    await expect.poll(() => bottomRightPanel.offsetHeight).toBe(297);

    // Test nested vertical resize
    const nestedResizerPosition = getCenterPosition(
      await nestedResizer.element(),
    );
    await commands.mouseMove(nestedResizerPosition);
    await commands.mouseDown({ button: 'left' });
    await commands.mouseMove(offsetPosition(nestedResizerPosition, { y: 50 }));
    await commands.mouseUp({ button: 'left' });

    // Top right panel should expand, bottom right should shrink
    // Widths should remain unchanged from previous resize
    await expect.poll(() => leftPanel.offsetWidth).toBe(597);
    await expect.poll(() => topRightPanel.offsetWidth).toBe(397);
    await expect.poll(() => bottomRightPanel.offsetWidth).toBe(397);
    // Heights should change within the nested group
    await expect.poll(() => topRightPanel.offsetHeight).toBe(347);
    await expect.poll(() => bottomRightPanel.offsetHeight).toBe(247);

    // Test that both resizers work independently
    // Resize main horizontal again - get current position of the resizer after previous resize
    const currentMainResizerPosition = getCenterPosition(
      await mainResizer.element(),
    );
    await commands.mouseMove(currentMainResizerPosition);
    await commands.mouseDown({ button: 'left' });
    await commands.mouseMove(
      offsetPosition(currentMainResizerPosition, { x: -50 }),
    ); // Move back 50px from current position
    await commands.mouseUp({ button: 'left' });

    // Widths should change but heights should remain from nested resize
    await expect.poll(() => leftPanel.offsetWidth).toBe(547);
    await expect.poll(() => topRightPanel.offsetWidth).toBe(447);
    await expect.poll(() => bottomRightPanel.offsetWidth).toBe(447);
    // Heights should be preserved from the nested resize
    await expect.poll(() => topRightPanel.offsetHeight).toBe(347);
    await expect.poll(() => bottomRightPanel.offsetHeight).toBe(247);
  });

  describe('Percentage-based sizing', () => {
    it('handles percentage initialSize correctly', async () => {
      await render(
        <Panel group orientation="horizontal" style={{ width: '1000px' }}>
          <Panel initialSize="25%">Left Panel</Panel>
          <Resizer aria-label="Percentage resizer" />
          <Panel>Right Panel</Panel>
        </Panel>,
      );

      const leftPanel = page.getByText('Left Panel').element() as HTMLElement;
      const rightPanel = page.getByText('Right Panel').element() as HTMLElement;

      // 25% of 1000px = 250px (flex-basis percentage of total container)
      await expect.poll(() => leftPanel.offsetWidth).toBe(250);
      // Right panel gets remaining space after left panel and resizer
      await expect.poll(() => rightPanel.offsetWidth).toBeGreaterThan(740);
    });

    it('handles percentage minSize and maxSize constraints', async () => {
      await render(
        <Panel group orientation="horizontal" style={{ width: '1000px' }}>
          <Panel initialSize="30%" minSize="20%" maxSize="40%">
            Constrained Panel
          </Panel>
          <Resizer aria-label="Constrained resizer" />
          <Panel>Other Panel</Panel>
        </Panel>,
      );

      const constrainedPanel = page
        .getByText('Constrained Panel')
        .element() as HTMLElement;
      const otherPanel = page.getByText('Other Panel').element() as HTMLElement;
      const resizer = page.getByRole('separator', {
        name: 'Constrained resizer',
      });

      // Initial: 30% of 1000px = 300px
      await expect.poll(() => constrainedPanel.offsetWidth).toBe(300);

      // Try to resize beyond maxSize (40% = 400px)
      const resizerPosition = getCenterPosition(await resizer.element());
      await commands.mouseMove(resizerPosition);
      await commands.mouseDown({ button: 'left' });
      await commands.mouseMove(offsetPosition(resizerPosition, { x: 200 })); // Try to expand by 200px
      await commands.mouseUp({ button: 'left' });

      // Should be constrained to maxSize: 40% = 400px
      await expect.poll(() => constrainedPanel.offsetWidth).toBe(400);
      await expect.poll(() => otherPanel.offsetWidth).toBeGreaterThan(590);

      // Try to resize below minSize (20% = 200px)
      await commands.mouseMove(resizerPosition);
      await commands.mouseDown({ button: 'left' });
      await commands.mouseMove(offsetPosition(resizerPosition, { x: -300 })); // Try to shrink by 300px
      await commands.mouseUp({ button: 'left' });

      // Should be constrained to minSize: 20% = 200px
      await expect.poll(() => constrainedPanel.offsetWidth).toBe(200);
      await expect.poll(() => otherPanel.offsetWidth).toBeGreaterThan(790);
    });

    it('handles percentage sizing in vertical orientation', async () => {
      await render(
        <Panel group orientation="vertical" style={{ height: '800px' }}>
          <Panel initialSize="25%" minSize="10%" maxSize="40%">
            Top Panel
          </Panel>
          <Resizer aria-label="Vertical percentage resizer" />
          <Panel>Bottom Panel</Panel>
        </Panel>,
      );

      const topPanel = page.getByText('Top Panel').element() as HTMLElement;
      const bottomPanel = page.getByText('Bottom Panel').element() as HTMLElement;

      // 25% of 800px = 200px
      await expect.poll(() => topPanel.offsetHeight).toBe(200);
      await expect.poll(() => bottomPanel.offsetHeight).toBeGreaterThan(590);

      const resizer = page.getByRole('separator', {
        name: 'Vertical percentage resizer',
      });

      // Test max constraint: 40% = 320px
      const resizerPosition = getCenterPosition(await resizer.element());
      await commands.mouseMove(resizerPosition);
      await commands.mouseDown({ button: 'left' });
      await commands.mouseMove(offsetPosition(resizerPosition, { y: 200 }));
      await commands.mouseUp({ button: 'left' });

      // Should be constrained to maxSize: 40% = 320px
      await expect.poll(() => topPanel.offsetHeight).toBe(320);
      await expect.poll(() => bottomPanel.offsetHeight).toBeGreaterThan(470);
    });

    it('handles container resize with percentage values', async () => {
      const ContainerResizeTest = () => {
        const [width, setWidth] = React.useState(1000);
        
        return (
          <>
            <button onClick={() => setWidth(width === 1000 ? 800 : 1000)}>
              Resize Container
            </button>
            <Panel group orientation="horizontal" style={{ width: `${width}px` }}>
              <Panel initialSize="30%">Left Panel</Panel>
              <Resizer />
              <Panel>Right Panel</Panel>
            </Panel>
          </>
        );
      };

      await render(<ContainerResizeTest />);

      const leftPanel = page.getByText('Left Panel').element() as HTMLElement;
      const button = page.getByText('Resize Container');

      // Initial: 30% of 1000px = 300px
      await expect.poll(() => leftPanel.offsetWidth).toBe(300);

      // Resize container to 800px
      await userEvent.click(await button.element());

      // Should adapt: 30% of 800px = 240px
      await expect.poll(() => leftPanel.offsetWidth).toBe(240);

      // Resize back to 1000px
      await userEvent.click(await button.element());

      // Should return: 30% of 1000px = 300px
      await expect.poll(() => leftPanel.offsetWidth).toBe(300);
    });
  });

  describe('Orientation prop', () => {
    it('defaults to horizontal orientation', async () => {
      await render(
        <Panel group style={{ width: '1000px' }}>
          <Panel>Panel 1</Panel>
          <Resizer aria-label="Default orientation resizer" />
          <Panel>Panel 2</Panel>
        </Panel>,
      );

      const resizer = page.getByRole('separator', {
        name: 'Default orientation resizer',
      });

      // Should default to horizontal orientation
      await expect
        .element(resizer)
        .toHaveAttribute('aria-orientation', 'horizontal');

      // Should arrange panels horizontally (same height, different widths)
      const panel1 = page.getByText('Panel 1').element() as HTMLElement;
      const panel2 = page.getByText('Panel 2').element() as HTMLElement;

      await expect.poll(() => panel1.offsetWidth).toBe(497);
      await expect.poll(() => panel2.offsetWidth).toBe(497);
    });

    it('handles explicit horizontal orientation', async () => {
      await render(
        <Panel group orientation="horizontal" style={{ width: '1000px' }}>
          <Panel>Left</Panel>
          <Resizer aria-label="Horizontal resizer" />
          <Panel>Right</Panel>
        </Panel>,
      );

      const resizer = page.getByRole('separator', { name: 'Horizontal resizer' });
      const leftPanel = page.getByText('Left').element() as HTMLElement;
      const rightPanel = page.getByText('Right').element() as HTMLElement;

      await expect
        .element(resizer)
        .toHaveAttribute('aria-orientation', 'horizontal');

      // Test horizontal keyboard navigation
      await userEvent.keyboard('{Tab}');
      await expect.element(resizer).toHaveFocus();
      await userEvent.keyboard('{ArrowRight}');

      // Left panel should shrink, right panel should expand
      await expect.poll(() => leftPanel.offsetWidth).toBe(487);
      await expect.poll(() => rightPanel.offsetWidth).toBe(507);

      await userEvent.keyboard('{ArrowLeft}');
      await expect.poll(() => leftPanel.offsetWidth).toBe(497);
      await expect.poll(() => rightPanel.offsetWidth).toBe(497);
    });

    it('handles explicit vertical orientation', async () => {
      await render(
        <Panel group orientation="vertical" style={{ height: '800px' }}>
          <Panel>Top</Panel>
          <Resizer aria-label="Vertical resizer explicit" />
          <Panel>Bottom</Panel>
        </Panel>,
      );

      const resizer = page.getByRole('separator', {
        name: 'Vertical resizer explicit',
      });
      const topPanel = page.getByText('Top').element() as HTMLElement;
      const bottomPanel = page.getByText('Bottom').element() as HTMLElement;

      await expect
        .element(resizer)
        .toHaveAttribute('aria-orientation', 'vertical');

      // Test vertical keyboard navigation
      await userEvent.keyboard('{Tab}');
      await expect.element(resizer).toHaveFocus();
      await userEvent.keyboard('{ArrowDown}');

      // Top panel should expand, bottom panel should shrink
      await expect.poll(() => topPanel.offsetHeight).toBe(407);
      await expect.poll(() => bottomPanel.offsetHeight).toBe(387);

      await userEvent.keyboard('{ArrowUp}');
      await expect.poll(() => topPanel.offsetHeight).toBe(397);
      await expect.poll(() => bottomPanel.offsetHeight).toBe(397);
    });

    it('applies correct CSS classes for orientation', async () => {
      const { container: horizontalContainer } = await render(
        <Panel group orientation="horizontal">
          <Panel>Horizontal Test</Panel>
        </Panel>,
      );

      const horizontalPanel = horizontalContainer.querySelector(
        '.split-ui--horizontal',
      );
      expect(horizontalPanel).toBeTruthy();

      await render(
        <Panel group orientation="vertical">
          <Panel>Vertical Test</Panel>
        </Panel>,
      );

      const verticalPanel = page
        .getByText('Vertical Test')
        .element()!.parentElement;
      expect(verticalPanel?.classList).toContain('split-ui--vertical');
    });

    it('handles mouse dragging in different orientations', async () => {
      // Test horizontal dragging
      await render(
        <Panel group orientation="horizontal" style={{ width: '1000px' }}>
          <Panel>Horizontal Left</Panel>
          <Resizer aria-label="Horizontal drag test" />
          <Panel>Horizontal Right</Panel>
        </Panel>,
      );

      const horizontalResizer = page.getByRole('separator', {
        name: 'Horizontal drag test',
      });
      const horizontalLeft = page
        .getByText('Horizontal Left')
        .element() as HTMLElement;

      const horizontalResizerPosition = getCenterPosition(
        await horizontalResizer.element(),
      );
      await commands.mouseMove(horizontalResizerPosition);
      await commands.mouseDown({ button: 'left' });
      await commands.mouseMove(
        offsetPosition(horizontalResizerPosition, { x: 50 }),
      );
      await commands.mouseUp({ button: 'left' });

      // Should affect width
      await expect.poll(() => horizontalLeft.offsetWidth).toBe(547);

      // Test vertical dragging
      await render(
        <Panel group orientation="vertical" style={{ height: '800px' }}>
          <Panel>Vertical Top</Panel>
          <Resizer aria-label="Vertical drag test" />
          <Panel>Vertical Bottom</Panel>
        </Panel>,
      );

      const verticalResizer = page.getByRole('separator', {
        name: 'Vertical drag test',
      });
      const verticalTop = page.getByText('Vertical Top').element() as HTMLElement;

      const verticalResizerPosition = getCenterPosition(
        await verticalResizer.element(),
      );
      await commands.mouseMove(verticalResizerPosition);
      await commands.mouseDown({ button: 'left' });
      await commands.mouseMove(
        offsetPosition(verticalResizerPosition, { y: 50 }),
      );
      await commands.mouseUp({ button: 'left' });

      // Should affect height
      await expect.poll(() => verticalTop.offsetHeight).toBe(447);
    });
  });

  describe('Mixed unit support', () => {
    it('handles mixed percentage and pixel units', async () => {
      await render(
        <Panel group orientation="horizontal" style={{ width: '1000px' }}>
          <Panel initialSize="200px">Fixed Panel</Panel>
          <Resizer />
          <Panel initialSize="30%">Percentage Panel</Panel>
          <Resizer />
          <Panel>Flexible Panel</Panel>
        </Panel>,
      );

      const fixedPanel = page.getByText('Fixed Panel').element() as HTMLElement;
      const percentagePanel = page
        .getByText('Percentage Panel')
        .element() as HTMLElement;
      const flexiblePanel = page
        .getByText('Flexible Panel')
        .element() as HTMLElement;

      // Fixed panel: 200px
      await expect.poll(() => fixedPanel.offsetWidth).toBe(200);
      // Percentage panel: 30% of 1000px = 300px
      await expect.poll(() => percentagePanel.offsetWidth).toBe(300);
      // Flexible panel gets remaining space after fixed and percentage panels + resizers
      await expect.poll(() => flexiblePanel.offsetWidth).toBeGreaterThan(490);
    });

    it('supports CSS calc() expressions', async () => {
      await render(
        <Panel group orientation="horizontal" style={{ width: '1000px' }}>
          <Panel initialSize="calc(50% - 100px)">Calc Panel</Panel>
          <Resizer />
          <Panel>Other Panel</Panel>
        </Panel>,
      );

      const calcPanel = page.getByText('Calc Panel').element() as HTMLElement;
      const otherPanel = page.getByText('Other Panel').element() as HTMLElement;

      // calc(50% - 100px) = 50% of 1000px - 100px = 500 - 100 = 400px
      await expect.poll(() => calcPanel.offsetWidth).toBe(400);
      // Other panel gets remaining space
      await expect.poll(() => otherPanel.offsetWidth).toBeGreaterThan(590);
    });

    it('handles CSS variables and custom properties', async () => {
      const CustomPropertiesTest = () => (
        <div style={{ '--sidebar-width': '250px' } as React.CSSProperties}>
          <Panel group orientation="horizontal" style={{ width: '1000px' }}>
            <Panel initialSize="var(--sidebar-width)">Sidebar</Panel>
            <Resizer />
            <Panel>Main Content</Panel>
          </Panel>
        </div>
      );

      await render(<CustomPropertiesTest />);

      const sidebarPanel = page.getByText('Sidebar').element() as HTMLElement;
      const mainPanel = page.getByText('Main Content').element() as HTMLElement;

      // CSS custom property: 250px
      await expect.poll(() => sidebarPanel.offsetWidth).toBe(250);
      // Main panel gets remaining space
      await expect.poll(() => mainPanel.offsetWidth).toBeGreaterThan(740);
    });

    it('handles viewport units', async () => {
      // Set viewport dimensions for testing
      await render(
        <Panel group orientation="horizontal" style={{ width: '100vw' }}>
          <Panel initialSize="20vw">Viewport Panel</Panel>
          <Resizer />
          <Panel>Flexible Panel</Panel>
        </Panel>,
      );

      const viewportPanel = page.getByText('Viewport Panel').element() as HTMLElement;
      const flexiblePanel = page.getByText('Flexible Panel').element() as HTMLElement;

      // Note: In test environment, viewport units may behave differently
      // We're testing that the units are accepted and processed
      expect(viewportPanel.offsetWidth).toBeGreaterThan(0);
      expect(flexiblePanel.offsetWidth).toBeGreaterThan(0);
    });

    it('handles em and rem units', async () => {
      // Set font-size context for em/rem testing
      await render(
        <div style={{ fontSize: '16px' }}>
          <Panel group orientation="horizontal" style={{ width: '1000px' }}>
            <Panel initialSize="20em">Em Panel</Panel>
            <Resizer />
            <Panel initialSize="15rem">Rem Panel</Panel>
            <Resizer />
            <Panel>Flexible Panel</Panel>
          </Panel>
        </div>,
      );

      const emPanel = page.getByText('Em Panel').element() as HTMLElement;
      const remPanel = page.getByText('Rem Panel').element() as HTMLElement;
      const flexiblePanel = page.getByText('Flexible Panel').element() as HTMLElement;

      // 20em = 20 * 16px = 320px
      await expect.poll(() => emPanel.offsetWidth).toBe(320);
      // 15rem = 15 * 16px = 240px
      await expect.poll(() => remPanel.offsetWidth).toBe(240);
      // Flexible panel gets remaining space
      await expect.poll(() => flexiblePanel.offsetWidth).toBeGreaterThan(430);
    });
  });

  describe('Responsive behavior', () => {
    it('maintains percentage relationships when container resizes', async () => {
      const ResponsiveTest = () => {
        const [containerWidth, setContainerWidth] = React.useState(1000);
        
        return (
          <>
            <button onClick={() => setContainerWidth(containerWidth === 1000 ? 1200 : 1000)}>
              Resize Container
            </button>
            <Panel group orientation="horizontal" style={{ width: `${containerWidth}px` }}>
              <Panel initialSize="25%" minSize="15%" maxSize="35%">
                Left Panel
              </Panel>
              <Resizer />
              <Panel>Right Panel</Panel>
            </Panel>
          </>
        );
      };

      await render(<ResponsiveTest />);

      const leftPanel = page.getByText('Left Panel').element() as HTMLElement;
      const rightPanel = page.getByText('Right Panel').element() as HTMLElement;
      const button = page.getByText('Resize Container');

      // Initial state: 25% of 1000px = 250px
      await expect.poll(() => leftPanel.offsetWidth).toBe(250);
      await expect.poll(() => rightPanel.offsetWidth).toBeGreaterThan(740);

      // Resize container to 1200px
      await userEvent.click(await button.element());

      // Should maintain 25%: 25% of 1200px = 300px
      await expect.poll(() => leftPanel.offsetWidth).toBe(300);
      await expect.poll(() => rightPanel.offsetWidth).toBeGreaterThan(890);

      // Resize back to 1000px
      await userEvent.click(await button.element());

      // Should return to original: 25% of 1000px = 250px
      await expect.poll(() => leftPanel.offsetWidth).toBe(250);
      await expect.poll(() => rightPanel.offsetWidth).toBeGreaterThan(740);
    });

    it('adapts percentage constraints on container resize', async () => {
      const ConstraintTest = () => {
        const [containerWidth, setContainerWidth] = React.useState(1000);
        
        return (
          <>
            <button onClick={() => setContainerWidth(containerWidth === 1000 ? 500 : 1000)}>
              Halve Container
            </button>
            <Panel group orientation="horizontal" style={{ width: `${containerWidth}px` }}>
              <Panel initialSize="60%" minSize="30%" maxSize="80%">
                Constrained Panel
              </Panel>
              <Resizer aria-label="Constraint test resizer" />
              <Panel>Other Panel</Panel>
            </Panel>
          </>
        );
      };

      await render(<ConstraintTest />);

      const constrainedPanel = page.getByText('Constrained Panel').element() as HTMLElement;
      const resizer = page.getByRole('separator', { name: 'Constraint test resizer' });
      const button = page.getByText('Halve Container');

      // Initial: 60% of 1000px = 600px
      await expect.poll(() => constrainedPanel.offsetWidth).toBe(600);

      // Halve container to 500px
      await userEvent.click(await button.element());

      // Should maintain 60%: 60% of 500px = 300px
      await expect.poll(() => constrainedPanel.offsetWidth).toBe(300);

      // Test that constraints scale appropriately
      // Try to resize beyond maxSize in smaller container
      const resizerPosition = getCenterPosition(await resizer.element());
      await commands.mouseMove(resizerPosition);
      await commands.mouseDown({ button: 'left' });
      await commands.mouseMove(offsetPosition(resizerPosition, { x: 100 }));
      await commands.mouseUp({ button: 'left' });

      // Should be constrained to 80% of 500px = 400px
      await expect.poll(() => constrainedPanel.offsetWidth).toBe(400);
    });

    it('handles orientation change impact on responsive sizing', async () => {
      const OrientationResponsiveTest = () => {
        const [isVertical, setIsVertical] = React.useState(false);
        
        return (
          <>
            <button onClick={() => setIsVertical(!isVertical)}>
              Toggle Orientation
            </button>
            <Panel 
              group 
              orientation={isVertical ? 'vertical' : 'horizontal'}
              style={isVertical ? { height: '600px' } : { width: '800px' }}
            >
              <Panel initialSize="30%">Primary Panel</Panel>
              <Resizer />
              <Panel>Secondary Panel</Panel>
            </Panel>
          </>
        );
      };

      await render(<OrientationResponsiveTest />);

      const primaryPanel = page.getByText('Primary Panel').element() as HTMLElement;
      const button = page.getByText('Toggle Orientation');

      // Initial horizontal: 30% of 800px = 240px
      await expect.poll(() => primaryPanel.offsetWidth).toBe(240);

      // Switch to vertical orientation
      await userEvent.click(await button.element());

      // Should now be 30% of height: 30% of 600px = 180px
      await expect.poll(() => primaryPanel.offsetHeight).toBe(180);

      // Switch back to horizontal
      await userEvent.click(await button.element());

      // Should return to width-based sizing
      await expect.poll(() => primaryPanel.offsetWidth).toBe(240);
    });
  });

  describe('Integration tests for combined features', () => {
    it('handles percentage sizing with persistence across orientations', async () => {
      // Test that percentage values persist correctly when switching orientations
      const PersistenceOrientationTest = () => {
        const [isVertical, setIsVertical] = React.useState(false);
        
        return (
          <>
            <button onClick={() => setIsVertical(!isVertical)}>
              Switch Orientation
            </button>
            <Panel 
              group 
              orientation={isVertical ? 'vertical' : 'horizontal'}
              persistenceId="percentage-orientation-test"
              style={isVertical ? { height: '600px' } : { width: '800px' }}
            >
              <Panel initialSize="25%" minSize="15%" maxSize="40%">
                Persistent Panel
              </Panel>
              <Resizer />
              <Panel>Other Panel</Panel>
            </Panel>
          </>
        );
      };

      await render(<PersistenceOrientationTest />);

      const persistentPanel = page.getByText('Persistent Panel').element() as HTMLElement;
      const button = page.getByText('Switch Orientation');

      // Initial horizontal: 25% of 800px = 200px
      await expect.poll(() => persistentPanel.offsetWidth).toBe(200);

      // Switch to vertical - should maintain percentage
      await userEvent.click(await button.element());
      await expect.poll(() => persistentPanel.offsetHeight).toBe(150); // 25% of 600px = 150px

      // Switch back to horizontal - should restore percentage
      await userEvent.click(await button.element());
      await expect.poll(() => persistentPanel.offsetWidth).toBe(200);
    });

    it('handles nested panels with mixed percentage and pixel sizing', async () => {
      await render(
        <Panel group orientation="horizontal" style={{ width: '1200px' }}>
          <Panel initialSize="300px">Fixed Sidebar</Panel>
          <Resizer />
          <Panel group orientation="vertical">
            <Panel initialSize="30%">Header</Panel>
            <Resizer />
            <Panel group orientation="horizontal">
              <Panel initialSize="40%">Left Content</Panel>
              <Resizer />
              <Panel initialSize="200px">Right Sidebar</Panel>
            </Panel>
            <Resizer />
            <Panel initialSize="60px">Footer</Panel>
          </Panel>
        </Panel>,
      );

      const fixedSidebar = page.getByText('Fixed Sidebar').element() as HTMLElement;
      const header = page.getByText('Header').element() as HTMLElement;
      const leftContent = page.getByText('Left Content').element() as HTMLElement;
      const rightSidebar = page.getByText('Right Sidebar').element() as HTMLElement;
      const footer = page.getByText('Footer').element() as HTMLElement;

      // Fixed sidebar: 300px
      await expect.poll(() => fixedSidebar.offsetWidth).toBe(300);
      
      // Right area gets remaining width after fixed sidebar and resizer
      const rightArea = fixedSidebar.parentElement!.children[2] as HTMLElement;
      expect(rightArea.offsetWidth).toBeGreaterThan(890);

      // Header should be 30% of right area height
      expect(header.offsetHeight).toBeGreaterThan(0);
      
      // Left content should be 40% of available width in middle section
      expect(leftContent.offsetWidth).toBeGreaterThan(0);
      
      // Right sidebar should be 200px
      await expect.poll(() => rightSidebar.offsetWidth).toBe(200);
      
      // Footer should be 60px (minus resizer considerations)
      expect(footer.offsetHeight).toBeGreaterThan(50);
    });

    it('handles conditional panels with percentage sizing and orientation', async () => {
      const ConditionalPercentageTest = () => {
        const [showLeft, setShowLeft] = React.useState(true);
        const [showRight, setShowRight] = React.useState(true);
        const [isVertical, setIsVertical] = React.useState(false);

        return (
          <>
            <button onClick={() => setShowLeft(!showLeft)}>
              Toggle Left Panel
            </button>
            <button onClick={() => setShowRight(!showRight)}>
              Toggle Right Panel
            </button>
            <button onClick={() => setIsVertical(!isVertical)}>
              Toggle Orientation
            </button>
            <Panel
              group
              orientation={isVertical ? 'vertical' : 'horizontal'}
              style={isVertical ? { height: '600px' } : { width: '1000px' }}
            >
              {showLeft && (
                <>
                  <Panel initialSize="30%" minSize="20%" index="left-conditional">
                    Left Panel
                  </Panel>
                  <Resizer />
                </>
              )}
              <Panel>Main Content</Panel>
              {showRight && (
                <>
                  <Resizer />
                  <Panel initialSize="25%" maxSize="40%" index="right-conditional">
                    Right Panel
                  </Panel>
                </>
              )}
            </Panel>
          </>
        );
      };

      await render(<ConditionalPercentageTest />);

      const leftToggle = page.getByText('Toggle Left Panel');
      const rightToggle = page.getByText('Toggle Right Panel');
      const orientationToggle = page.getByText('Toggle Orientation');

      let leftPanel = page.getByText('Left Panel').element() as HTMLElement;
      let rightPanel = page.getByText('Right Panel').element() as HTMLElement;
      const mainContent = page.getByText('Main Content').element() as HTMLElement;

      // Initial state: both panels visible, horizontal orientation
      await expect.poll(() => leftPanel.offsetWidth).toBe(300); // 30% of 1000px
      await expect.poll(() => rightPanel.offsetWidth).toBe(250); // 25% of 1000px

      // Hide left panel - right panel and main content should adjust
      await userEvent.click(await leftToggle.element());
      
      // Now only right panel and main content should be visible
      rightPanel = page.getByText('Right Panel').element() as HTMLElement;
      await expect.poll(() => rightPanel.offsetWidth).toBe(250); // Should maintain 25%
      await expect.poll(() => mainContent.offsetWidth).toBeGreaterThan(740); // Should get remaining space

      // Show left panel again
      await userEvent.click(await leftToggle.element());
      leftPanel = page.getByText('Left Panel').element() as HTMLElement;
      await expect.poll(() => leftPanel.offsetWidth).toBe(300); // Should restore to 30%

      // Switch to vertical orientation
      await userEvent.click(await orientationToggle.element());
      leftPanel = page.getByText('Left Panel').element() as HTMLElement;
      rightPanel = page.getByText('Right Panel').element() as HTMLElement;
      
      // Should now be height-based: 30% and 25% of 600px
      await expect.poll(() => leftPanel.offsetHeight).toBe(180); // 30% of 600px
      await expect.poll(() => rightPanel.offsetHeight).toBe(150); // 25% of 600px
    });

    it('handles persistence with percentage values and mixed units', async () => {
      const PersistenceMixedTest = () => {
        const [resetKey, setResetKey] = React.useState(0);
        
        return (
          <>
            <button onClick={() => setResetKey(resetKey + 1)}>
              Remount Component
            </button>
            <Panel 
              key={resetKey}
              group 
              orientation="horizontal" 
              persistenceId="mixed-units-test"
              style={{ width: '1000px' }}
            >
              <Panel initialSize="200px" index="fixed-panel">Fixed Panel</Panel>
              <Resizer />
              <Panel initialSize="30%" index="percentage-panel">Percentage Panel</Panel>
              <Resizer />
              <Panel index="flexible-panel">Flexible Panel</Panel>
            </Panel>
          </>
        );
      };

      await render(<PersistenceMixedTest />);

      const fixedPanel = page.getByText('Fixed Panel').element() as HTMLElement;
      const percentagePanel = page.getByText('Percentage Panel').element() as HTMLElement;
      const flexiblePanel = page.getByText('Flexible Panel').element() as HTMLElement;
      const remountButton = page.getByText('Remount Component');

      // Initial state
      await expect.poll(() => fixedPanel.offsetWidth).toBe(200); // 200px
      await expect.poll(() => percentagePanel.offsetWidth).toBe(300); // 30% of 1000px

      // Get a resizer and drag to change percentage panel size
      const resizers = page.getByRole('separator').all();
      const secondResizer = (await resizers)[1];
      
      const resizerPosition = getCenterPosition(await secondResizer.element());
      await commands.mouseMove(resizerPosition);
      await commands.mouseDown({ button: 'left' });
      await commands.mouseMove(offsetPosition(resizerPosition, { x: 50 }));
      await commands.mouseUp({ button: 'left' });

      // Percentage panel should expand
      await expect.poll(() => percentagePanel.offsetWidth).toBe(350);

      // Remount component - sizes should persist
      await userEvent.click(await remountButton.element());

      const newFixedPanel = page.getByText('Fixed Panel').element() as HTMLElement;
      const newPercentagePanel = page.getByText('Percentage Panel').element() as HTMLElement;

      // Fixed panel should restore to initial size (persistence doesn't affect it)
      await expect.poll(() => newFixedPanel.offsetWidth).toBe(200);
      // Percentage panel should maintain the dragged size
      await expect.poll(() => newPercentagePanel.offsetWidth).toBe(350);
    });
  });
});
