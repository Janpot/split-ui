import { Panel, Resizer } from '@split-ui/react';

export default function NestedDemo() {
  return (
    <Panel group direction="row">
      <Panel initialSize="200px" className="demo-panel panel-left">
        Left Panel
        <small>Fixed width</small>
      </Panel>
      <Resizer />
      <Panel group direction="column" minSize="100px">
        <Panel
          initialSize="150px"
          minSize="50px"
          className="demo-panel panel-middle-top"
        >
          Middle Top
          <small>Fixed height</small>
        </Panel>
        <Resizer />
        <Panel group direction="row" minSize="50px">
          <Panel minSize="20px" className="demo-panel panel-bottom-left">
            Bottom Left
            <small>Flexible</small>
          </Panel>
          <Resizer />
          <Panel minSize="20px" className="demo-panel panel-bottom-right">
            Bottom Right
            <small>Flexible</small>
          </Panel>
        </Panel>
      </Panel>
      <Resizer />
      <Panel initialSize="180px" className="demo-panel panel-right">
        Right Panel
        <small>Fixed width</small>
      </Panel>
    </Panel>
  );
}
