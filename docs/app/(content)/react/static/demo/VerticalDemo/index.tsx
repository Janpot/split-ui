import { Panel } from '@split-ui/react';

export default function VerticalDemo() {
  return (
    <Panel group orientation="vertical">
      <Panel initialSize="15%" className="demo-panel">
        Header
        <small>initialSize=&quot;15%&quot;</small>
      </Panel>
      <Panel className="demo-panel">
        Content Area
        <small>flexible (no initialSize)</small>
      </Panel>
      <Panel initialSize="10%" className="demo-panel">
        Footer
        <small>initialSize=&quot;10%&quot;</small>
      </Panel>
    </Panel>
  );
}
