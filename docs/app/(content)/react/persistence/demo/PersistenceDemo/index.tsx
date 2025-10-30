import { Panel, Resizer } from '@split-ui/react';
import styles from './index.module.css';

export default function PersistenceDemo() {
  return (
    <Panel group persistenceId="persistence-demo">
      <Panel initialSize="25%" minSize="15%" className={styles.demoPanel}>
        Left Panel
        <small>Drag to resize →</small>
        <small>Position persisted!</small>
      </Panel>
      <Resizer />
      <Panel className={styles.demoPanel}>
        Main Content
        <small>Flexible width</small>
        <small>Try resizing and refreshing!</small>
      </Panel>
      <Resizer />
      <Panel initialSize="20%" maxSize="40%" className={styles.demoPanel}>
        Right Panel
        <small>← Drag to resize</small>
        <small>Synchronized across instances!</small>
      </Panel>
    </Panel>
  );
}
