import { Panel } from 'react-flex-panels';

export default function ThreePaneDemo() {
  return (
    <Panel group>
      <Panel initialSize="200px" className="demo-panel">
        Fixed Sidebar
        <small>initialSize=&quot;200px&quot;</small>
      </Panel>
      <Panel className="demo-panel">
        Main Content
        <small>flexible (no initialSize)</small>
      </Panel>
      <Panel initialSize="150px" className="demo-panel">
        Fixed Panel
        <small>initialSize=&quot;150px&quot;</small>
      </Panel>
    </Panel>
  );
}
