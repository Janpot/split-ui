import { Panel } from "react-flex-panels";

export default function ThreePaneDemo() {
  return (
    <Panel group>
      <Panel size="200px" className="demo-panel">
        Fixed Sidebar
        <small>size=&quot;200px&quot;</small>
      </Panel>
      <Panel className="demo-panel">
        Main Content
        <small>flexible (no size)</small>
      </Panel>
      <Panel size="150px" className="demo-panel">
        Fixed Panel
        <small>size=&quot;150px&quot;</small>
      </Panel>
    </Panel>
  );
}
