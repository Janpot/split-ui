import { Panel, Resizer } from "react-flex-panels";

export default function CustomResizerDemo() {
  return (
    <Panel group>
      <Panel className="demo-panel">
        Left Panel
        <small>Fancy handle resizer →</small>
      </Panel>
      <Resizer className="fancy-handle-resizer" />
      <Panel className="demo-panel">
        Middle Panel
        <small>← Invisible resizer →</small>
      </Panel>
      <Resizer className="invisible-resizer" />
      <Panel className="demo-panel">
        Right Panel
        <small>← Zero width, inner click target</small>
      </Panel>
    </Panel>
  );
}