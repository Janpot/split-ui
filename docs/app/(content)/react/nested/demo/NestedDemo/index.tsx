import { Panel, Resizer } from '@split-ui/react';

export default function NestedDemo() {
  return (
    <Panel group orientation="horizontal">
      <Panel initialSize="25%" className="demo-panel panel-left">
        Left Panel
        <small>Fixed width</small>
      </Panel>
      <Resizer />
      <Panel group orientation="vertical" minSize="15%">
        <Panel
          initialSize="40%"
          minSize="15%"
          className="demo-panel panel-middle-top"
        >
          Middle Top
          <small>Fixed height</small>
        </Panel>
        <Resizer />
        <Panel group orientation="horizontal" minSize="15%">
          <Panel minSize="10%" className="demo-panel panel-bottom-left">
            Bottom Left
            <small>Flexible</small>
          </Panel>
          <Resizer />
          <Panel minSize="10%" className="demo-panel panel-bottom-right">
            Bottom Right
            <small>Flexible</small>
          </Panel>
        </Panel>
      </Panel>
      <Resizer />
      <Panel initialSize="22%" className="demo-panel panel-right">
        Right Panel
        <small>Fixed width</small>
      </Panel>
    </Panel>
  );
}
