import { Panel, Resizer } from '@split-ui/react';

export default function PersistenceDemo() {
  return (
    <Panel group persistenceId="persistence-demo">
      <Panel initialSize="25%" minSize="15%" className="demo-panel">
        Left Panel
        <small>Drag to resize →</small>
        <small>Position persisted!</small>
      </Panel>
      <Resizer />
      <Panel className="demo-panel">
        Main Content
        <small>Flexible width</small>
        <small>Try resizing and refreshing!</small>
      </Panel>
      <Resizer />
      <Panel initialSize="20%" maxSize="40%" className="demo-panel">
        Right Panel
        <small>← Drag to resize</small>
        <small>Synchronized across instances!</small>
      </Panel>
    </Panel>
  );
}
