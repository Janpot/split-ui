import { Panel, Resizer } from '@split-ui/react';

export default function HorizontalResizableDemo() {
  return (
    <Panel group>
      <Panel initialSize="25%" minSize="15%" className="demo-panel">
        Left Panel
        <small>Drag to resize →</small>
        <small>Min: 15%</small>
      </Panel>
      <Resizer />
      <Panel className="demo-panel">
        Main Content
        <small>Flexible width</small>
      </Panel>
      <Resizer />
      <Panel initialSize="20%" maxSize="40%" className="demo-panel">
        Right Panel
        <small>← Drag to resize</small>
        <small>Max: 40%</small>
      </Panel>
    </Panel>
  );
}
