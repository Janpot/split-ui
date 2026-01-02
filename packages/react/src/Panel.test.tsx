import { render } from 'vitest-browser-react';
import { describe, it, expect } from 'vitest';
import { page, commands, userEvent } from 'vitest/browser';
import { Panel, Resizer } from '.';
import './styles.css';
import type { MousePosition } from '../browserCommands';
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

async function dragElement(
  startPosition: MousePosition,
  offset: { x?: number; y?: number } = {},
): Promise<void> {
  await commands.mouseMove(startPosition);
  await commands.mouseDown({ button: 'left' });
  await commands.mouseMove(offsetPosition(startPosition, offset));
  await commands.mouseUp({ button: 'left' });
}

describe('Panel', () => {
  it('renders panel content correctly', async () => {
    await render(<Panel>Test Content</Panel>);
    await expect.element(page.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies user className to inner content div', async () => {
    const { container } = await render(
      <Panel className="custom-class">Test Content</Panel>,
    );

    const contentDiv = container.querySelector('.split-ui-panel-content');
    expect(contentDiv).toBeTruthy();
    expect(contentDiv?.classList).toContain('custom-class');
    expect(contentDiv?.classList).toContain('split-ui-panel-content');

    // Outer panel should not have the user className
    const outerPanel = container.querySelector('.split-ui-panel');
    expect(outerPanel?.classList).not.toContain('custom-class');
  });

  it('applies user style to inner content div', async () => {
    const { container } = await render(
      <Panel style={{ backgroundColor: 'red', padding: '10px' }}>
        Styled Content
      </Panel>,
    );

    const contentDiv = container.querySelector(
      '.split-ui-panel-content',
    ) as HTMLElement;
    expect(contentDiv).toBeTruthy();
    expect(contentDiv?.style.backgroundColor).toBe('red');
    expect(contentDiv?.style.padding).toBe('10px');
  });

  it('inner div is flex container for group panels', async () => {
    const { container } = await render(
      <Panel group orientation="horizontal">
        <Panel>Child 1</Panel>
        <Panel>Child 2</Panel>
      </Panel>,
    );

    // For groups, split-ui-panel-group is on the inner content div
    const contentDiv = container.querySelector(
      '.split-ui-panel-group',
    ) as HTMLElement;
    expect(contentDiv).toBeTruthy();
    expect(contentDiv.classList).toContain('split-ui-panel-content');
    expect(contentDiv.style.display).toBe('flex');
    expect(contentDiv.style.flexDirection).toBe('row');
  });

  it('inner div has correct flex direction for vertical groups', async () => {
    const { container } = await render(
      <Panel group orientation="vertical">
        <Panel>Child 1</Panel>
        <Panel>Child 2</Panel>
      </Panel>,
    );

    const contentDiv = container.querySelector(
      '.split-ui-panel-group',
    ) as HTMLElement;
    expect(contentDiv.style.flexDirection).toBe('column');
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

    const leftPanel = page.getByText('Left Panel');
    const rightPanel = page.getByText('Right Panel');

    await expect
      .element(resizer)
      .toHaveAttribute('aria-orientation', 'horizontal');
    await expect.element(resizer).toHaveAttribute('aria-valuenow', '497');
    await expect.element(resizer).toHaveAttribute('aria-valuemin', '0');
    await expect.element(resizer).toHaveAttribute('aria-valuemax', '994');

    await expect.element(leftPanel).toHaveProperty('offsetWidth', 497);
    await expect.element(rightPanel).toHaveProperty('offsetWidth', 497);

    const resizerPosition = getCenterPosition(await resizer.element());
    await dragElement(resizerPosition, { x: 50 });

    await expect.element(resizer).toHaveAttribute('aria-valuenow', '547');
    await expect.element(leftPanel).toHaveProperty('offsetWidth', 547);
    await expect.element(rightPanel).toHaveProperty('offsetWidth', 447);
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
    const leftPanel = page.getByText('Left Panel');
    const rightPanel = page.getByText('Right Panel');

    await expect.element(leftPanel).toHaveProperty('offsetWidth', 794);
    await expect.element(rightPanel).toHaveProperty('offsetWidth', 200);

    const resizerPosition = getCenterPosition(await resizer.element());
    await dragElement(resizerPosition, { x: 50 });

    await page.getByRole('button', { name: 'Toggle Panel' }).click();

    await expect.element(leftPanel).toHaveProperty('offsetWidth', 1000);
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
    const leftPanel1 = page.getByText('Left Panel 1');
    const leftPanel2 = page.getByText('Left Panel 2');

    // Both panels should start at same size
    await expect.element(leftPanel1).toHaveProperty('offsetWidth', 497);
    await expect.element(leftPanel2).toHaveProperty('offsetWidth', 497);

    // Start drag on first group's resizer
    const resizerPosition = getCenterPosition(await firstResizer.element());
    await commands.mouseMove(resizerPosition);
    await commands.mouseDown({ button: 'left' });

    // During drag - first panel changes but second should NOT update yet
    await commands.mouseMove(offsetPosition(resizerPosition, { x: 50 }));

    await expect.element(leftPanel1).toHaveProperty('offsetWidth', 547); // First group updates
    await expect.element(leftPanel2).toHaveProperty('offsetWidth', 497); // Second group unchanged during drag

    // After mouse release - second group SHOULD now update to match
    await commands.mouseUp({ button: 'left' });

    await expect.element(leftPanel1).toHaveProperty('offsetWidth', 547);
    await expect.element(leftPanel2).toHaveProperty('offsetWidth', 547); // Now matches first group
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
    const leftPanel = page.getByText('Left Panel');
    const rightPanel = page.getByText('Right Panel');

    // Both panels should start at same size
    await expect.element(leftPanel).toHaveProperty('offsetWidth', 497);
    await expect.element(rightPanel).toHaveProperty('offsetWidth', 497);

    const resizerPosition = getCenterPosition(await resizer.element());
    await dragElement(resizerPosition, { x: 50 }); // Drag right

    await expect.element(leftPanel).toHaveProperty('offsetWidth', 447);
    await expect.element(rightPanel).toHaveProperty('offsetWidth', 547);
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

  it('does not initiate resize on right-click', async () => {
    await render(
      <Panel group orientation="horizontal" style={{ width: '1000px' }}>
        <Panel>Left Panel</Panel>
        <Resizer aria-label="Right-click test resizer" />
        <Panel>Right Panel</Panel>
      </Panel>,
    );

    const resizer = page.getByRole('separator', {
      name: 'Right-click test resizer',
    });
    const leftPanel = page.getByText('Left Panel');
    const rightPanel = page.getByText('Right Panel');

    // Record initial widths
    await expect.element(leftPanel).toHaveProperty('offsetWidth', 497);
    await expect.element(rightPanel).toHaveProperty('offsetWidth', 497);

    // Try to drag with right mouse button
    const resizerPosition = getCenterPosition(await resizer.element());
    await commands.mouseMove(resizerPosition);
    await commands.mouseDown({ button: 'right' });
    await commands.mouseMove(offsetPosition(resizerPosition, { x: 50 }));
    await commands.mouseUp({ button: 'right' });

    // Panel widths should NOT have changed
    await expect.element(leftPanel).toHaveProperty('offsetWidth', 497);
    await expect.element(rightPanel).toHaveProperty('offsetWidth', 497);
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
    const leftPanel = page.getByText('Left Panel');
    const rightPanel = page.getByText('Right Panel');

    // Both panels should start at same size
    await expect.element(leftPanel).toHaveProperty('offsetWidth', 497);
    await expect.element(rightPanel).toHaveProperty('offsetWidth', 497);

    // Focus the resizer and use arrow keys
    await userEvent.keyboard('{Tab}');
    await expect.element(resizer).toHaveFocus();

    // Test right arrow (should expand left panel)
    await userEvent.keyboard('{ArrowRight}');
    await expect.element(leftPanel).toHaveProperty('offsetWidth', 507); // +10px default step
    await expect.element(rightPanel).toHaveProperty('offsetWidth', 487);

    // Test left arrow (should shrink left panel)
    await userEvent.keyboard('{ArrowLeft}');
    await expect.element(leftPanel).toHaveProperty('offsetWidth', 497); // Back to original
    await expect.element(rightPanel).toHaveProperty('offsetWidth', 497);

    // Test with Shift modifier (larger steps)
    await userEvent.keyboard('{Shift>}{ArrowRight}{/Shift}');
    await expect.element(leftPanel).toHaveProperty('offsetWidth', 547); // +50px with shift
    await expect.element(rightPanel).toHaveProperty('offsetWidth', 447);

    // Test with Ctrl modifier (fine steps)
    await userEvent.keyboard('{Control>}{ArrowLeft}{/Control}');
    await expect.element(leftPanel).toHaveProperty('offsetWidth', 546); // -1px with ctrl
    await expect.element(rightPanel).toHaveProperty('offsetWidth', 448);
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
    const topPanel = page.getByText('Top Panel');
    const bottomPanel = page.getByText('Bottom Panel');

    // Check ARIA orientation is set correctly
    await expect
      .element(resizer)
      .toHaveAttribute('aria-orientation', 'vertical');

    // Both panels should start at same size
    await expect.element(topPanel).toHaveProperty('offsetHeight', 497);
    await expect.element(bottomPanel).toHaveProperty('offsetHeight', 497);

    // Focus resizer and test vertical keyboard navigation
    await userEvent.keyboard('{Tab}');
    await expect.element(resizer).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');

    // Top panel should expand, bottom panel should shrink
    await expect.element(topPanel).toHaveProperty('offsetHeight', 507);
    await expect.element(bottomPanel).toHaveProperty('offsetHeight', 487);

    await userEvent.keyboard('{ArrowUp}');
    await expect.element(topPanel).toHaveProperty('offsetHeight', 497);
    await expect.element(bottomPanel).toHaveProperty('offsetHeight', 497);
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

    const leftPanel = page.getByText('Left Panel');
    const topRightPanel = page.getByText('Top Right Panel');
    const bottomRightPanel = page.getByText('Bottom Right Panel');

    // Verify initial layout
    await expect.element(leftPanel).toHaveProperty('offsetWidth', 497);
    await expect.element(topRightPanel).toHaveProperty('offsetWidth', 497);
    await expect.element(bottomRightPanel).toHaveProperty('offsetWidth', 497);
    await expect.element(topRightPanel).toHaveProperty('offsetHeight', 297);
    await expect.element(bottomRightPanel).toHaveProperty('offsetHeight', 297);

    // Check resizer orientations
    await expect
      .element(mainResizer)
      .toHaveAttribute('aria-orientation', 'horizontal');
    await expect
      .element(nestedResizer)
      .toHaveAttribute('aria-orientation', 'vertical');

    // Test main horizontal resize
    const mainResizerPosition = getCenterPosition(await mainResizer.element());
    await dragElement(mainResizerPosition, { x: 100 });

    // Left panel should expand, right panels should shrink but maintain their vertical proportions
    await expect.element(leftPanel).toHaveProperty('offsetWidth', 597);
    await expect.element(topRightPanel).toHaveProperty('offsetWidth', 397);
    await expect.element(bottomRightPanel).toHaveProperty('offsetWidth', 397);
    // Heights should remain the same within the right group
    await expect.element(topRightPanel).toHaveProperty('offsetHeight', 297);
    await expect.element(bottomRightPanel).toHaveProperty('offsetHeight', 297);

    // Test nested vertical resize
    const nestedResizerPosition = getCenterPosition(
      await nestedResizer.element(),
    );
    await dragElement(nestedResizerPosition, { y: 50 });

    // Top right panel should expand, bottom right should shrink
    // Widths should remain unchanged from previous resize
    await expect.element(leftPanel).toHaveProperty('offsetWidth', 597);
    await expect.element(topRightPanel).toHaveProperty('offsetWidth', 397);
    await expect.element(bottomRightPanel).toHaveProperty('offsetWidth', 397);
    // Heights should change within the nested group
    await expect.element(topRightPanel).toHaveProperty('offsetHeight', 347);
    await expect.element(bottomRightPanel).toHaveProperty('offsetHeight', 247);

    // Test that both resizers work independently
    // Resize main horizontal again - get current position of the resizer after previous resize
    const currentMainResizerPosition = getCenterPosition(
      await mainResizer.element(),
    );
    await dragElement(currentMainResizerPosition, { x: -50 }); // Move back 50px from current position

    // Widths should change but heights should remain from nested resize
    await expect.element(leftPanel).toHaveProperty('offsetWidth', 547);
    await expect.element(topRightPanel).toHaveProperty('offsetWidth', 447);
    await expect.element(bottomRightPanel).toHaveProperty('offsetWidth', 447);
    // Heights should be preserved from the nested resize
    await expect.element(topRightPanel).toHaveProperty('offsetHeight', 347);
    await expect.element(bottomRightPanel).toHaveProperty('offsetHeight', 247);
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

      const leftPanel = page.getByText('Left Panel');
      const rightPanel = page.getByText('Right Panel');

      // 25% of 1000px = 250px (flex-basis percentage of total container)
      await expect.element(leftPanel).toHaveProperty('offsetWidth', 250);
      // Right panel gets remaining space after left panel and resizer
      await expect.element(rightPanel).toHaveProperty('offsetWidth', 744);
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

      const constrainedPanel = page.getByText('Constrained Panel');
      const otherPanel = page.getByText('Other Panel');
      const resizer = page.getByRole('separator', {
        name: 'Constrained resizer',
      });

      // Initial: 30% of 1000px = 300px
      await expect.element(constrainedPanel).toHaveProperty('offsetWidth', 300);

      // Try to resize beyond maxSize (40% = 400px)
      const resizerPosition = getCenterPosition(await resizer.element());
      await dragElement(resizerPosition, { x: 200 }); // Try to expand by 200px

      // Should be constrained to maxSize: 40% = 400px
      await expect.element(constrainedPanel).toHaveProperty('offsetWidth', 400);
      await expect.element(otherPanel).toHaveProperty('offsetWidth', 594);

      // Try to resize below minSize (20% = 200px)
      // Get the current resizer position after the first drag
      const newResizerPosition = getCenterPosition(await resizer.element());
      await dragElement(newResizerPosition, { x: -300 }); // Try to shrink by 300px

      // Should be constrained to minSize: 20% = 200px
      await expect.element(constrainedPanel).toHaveProperty('offsetWidth', 200);
      await expect.element(otherPanel).toHaveProperty('offsetWidth', 794);
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

      const topPanel = page.getByText('Top Panel');
      const bottomPanel = page.getByText('Bottom Panel');

      // 25% of 800px = 200px
      await expect.element(topPanel).toHaveProperty('offsetHeight', 200);
      await expect.element(bottomPanel).toHaveProperty('offsetHeight', 594);

      const resizer = page.getByRole('separator', {
        name: 'Vertical percentage resizer',
      });

      // Test max constraint: 40% = 320px
      const resizerPosition = getCenterPosition(await resizer.element());
      await dragElement(resizerPosition, { y: 200 });

      // Should be constrained to maxSize: 40% = 320px
      await expect.element(topPanel).toHaveProperty('offsetHeight', 320);
      await expect.element(bottomPanel).toHaveProperty('offsetHeight', 474);
    });

    it('handles container resize with percentage values', async () => {
      const ContainerResizeTest = () => {
        const [width, setWidth] = React.useState(1000);

        return (
          <>
            <button onClick={() => setWidth(width === 1000 ? 800 : 1000)}>
              Resize Container
            </button>
            <Panel
              group
              orientation="horizontal"
              style={{ width: `${width}px` }}
            >
              <Panel initialSize="30%">Left Panel</Panel>
              <Resizer />
              <Panel>Right Panel</Panel>
            </Panel>
          </>
        );
      };

      await render(<ContainerResizeTest />);

      const leftPanel = page.getByText('Left Panel');
      const button = page.getByRole('button', { name: 'Resize Container' });

      // Initial: 30% of 1000px = 300px
      await expect.element(leftPanel).toHaveProperty('offsetWidth', 300);

      // Resize container to 800px
      await button.click();

      // Should adapt: 30% of 800px = 240px
      await expect.element(leftPanel).toHaveProperty('offsetWidth', 240);

      // Resize back to 1000px
      await button.click();

      // Should return: 30% of 1000px = 300px
      await expect.element(leftPanel).toHaveProperty('offsetWidth', 300);
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
      const panel1 = page.getByText('Panel 1');
      const panel2 = page.getByText('Panel 2');

      await expect.element(panel1).toHaveProperty('offsetWidth', 497);
      await expect.element(panel2).toHaveProperty('offsetWidth', 497);
    });

    it('handles explicit horizontal orientation', async () => {
      await render(
        <Panel group orientation="horizontal" style={{ width: '1000px' }}>
          <Panel>Left</Panel>
          <Resizer aria-label="Horizontal resizer" />
          <Panel>Right</Panel>
        </Panel>,
      );

      const resizer = page.getByRole('separator', {
        name: 'Horizontal resizer',
      });
      const leftPanel = page.getByText('Left');
      const rightPanel = page.getByText('Right');

      await expect
        .element(resizer)
        .toHaveAttribute('aria-orientation', 'horizontal');

      // Test horizontal keyboard navigation
      await userEvent.keyboard('{Tab}');
      await expect.element(resizer).toHaveFocus();
      await userEvent.keyboard('{ArrowRight}');

      // Arrow Right expands left panel, shrinks right panel
      await expect.element(leftPanel).toHaveProperty('offsetWidth', 507);
      await expect.element(rightPanel).toHaveProperty('offsetWidth', 487);

      await userEvent.keyboard('{ArrowLeft}');
      await expect.element(leftPanel).toHaveProperty('offsetWidth', 497);
      await expect.element(rightPanel).toHaveProperty('offsetWidth', 497);
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
      const topPanel = page.getByText('Top');
      const bottomPanel = page.getByText('Bottom');

      await expect
        .element(resizer)
        .toHaveAttribute('aria-orientation', 'vertical');

      // Test vertical keyboard navigation
      await userEvent.keyboard('{Tab}');
      await expect.element(resizer).toHaveFocus();
      await userEvent.keyboard('{ArrowDown}');

      // Top panel should expand, bottom panel should shrink
      await expect.element(topPanel).toHaveProperty('offsetHeight', 407);
      await expect.element(bottomPanel).toHaveProperty('offsetHeight', 387);

      await userEvent.keyboard('{ArrowUp}');
      await expect.element(topPanel).toHaveProperty('offsetHeight', 397);
      await expect.element(bottomPanel).toHaveProperty('offsetHeight', 397);
    });

    it('applies correct CSS classes for orientation', async () => {
      const { container: horizontalContainer } = await render(
        <Panel group orientation="horizontal">
          <Panel>Horizontal Test</Panel>
        </Panel>,
      );

      const horizontalPanel = horizontalContainer.querySelector(
        '.split-ui-horizontal',
      );
      expect(horizontalPanel).toBeTruthy();

      const { container: verticalContainer } = await render(
        <Panel group orientation="vertical">
          <Panel>Vertical Test</Panel>
        </Panel>,
      );

      const verticalPanel =
        verticalContainer.querySelector('.split-ui-vertical');
      expect(verticalPanel).toBeTruthy();
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
      const horizontalLeft = page.getByText('Horizontal Left');

      const horizontalResizerPosition = getCenterPosition(
        await horizontalResizer.element(),
      );
      await dragElement(horizontalResizerPosition, { x: 50 });

      // Should affect width
      await expect.element(horizontalLeft).toHaveProperty('offsetWidth', 547);

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
      const verticalTop = page.getByText('Vertical Top');

      const verticalResizerPosition = getCenterPosition(
        await verticalResizer.element(),
      );
      await dragElement(verticalResizerPosition, { y: 50 });

      // Should affect height
      await expect.element(verticalTop).toHaveProperty('offsetHeight', 447);
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

      const fixedPanel = page.getByText('Fixed Panel');
      const percentagePanel = page.getByText('Percentage Panel');
      const flexiblePanel = page.getByText('Flexible Panel');

      // Fixed panel: 200px (exact size as specified)
      await expect.element(fixedPanel).toHaveProperty('offsetWidth', 200);
      // Percentage panel: 30% of 1000px = 300px (exact percentage)
      await expect.element(percentagePanel).toHaveProperty('offsetWidth', 300);
      // Flexible panel gets remaining space after fixed and percentage panels + resizers
      await expect.element(flexiblePanel).toHaveProperty('offsetWidth', 488);
    });

    it('supports CSS calc() expressions', async () => {
      await render(
        <Panel group orientation="horizontal" style={{ width: '1000px' }}>
          <Panel initialSize="calc(50% - 100px)">Calc Panel</Panel>
          <Resizer />
          <Panel>Other Panel</Panel>
        </Panel>,
      );

      const calcPanel = page.getByText('Calc Panel');
      const otherPanel = page.getByText('Other Panel');

      // calc(50% - 100px) = 50% of 1000px - 100px = 500 - 100 = 400px (exact calculation)
      await expect.element(calcPanel).toHaveProperty('offsetWidth', 400);
      // Other panel gets remaining space
      await expect.element(otherPanel).toHaveProperty('offsetWidth', 594);
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

      const sidebarPanel = page.getByText('Sidebar');
      const mainPanel = page.getByText('Main Content');

      // CSS custom property: 250px (exact size as specified)
      await expect.element(sidebarPanel).toHaveProperty('offsetWidth', 250);
      // Main panel gets remaining space - resizer width
      await expect.element(mainPanel).toHaveProperty('offsetWidth', 744);
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

      const viewportPanel = page.getByText('Viewport Panel');
      const flexiblePanel = page.getByText('Flexible Panel');

      // Note: In test environment, viewport units may behave differently
      // We're testing that the units are accepted and processed
      await expect.element(viewportPanel).toHaveProperty('offsetWidth', 256);
      await expect.element(flexiblePanel).toHaveProperty('offsetWidth', 1018);
    });

    it('handles em and rem units', async () => {
      // Set font-size context for em/rem testing
      await render(
        <div style={{ fontSize: '16px' }}>
          <Panel group orientation="horizontal" style={{ width: '1000px' }}>
            <Panel initialSize="20em">Em Content</Panel>
            <Resizer />
            <Panel initialSize="15rem">Rem Content</Panel>
            <Resizer />
            <Panel>Flexible Unit Test Content</Panel>
          </Panel>
        </div>,
      );

      const emPanel = page.getByText('Em Content', { exact: true });
      const remPanel = page.getByText('Rem Content', { exact: true });
      const flexiblePanel = page.getByText('Flexible Unit Test Content');

      // 20em = 20 * 16px = 320px (exact size as specified)
      await expect.element(emPanel).toHaveProperty('offsetWidth', 320);
      // 15rem = 15 * 16px = 240px (exact size as specified)
      await expect.element(remPanel).toHaveProperty('offsetWidth', 240);
      // Flexible panel gets remaining space
      await expect.element(flexiblePanel).toHaveProperty('offsetWidth', 428);
    });
  });

  describe('Responsive behavior', () => {
    it('maintains percentage relationships when container resizes', async () => {
      const ResponsiveTest = () => {
        const [containerWidth, setContainerWidth] = React.useState(1000);

        return (
          <>
            <button
              onClick={() =>
                setContainerWidth(containerWidth === 1000 ? 1200 : 1000)
              }
            >
              Resize Container
            </button>
            <Panel
              group
              orientation="horizontal"
              style={{ width: `${containerWidth}px` }}
            >
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

      const leftPanel = page.getByText('Left Panel');
      const rightPanel = page.getByText('Right Panel');
      const button = page.getByText('Resize Container');

      // Initial state: 25% of 1000px = 250px
      await expect.element(leftPanel).toHaveProperty('offsetWidth', 250);
      await expect.element(rightPanel).toHaveProperty('offsetWidth', 744);

      // Resize container to 1200px
      await button.click();

      // Should maintain 25%: 25% of 1200px = 300px
      await expect.element(leftPanel).toHaveProperty('offsetWidth', 300);
      await expect.element(rightPanel).toHaveProperty('offsetWidth', 894);

      // Resize back to 1000px
      await button.click();

      // Should return to original: 25% of 1000px = 250px
      await expect.element(leftPanel).toHaveProperty('offsetWidth', 250);
      await expect.element(rightPanel).toHaveProperty('offsetWidth', 744);
    });

    it('adapts percentage constraints on container resize', async () => {
      const ConstraintTest = () => {
        const [containerWidth, setContainerWidth] = React.useState(1000);

        return (
          <>
            <button
              onClick={() =>
                setContainerWidth(containerWidth === 1000 ? 500 : 1000)
              }
            >
              Halve Container
            </button>
            <Panel
              group
              orientation="horizontal"
              style={{ width: `${containerWidth}px` }}
            >
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

      const constrainedPanel = page.getByText('Constrained Panel');
      const resizer = page.getByRole('separator', {
        name: 'Constraint test resizer',
      });
      const button = page.getByText('Halve Container');

      // Initial: 60% of 1000px = 600px
      await expect.element(constrainedPanel).toHaveProperty('offsetWidth', 600);

      // Halve container to 500px
      await button.click();

      // Should maintain 60%: 60% of 500px = 300px
      await expect.element(constrainedPanel).toHaveProperty('offsetWidth', 300);

      // Test that constraints scale appropriately
      // Try to resize beyond maxSize in smaller container
      const resizerPosition = getCenterPosition(await resizer.element());
      await dragElement(resizerPosition, { x: 100 });

      // Should be constrained to 80% of 500px = 400px
      await expect.element(constrainedPanel).toHaveProperty('offsetWidth', 400);
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

      const primaryPanel = page.getByText('Primary Panel');
      const button = page.getByText('Toggle Orientation');

      // Initial horizontal: 30% of 800px = 240px
      await expect.element(primaryPanel).toHaveProperty('offsetWidth', 240);

      // Switch to vertical orientation
      await button.click();

      // Should now be 30% of height: 30% of 600px = 180px
      await expect.element(primaryPanel).toHaveProperty('offsetHeight', 180);

      // Switch back to horizontal
      await button.click();

      // Should return to width-based sizing
      await expect.element(primaryPanel).toHaveProperty('offsetWidth', 240);
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

      const persistentPanel = page.getByText('Persistent Panel');
      const button = page.getByText('Switch Orientation');

      // Initial horizontal: 25% of 800px = 200px
      await expect.element(persistentPanel).toHaveProperty('offsetWidth', 200);

      // Switch to vertical - should maintain percentage
      await button.click();
      await expect.element(persistentPanel).toHaveProperty('offsetHeight', 150); // 25% of 600px = 150px

      // Switch back to horizontal - should restore percentage
      await button.click();
      await expect.element(persistentPanel).toHaveProperty('offsetWidth', 200);
    });

    it('handles nested panels with mixed percentage and pixel sizing', async () => {
      await render(
        <Panel
          group
          orientation="horizontal"
          style={{ width: '1200px', height: '500px' }}
        >
          <Panel initialSize="300px">Fixed Sidebar</Panel>
          <Resizer />
          <Panel group orientation="vertical" data-testid="right-area">
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

      const fixedSidebar = page.getByText('Fixed Sidebar');
      const header = page.getByText('Header');
      const leftContent = page.getByText('Left Content');
      const rightSidebar = page.getByText('Right Sidebar');
      const footer = page.getByText('Footer');

      // Fixed sidebar: 300px
      await expect.element(fixedSidebar).toHaveProperty('offsetWidth', 300);

      // Right area gets remaining width - use header's parent as it's inside the right area
      const rightArea = page.getByTestId('right-area');
      await expect.element(rightArea).toHaveProperty('offsetWidth', 894);

      // Header should be 30% of right area height
      await expect.element(header).toHaveProperty('offsetHeight', 150);

      // Left content should be 40% of available width in middle section
      await expect.element(leftContent).toHaveProperty('offsetWidth', 358);

      // Right sidebar should be 200px
      await expect.element(rightSidebar).toHaveProperty('offsetWidth', 200);

      // Footer should be 60px (minus resizer considerations)
      await expect.element(footer).toHaveProperty('offsetHeight', 60);
    });

    it('handles conditional panels with percentage sizing and orientation', async () => {
      const ConditionalPercentageTest = () => {
        const [showLeft, setShowLeft] = React.useState(true);
        const [showRight, setShowRight] = React.useState(true);
        const [isVertical, setIsVertical] = React.useState(false);

        return (
          <>
            <button onClick={() => setShowLeft(!showLeft)}>Toggle Left</button>
            <button onClick={() => setShowRight(!showRight)}>
              Toggle Right
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
                  <Panel
                    initialSize="30%"
                    minSize="20%"
                    index="left-conditional"
                  >
                    Left Panel
                  </Panel>
                  <Resizer />
                </>
              )}
              <Panel>Main Content</Panel>
              {showRight && (
                <>
                  <Resizer />
                  <Panel
                    initialSize="25%"
                    maxSize="40%"
                    index="right-conditional"
                  >
                    Right Panel
                  </Panel>
                </>
              )}
            </Panel>
          </>
        );
      };

      await render(<ConditionalPercentageTest />);

      const leftToggle = page.getByText('Toggle Left');
      const orientationToggle = page.getByText('Toggle Orientation');

      const leftPanel = page.getByText('Left Panel');
      const rightPanel = page.getByText('Right Panel');
      const mainContent = page.getByText('Main Content');

      // Initial state: both panels visible, horizontal orientation
      await expect.element(leftPanel).toHaveProperty('offsetWidth', 300); // 30% of 1000px
      await expect.element(rightPanel).toHaveProperty('offsetWidth', 250); // 25% of 1000px

      // Hide left panel - right panel and main content should adjust
      await leftToggle.click();

      // Now only right panel and main content should be visible
      await expect.element(rightPanel).toHaveProperty('offsetWidth', 250); // Should maintain 25%
      await expect.element(mainContent).toHaveProperty('offsetWidth', 744); // Should get remaining space

      // Show left panel again
      await leftToggle.click();
      await expect.element(leftPanel).toHaveProperty('offsetWidth', 300); // Should restore to 30%

      // Switch to vertical orientation
      await orientationToggle.click();

      // Should now be height-based: 30% and 25% of 600px
      await expect.element(leftPanel).toHaveProperty('offsetHeight', 180); // 30% of 600px
      await expect.element(rightPanel).toHaveProperty('offsetHeight', 150); // 25% of 600px
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
              <Panel initialSize="200px" index="fixed-panel">
                Fixed Panel
              </Panel>
              <Resizer />
              <Panel initialSize="30%" index="percentage-panel">
                Percentage Panel
              </Panel>
              <Resizer />
              <Panel index="flexible-panel">Flexible Panel</Panel>
            </Panel>
          </>
        );
      };

      await render(<PersistenceMixedTest />);

      const fixedPanel = page.getByText('Fixed Panel');
      const percentagePanel = page.getByText('Percentage Panel');

      const remountButton = page.getByText('Remount Component');

      // Initial state
      await expect.element(fixedPanel).toHaveProperty('offsetWidth', 200); // 200px exact
      await expect.element(percentagePanel).toHaveProperty('offsetWidth', 300); // 30% of 1000px exact

      // Get a resizer and drag to change percentage panel size
      const resizers = page.getByRole('separator').all();
      const secondResizer = (await resizers)[1];

      const resizerPosition = getCenterPosition(await secondResizer.element());
      await dragElement(resizerPosition, { x: 50 });

      // Percentage panel should expand
      await expect.element(percentagePanel).toHaveProperty('offsetWidth', 350);

      // Remount component - sizes should persist
      await remountButton.click();

      const newFixedPanel = page.getByText('Fixed Panel');
      const newPercentagePanel = page.getByText('Percentage Panel');

      // Fixed panel should restore to initial size (persistence doesn't affect it)
      await expect.element(newFixedPanel).toHaveProperty('offsetWidth', 200);
      // Percentage panel should maintain the dragged size
      await expect
        .element(newPercentagePanel)
        .toHaveProperty('offsetWidth', 350);
    });
  });
});
