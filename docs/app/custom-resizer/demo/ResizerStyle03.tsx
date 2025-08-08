import { Panel, Resizer } from '@split-ui/react';

export default function ResizerStyle03() {
  return (
    <Panel group>
      <Panel group direction="column">
        <Panel className="demo-panel">Left Top Panel</Panel>
        <Resizer className="resizer" />
        <Panel className="demo-panel">Left Bottom Panel</Panel>
      </Panel>
      <Resizer className="resizer" />
      <Panel className="demo-panel">Middle Panel</Panel>
      <Resizer className="resizer" />
      <Panel group direction="column">
        <Panel className="demo-panel">Right Top Panel</Panel>
        <Resizer className="resizer" />
        <Panel className="demo-panel">Right Bottom Panel</Panel>
      </Panel>
    </Panel>
  );
}
