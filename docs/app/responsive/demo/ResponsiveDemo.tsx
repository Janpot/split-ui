import { Panel } from "react-flex-panels";

export default function ResponsiveDemo() {
  return (
    <Panel group>
      <Panel className="demo-panel" flex={3}>
        Main Content
        <small>flex: 3</small>
      </Panel>
      <Panel className="demo-panel" flex={2}>
        Secondary Content
        <small>flex: 2</small>
      </Panel>
      <Panel className="demo-panel" flex={1}>
        Sidebar
        <small>flex: 1</small>
      </Panel>
    </Panel>
  );
}
