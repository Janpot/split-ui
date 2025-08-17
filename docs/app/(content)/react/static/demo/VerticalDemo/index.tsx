import { Panel } from '@split-ui/react';

export default function VerticalDemo() {
  return (
    <Panel group orientation="vertical">
      <Panel initialSize="60px" className="demo-panel">
        Header
        <small>initialSize=&quot;60px&quot;</small>
      </Panel>
      <Panel className="demo-panel">
        Content Area
        <small>flexible (no initialSize)</small>
      </Panel>
      <Panel initialSize="40px" className="demo-panel">
        Footer
        <small>initialSize=&quot;40px&quot;</small>
      </Panel>
    </Panel>
  );
}
