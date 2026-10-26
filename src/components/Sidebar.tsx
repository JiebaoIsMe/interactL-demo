
import { useState } from "react";
import { NavLink } from "react-router";
import {
  PanelLeft,
  Move,
  LayoutGrid,
  PanelsTopLeft,
} from "lucide-react";

function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <aside
      className={`sidebar ${isExpanded ? "expanded" : "collapsed"}`}
      aria-label="Main sidebar"
    >
      <button
        type="button"
        className="sidebar-toggle"
        onClick={() => setIsExpanded((previous) => !previous)}
        aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
        aria-expanded={isExpanded}
        title={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
      >
        <PanelLeft size={22} aria-hidden="true" />
      </button>

      <nav className="sidebar-nav" aria-label="Main navigation">
        <NavLink
          to="/workspace"
          end
          title="Workspace"
          aria-label="Workspace"
          className={({ isActive }) =>
            `sidebar-item ${isActive ? "active" : ""}`
          }
        >
          <LayoutGrid size={20} aria-hidden="true" />
          {isExpanded && <span>Workspace</span>}
        </NavLink>

        <button
          type="button"
          className="sidebar-item"
          title="Drag & Drop — Coming soon"
          aria-label="Drag & Drop — Coming soon"
          disabled
        >
          <Move size={20} aria-hidden="true" />
          {isExpanded && <span>Drag & Drop</span>}
        </button>

        <button
          type="button"
          className="sidebar-item"
          title="Card — Coming soon"
          aria-label="Card — Coming soon"
          disabled
        >
          <PanelsTopLeft size={20} aria-hidden="true" />
          {isExpanded && <span>Card</span>}
        </button>
      </nav>
    </aside>
  );
}

export default Sidebar;
