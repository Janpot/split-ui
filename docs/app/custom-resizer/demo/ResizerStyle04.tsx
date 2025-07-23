import { Panel, Resizer } from "react-flex-panels";

export default function ResizerStyle04() {
  return (
    <Panel group>
      <Panel group direction="column">
        <Panel className="demo-panel-4">Left Top Panel</Panel>
        <Resizer className="resizer-4" />
        <Panel className="demo-panel-4">Left Bottom Panel</Panel>
      </Panel>
      <Resizer className="resizer-4" />
      <Panel className="demo-panel-4">Middle Panel</Panel>
      <Resizer className="resizer-4" />
      <Panel group direction="column">
        <Panel className="demo-panel-4">Right Top Panel</Panel>
        <Resizer className="resizer-4" />
        <Panel className="demo-panel-4">Right Bottom Panel</Panel>
      </Panel>
    </Panel>
  );
}
