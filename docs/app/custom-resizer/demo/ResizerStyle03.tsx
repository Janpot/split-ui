import { Panel, Resizer } from "react-flex-panels";

export default function ResizerStyle03() {
  return (
    <Panel group>
      <Panel group direction="column">
        <Panel className="demo-panel-3">Left Top Panel</Panel>
        <Resizer className="resizer-3" />
        <Panel className="demo-panel-3">Left Bottom Panel</Panel>
      </Panel>
      <Resizer className="resizer-3" />
      <Panel className="demo-panel-3">Middle Panel</Panel>
      <Resizer className="resizer-3" />
      <Panel group direction="column">
        <Panel className="demo-panel-3">Right Top Panel</Panel>
        <Resizer className="resizer-3" />
        <Panel className="demo-panel-3">Right Bottom Panel</Panel>
      </Panel>
    </Panel>
  );
}
