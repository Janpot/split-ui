import { Panel, Resizer } from '@split-ui/react';
import styles from './index.module.css';

export default function HorizontalResizableDemo() {
  return (
    <Panel group>
      <Panel initialSize="25%" minSize="15%" className={styles.demoPanel}>
        Left Panel
        <small>Drag to resize →</small>
        <small>Min: 15%</small>
      </Panel>
      <Resizer />
      <Panel className={styles.demoPanel}>
        Main Content
        <small>Flexible width</small>
      </Panel>
      <Resizer />
      <Panel initialSize="20%" maxSize="40%" className={styles.demoPanel}>
        Right Panel
        <small>← Drag to resize</small>
        <small>Max: 40%</small>
      </Panel>
    </Panel>
  );
}
