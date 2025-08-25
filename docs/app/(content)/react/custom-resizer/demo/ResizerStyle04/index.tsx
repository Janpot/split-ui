import { Panel, Resizer } from '@split-ui/react';

export default function ResizerStyle04() {
  return (
    <Panel group>
      <Panel group orientation="vertical">
        <Panel className="demo-panel">Left Top Panel</Panel>
        <Resizer className="resizer" aria-label="Adjust left section height" />
        <Panel className="demo-panel">Left Bottom Panel</Panel>
      </Panel>
      <Resizer className="resizer" aria-label="Resize left column width" />
      <Panel className="demo-panel">Middle Panel</Panel>
      <Resizer className="resizer" aria-label="Resize right column width" />
      <Panel group orientation="vertical">
        <Panel className="demo-panel">Right Top Panel</Panel>
        <Resizer className="resizer" aria-label="Adjust right section height" />
        <Panel className="demo-panel">Right Bottom Panel</Panel>
      </Panel>
    </Panel>
  );
}
