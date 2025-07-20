import { Panel, Resizer } from "react-flex-panels";

export default function NestedDemo() {
  return (
    <Panel group direction="row">
      <Panel size="200px" className="demo-panel">
        Left Panel
        <small>Fixed width</small>
      </Panel>
      <Resizer />
      <Panel group direction="column" className="demo-panel-group">
        <Panel size="150px" className="demo-panel">
          Middle Top
          <small>Fixed height</small>
        </Panel>
        <Resizer />
        <Panel group direction="row" className="demo-panel-group">
          <Panel className="demo-panel">
            Bottom Left
            <small>Flexible</small>
          </Panel>
          <Resizer />
          <Panel className="demo-panel">
            Bottom Right
            <small>Flexible</small>
          </Panel>
        </Panel>
      </Panel>
      <Resizer />
      <Panel size="180px" className="demo-panel">
        Right Panel
        <small>Fixed width</small>
      </Panel>
    </Panel>
  );
}
