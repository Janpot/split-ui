import { Panel, Resizer } from '@split-ui/react';

export default function VerticalResizableDemo() {
  return (
    <Panel group orientation="vertical">
      <Panel initialSize="30%" minSize="20%" className="demo-panel">
        Top Panel
        <small>Drag to resize ↓</small>
        <small>Min: 20%</small>
      </Panel>
      <Resizer aria-label="Resize top panel height" />
      <Panel className="demo-panel">
        Middle Content
        <small>Flexible height</small>
      </Panel>
      <Resizer aria-label="Resize bottom panel height" />
      <Panel initialSize="25%" maxSize="50%" className="demo-panel">
        Bottom Panel
        <small>↑ Drag to resize</small>
        <small>Max: 50%</small>
      </Panel>
    </Panel>
  );
}
