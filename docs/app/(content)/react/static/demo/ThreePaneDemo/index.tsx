import { Panel } from '@split-ui/react';
import styles from './index.module.css';

export default function ThreePaneDemo() {
  return (
    <Panel group>
      <Panel initialSize="25%" className={styles.demoPanel}>
        Fixed Sidebar
        <small>initialSize=&quot;25%&quot;</small>
      </Panel>
      <Panel className={styles.demoPanel}>
        Main Content
        <small>flexible (no initialSize)</small>
      </Panel>
      <Panel initialSize="20%" className={styles.demoPanel}>
        Fixed Panel
        <small>initialSize=&quot;20%&quot;</small>
      </Panel>
    </Panel>
  );
}
