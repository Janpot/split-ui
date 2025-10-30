import { Panel, Resizer } from '@split-ui/react';
import styles from './index.module.css';

export default function VerticalResizableDemo() {
  return (
    <Panel group orientation="vertical">
      <Panel initialSize="30%" minSize="20%" className={styles.demoPanel}>
        Top Panel
        <small>Drag to resize ↓</small>
        <small>Min: 20%</small>
      </Panel>
      <Resizer />
      <Panel className={styles.demoPanel}>
        Middle Content
        <small>Flexible height</small>
      </Panel>
      <Resizer />
      <Panel initialSize="25%" maxSize="50%" className={styles.demoPanel}>
        Bottom Panel
        <small>↑ Drag to resize</small>
        <small>Max: 50%</small>
      </Panel>
    </Panel>
  );
}
