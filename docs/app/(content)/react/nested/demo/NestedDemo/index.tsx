import { Panel, Resizer } from '@split-ui/react';
import styles from './index.module.css';

export default function NestedDemo() {
  return (
    <Panel group orientation="horizontal">
      <Panel initialSize="25%" className={`${styles.demoPanel} ${styles.panelLeft}`}>
        Left Panel
        <small>Fixed width</small>
      </Panel>
      <Resizer />
      <Panel group orientation="vertical" minSize="15%">
        <Panel
          initialSize="40%"
          minSize="15%"
          className={`${styles.demoPanel} ${styles.panelMiddleTop}`}
        >
          Middle Top
          <small>Fixed height</small>
        </Panel>
        <Resizer />
        <Panel group orientation="horizontal" minSize="15%">
          <Panel minSize="10%" className={`${styles.demoPanel} ${styles.panelBottomLeft}`}>
            Bottom Left
            <small>Flexible</small>
          </Panel>
          <Resizer />
          <Panel minSize="10%" className={`${styles.demoPanel} ${styles.panelBottomRight}`}>
            Bottom Right
            <small>Flexible</small>
          </Panel>
        </Panel>
      </Panel>
      <Resizer />
      <Panel initialSize="22%" className={`${styles.demoPanel} ${styles.panelRight}`}>
        Right Panel
        <small>Fixed width</small>
      </Panel>
    </Panel>
  );
}
