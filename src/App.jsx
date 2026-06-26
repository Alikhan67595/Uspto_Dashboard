import { Route, Routes } from 'react-router-dom'
import Layout from './Layout.jsx'
import OverView from './Components/OverView.jsx'

import DeadAbandoned from './Components/DeadAbandoned.jsx'
import DeadAbanValid from './Components/DeadAbanValid.jsx'
import DeadAbanMissing from './Components/DeadAbanMissing.jsx'

import DeadCancelled from './Components/DeadCancelled.jsx'
import DeadCancellValid from './Components/DeadCancellValid.jsx'
import DeadCancellMissing from './Components/DeadCancellMissing.jsx'

import LivePending from './Components/LivePending.jsx'
import LivePenValid from './Components/LivePenValid.jsx'
import LivePenMissing from './Components/LivePenMissing.jsx'

import LiveRegister from './Components/LiveRegister.jsx'
import LiveRegValid from './Components/LiveRegValid.jsx'
import LiveRegMissing from './Components/LiveRegMissing.jsx'

function App() {
  return (
    <Routes>
      {/* Layout = Sidebar + global styles + <Outlet/>, Dashboard.jsx jaisa hi look */}
      <Route path="/" element={<Layout />}>
        <Route index element={<OverView />} />

        <Route path="deadabandoned" element={<DeadAbandoned />}>
          <Route index element={<DeadAbanValid />} />
          <Route path="missing" element={<DeadAbanMissing />} />
        </Route>

        <Route path="deadcancelled" element={<DeadCancelled />}>
          <Route index element={<DeadCancellValid />} />
          <Route path="missing" element={<DeadCancellMissing />} />
        </Route>

        <Route path="livepending" element={<LivePending />}>
          <Route index element={<LivePenValid />} />
          <Route path="missing" element={<LivePenMissing />} />
        </Route>

        <Route path="liveregister" element={<LiveRegister />}>
          <Route index element={<LiveRegValid />} />
          <Route path="missing" element={<LiveRegMissing />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
