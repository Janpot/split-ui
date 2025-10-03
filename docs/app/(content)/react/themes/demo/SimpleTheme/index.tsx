import { Panel, Resizer } from '@split-ui/react';
import '@split-ui/react/theme-simple.css';
import './index.css';

export default function SimpleTheme() {
  return (
    <div className="split-ui-theme-simple" style={{ height: '100%' }}>
      <Panel group>
        <Panel group orientation="vertical">
          <Panel className="demo-panel">Left Top Panel</Panel>
          <Resizer />
          <Panel className="demo-panel">Left Bottom Panel</Panel>
        </Panel>
        <Resizer />
        <Panel className="demo-panel">Middle Panel</Panel>
        <Resizer />
        <Panel group orientation="vertical">
          <Panel className="demo-panel">Right Top Panel</Panel>
          <Resizer />
          <Panel className="demo-panel">Right Bottom Panel</Panel>
        </Panel>
      </Panel>
    </div>
  );
}
