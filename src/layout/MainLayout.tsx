import { Outlet } from "react-router";
import Sidebar from "../components/Sidebar";

function MainLayout() {
  return (
    <div className="mainlayout">
      <Sidebar />

      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout;
