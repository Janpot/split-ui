import { Panel } from '@split-ui/react';

export default function ThreePaneDemo() {
  return (
    <Panel group>
      <Panel initialSize="25%" className="demo-panel">
        Fixed Sidebar
        <small>initialSize=&quot;25%&quot;</small>
      </Panel>
      <Panel className="demo-panel">
        Main Content
        <small>flexible (no initialSize)</small>
      </Panel>
      <Panel initialSize="20%" className="demo-panel">
        Fixed Panel
        <small>initialSize=&quot;20%&quot;</small>
      </Panel>
    </Panel>
  );
}
