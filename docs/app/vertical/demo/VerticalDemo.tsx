import { Panel } from "react-flex-panels";

export default function VerticalDemo() {
  return (
    <Panel group direction="column">
      <Panel size="60px" className="demo-panel">
        Header
        <small>size="60px"</small>
      </Panel>
      <Panel className="demo-panel">
        Content Area
        <small>flexible (no size)</small>
      </Panel>
      <Panel size="40px" className="demo-panel">
        Footer
        <small>size="40px"</small>
      </Panel>
    </Panel>
  );
}
