import { Panel } from '@split-ui/react';
import styles from './index.module.css';

export default function VerticalDemo() {
  return (
    <Panel group orientation="vertical">
      <Panel initialSize="15%" className={styles.demoPanel}>
        Header
        <small>initialSize=&quot;15%&quot;</small>
      </Panel>
      <Panel className={styles.demoPanel}>
        Content Area
        <small>flexible (no initialSize)</small>
      </Panel>
      <Panel initialSize="10%" className={styles.demoPanel}>
        Footer
        <small>initialSize=&quot;10%&quot;</small>
      </Panel>
    </Panel>
  );
}
