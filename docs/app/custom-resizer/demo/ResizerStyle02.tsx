import { Panel, Resizer } from "react-flex-panels";

export default function ResizerStyle02() {
  return (
    <Panel group>
      <Panel group direction="column">
        <Panel className="demo-panel-2">Left Top Panel</Panel>
        <Resizer className="resizer-2" />
        <Panel className="demo-panel-2">Left Bottom Panel</Panel>
      </Panel>
      <Resizer className="resizer-2" />
      <Panel className="demo-panel-2">Middle Panel</Panel>
      <Resizer className="resizer-2" />
      <Panel group direction="column">
        <Panel className="demo-panel-2">Right Top Panel</Panel>
        <Resizer className="resizer-2" />
        <Panel className="demo-panel-2">Right Bottom Panel</Panel>
      </Panel>
    </Panel>
  );
}
