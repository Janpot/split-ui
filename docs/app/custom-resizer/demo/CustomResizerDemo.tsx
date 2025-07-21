import { Panel, Resizer } from "react-flex-panels";

export default function CustomResizerDemo() {
  return (
    <Panel group>
      <Panel group direction="column">
        <Panel className="demo-panel">Left Top Panel</Panel>
        <Resizer className="fancy-handle-resizer" />
        <Panel className="demo-panel">Left Bottom Panel</Panel>
      </Panel>
      <Resizer className="fancy-handle-resizer" />
      <Panel className="demo-panel">Middle Panel</Panel>
      <Resizer className="handle-resizer" />
      <Panel group direction="column">
        <Panel className="demo-panel">Right Top Panel</Panel>
        <Resizer className="handle-resizer" />
        <Panel className="demo-panel">Right Bottom Panel</Panel>
      </Panel>
    </Panel>
  );
}
