import { Panel, Resizer } from "react-flex-panels";

export default function PersistenceDemo() {
  return (
    <Panel group persistenceId="persistence-demo">
      <Panel initialSize="200px" minSize="100px" className="demo-panel">
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
      <Panel initialSize="150px" maxSize="300px" className="demo-panel">
        Right Panel
        <small>← Drag to resize</small>
        <small>Synchronized across instances!</small>
      </Panel>
    </Panel>
  );
}
