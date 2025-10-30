'use client';

import { Panel, Resizer } from '@split-ui/react';
import { useState } from 'react';
import styles from './index.module.css';

export default function ConditionalDemo() {
  const [showLeft, setShowLeft] = useState(true);
  const [showRight, setShowRight] = useState(true);

  return (
    <div className={styles.conditionalDemo}>
      <div className={styles.controls}>
        <button
          onClick={() => setShowLeft(!showLeft)}
          className={showLeft ? styles.active : ''}
        >
          {showLeft ? 'Hide' : 'Show'} Left Panel
        </button>
        <button
          onClick={() => setShowRight(!showRight)}
          className={showRight ? styles.active : ''}
        >
          {showRight ? 'Hide' : 'Show'} Right Panel
        </button>
      </div>

      <Panel group>
        {showLeft && (
          <>
            <Panel
              initialSize="25%"
              className={`${styles.demoPanel} ${styles.leftPanel}`}
              index="conditional-1"
            >
              <h3>Left Panel</h3>
              <p>Navigation or sidebar content</p>
            </Panel>
            <Resizer />
          </>
        )}
        <Panel className={`${styles.demoPanel} ${styles.centerPanel}`}>
          <h3>Center Panel</h3>
          <p>Main content area that grows to fill available space</p>
          <small>flexible (no initialSize)</small>
        </Panel>
        {showRight && (
          <>
            <Resizer />
            <Panel
              initialSize="23%"
              className={`${styles.demoPanel} ${styles.rightPanel}`}
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
