import { Panel, Resizer } from "react-flex-panels";

export default function ResizerStyle01() {
  return (
    <Panel group>
      <Panel group direction="column">
        <Panel className="demo-panel-1">Left Top Panel</Panel>
        <Resizer className="resizer-1" />
        <Panel className="demo-panel-1">Left Bottom Panel</Panel>
      </Panel>
      <Resizer className="resizer-1" />
      <Panel className="demo-panel-1">Middle Panel</Panel>
      <Resizer className="resizer-1" />
      <Panel group direction="column">
        <Panel className="demo-panel-1">Right Top Panel</Panel>
        <Resizer className="resizer-1" />
        <Panel className="demo-panel-1">Right Bottom Panel</Panel>
      </Panel>
    </Panel>
  );
}
