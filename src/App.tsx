import MainLayout from './layout/MainLayout'
import Workspace from './workspace/Workspace';

import { BrowserRouter, Route, Routes } from "react-router";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={ <MainLayout/>}>
          <Route path="/workspace" element={<Workspace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
