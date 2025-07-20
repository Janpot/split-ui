import { Panel, Resizer } from "react-flex-panels";

export default function IframeDemo() {
  return (
    <Panel group>
      <Panel size="300px" minSize="200px" className="demo-panel">
        Controls Panel
        <small>Drag to resize →</small>
        <small>Min: 200px</small>
        <small>✨ Dragging over iframe works!</small>
      </Panel>
      <Resizer />
      <Panel className="demo-panel" style={{ padding: 0 }}>
        <iframe
          src="https://example.com"
          style={{
            width: "100%",
            height: "100%",
            border: "none",
          }}
          title="Example Website"
        />
      </Panel>
    </Panel>
  );
}
