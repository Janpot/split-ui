import { Panel, Resizer } from "react-flex-panels";

export default function HorizontalResizableDemo() {
  return (
    <Panel group>
      <Panel size="200px" minSize="100px" className="demo-panel">
        Left Panel
        <small>Drag to resize →</small>
        <small>Min: 100px</small>
      </Panel>
      <Resizer />
      <Panel className="demo-panel">
        Main Content
        <small>Flexible width</small>
      </Panel>
      <Resizer />
      <Panel size="150px" maxSize="300px" className="demo-panel">
        Right Panel
        <small>← Drag to resize</small>
        <small>Max: 300px</small>
      </Panel>
    </Panel>
  );
}
