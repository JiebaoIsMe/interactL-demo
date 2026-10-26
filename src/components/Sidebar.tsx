import { useState } from "react";
import { NavLink } from "react-router";
import { PanelLeft, Move, LayoutGrid, PanelsTopLeft } from "lucide-react";

function Sidebar() {

  const [isExpanded, setIsExpanded] = useState(false);

  function toggleSidebar() {
    setIsExpanded(!isExpanded);
  }

  return (
    <aside className={`sidebar ${isExpanded ? "expanded" : "collapsed"}`}>

      <button onClick={toggleSidebar}>
        <PanelLeft size={32} />
      </button>

      <nav className="sidebar-nav">
        <NavLink to="/dragndrop" title="Drag & Drop">
          <Move size={20} />
          {isExpanded ? <span> Drag & Drop </span>: null}
        </NavLink>

        <NavLink to="/workspace" title="Workspace">
          <LayoutGrid size={20} />
          {isExpanded && <span> Workspace </span>}
        </NavLink>

        <NavLink to="/card">
          <PanelsTopLeft size={20} />
          {isExpanded && <span> Card </span>}
        </NavLink>
      </nav>
    </aside>
  );
}

export default Sidebar;
