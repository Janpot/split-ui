import { Panel, Resizer } from 'react-flex-panels';

export default function VerticalResizableDemo() {
  return (
    <Panel group direction="column">
      <Panel initialSize="100px" minSize="60px" className="demo-panel">
        Top Panel
        <small>Drag to resize ↓</small>
        <small>Min: 60px</small>
      </Panel>
      <Resizer />
      <Panel className="demo-panel">
        Middle Content
        <small>Flexible height</small>
      </Panel>
      <Resizer />
      <Panel initialSize="80px" maxSize="150px" className="demo-panel">
        Bottom Panel
        <small>↑ Drag to resize</small>
        <small>Max: 150px</small>
      </Panel>
    </Panel>
  );
}
