'use client';

import { Panel, Resizer } from 'react-flex-panels';
import { useState } from 'react';

export default function ConditionalDemo() {
  const [showLeft, setShowLeft] = useState(true);
  const [showRight, setShowRight] = useState(true);

  return (
    <div className="conditional-demo">
      <div className="controls">
        <button
          onClick={() => setShowLeft(!showLeft)}
          className={showLeft ? 'active' : ''}
        >
          {showLeft ? 'Hide' : 'Show'} Left Panel
        </button>
        <button
          onClick={() => setShowRight(!showRight)}
          className={showRight ? 'active' : ''}
        >
          {showRight ? 'Hide' : 'Show'} Right Panel
        </button>
      </div>

      <Panel group>
        {showLeft && (
          <>
            <Panel
              initialSize="200px"
              className="demo-panel left-panel"
              index="conditional-1"
            >
              <h3>Left Panel</h3>
              <p>Navigation or sidebar content</p>
            </Panel>
            <Resizer />
          </>
        )}
        <Panel className="demo-panel center-panel">
          <h3>Center Panel</h3>
          <p>Main content area that grows to fill available space</p>
          <small>flexible (no initialSize)</small>
        </Panel>
        {showRight && (
          <>
            <Resizer />
            <Panel
              initialSize="180px"
              className="demo-panel right-panel"
              index="conditional-2"
            >
              <h3>Right Panel</h3>
              <p>Additional tools or information</p>
            </Panel>
          </>
        )}
      </Panel>
    </div>
  );
}
