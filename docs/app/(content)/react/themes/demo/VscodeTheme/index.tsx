import { Panel, Resizer } from '@split-ui/react';
import '@split-ui/react/theme-vscode.css';
import styles from './index.module.css';

export default function VscodeTheme() {
  return (
    <div className="split-ui-theme-vscode" style={{ height: '100%' }}>
      <Panel group>
        <Panel group orientation="vertical">
          <Panel className={styles.demoPanel}>Left Top Panel</Panel>
          <Resizer />
          <Panel className={styles.demoPanel}>Left Bottom Panel</Panel>
        </Panel>
        <Resizer />
        <Panel className={styles.demoPanel}>Middle Panel</Panel>
        <Resizer />
        <Panel group orientation="vertical">
          <Panel className={styles.demoPanel}>Right Top Panel</Panel>
          <Resizer />
          <Panel className={styles.demoPanel}>Right Bottom Panel</Panel>
        </Panel>
      </Panel>
    </div>
  );
}
