
import serverNodeImg from "../assets/SimulatorServer.svg";

type ServerNodeProps = {
  onOpen: () => void;
};

function ServerNode({ onOpen }: ServerNodeProps) {
  return (
    <img
      src={serverNodeImg}
      className="server-node"
      alt="Server"
      draggable={false}
      onMouseDown={(e) => e.stopPropagation()}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onOpen();
      }}
    />
  );
}

export default ServerNode;
