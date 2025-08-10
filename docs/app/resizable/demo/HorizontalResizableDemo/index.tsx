import { Panel, Resizer } from '@split-ui/react';

export default function HorizontalResizableDemo() {
  return (
    <Panel group>
      <Panel initialSize="200px" minSize="100px" className="demo-panel">
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
      <Panel initialSize="150px" maxSize="300px" className="demo-panel">
        Right Panel
        <small>← Drag to resize</small>
        <small>Max: 300px</small>
      </Panel>
    </Panel>
  );
}
