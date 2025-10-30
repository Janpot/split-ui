import { Panel, Resizer } from '@split-ui/react';
import styles from './index.module.css';

export default function ResizerStyle04() {
  return (
    <Panel group>
      <Panel group orientation="vertical">
        <Panel className={styles.demoPanel}>Left Top Panel</Panel>
        <Resizer className={styles.resizer} />
        <Panel className={styles.demoPanel}>Left Bottom Panel</Panel>
      </Panel>
      <Resizer className={styles.resizer} />
      <Panel className={styles.demoPanel}>Middle Panel</Panel>
      <Resizer className={styles.resizer} />
      <Panel group orientation="vertical">
        <Panel className={styles.demoPanel}>Right Top Panel</Panel>
        <Resizer className={styles.resizer} />
        <Panel className={styles.demoPanel}>Right Bottom Panel</Panel>
      </Panel>
    </Panel>
  );
}
