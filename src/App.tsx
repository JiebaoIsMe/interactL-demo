import MainLayout from './layout/MainLayout'
import Workspace from './workspace/Workspace';

import { BrowserRouter, Route, Routes, Navigate } from "react-router";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route
            index
            element={<Navigate to="/workspace" replace />}
          />
          <Route path="/workspace" element={<Workspace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App;
