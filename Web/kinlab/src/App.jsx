import Login from './pages/Login';
import DashboardLayout from './components/DashboardLayout';
import InventaryPage from './pages/InventaryPage';
import LoansPages from './pages/LoansPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { Routes, Route } from 'react-router-dom';
import RecordPage from './pages/RecordPage';
import IncidentesPage from './pages/IncidentsPage';
import HomePage from './pages/HomePage';
import Equipments from './components/inventary/Equipments';
import Components from './components/inventary/Components';
import LoansComponent from './components/loans_request/LoansComponent';
import LoansEquipment from './components/loans_request/LoansEquipment';
import AreasPage from './pages/AreasPage';
import ReturnStatusPage from './pages/ReturnStatusPage';// area para la revision del estado de los préstamos
import UsersPage from './pages/UsersPage';
import DevPage from './components/dev_in/DevPage';

function App() {
  return (
    
      <Routes>

        <Route path='/' element={<Login/>}/>
        <Route path='/dev' element={<DevPage/>} />

        {/*//Rutas proegidas*/}
        <Route path = '/home' element = {
          <ProtectedRoute>
            <DashboardLayout/>
          </ProtectedRoute>
          }>

        <Route index element={<HomePage />} />
        <Route path='Cards' element={<HomePage/>} />

        <Route path='areas'>
          <Route index element={<AreasPage/>} />
        </Route>

        <Route path='users'>
          <Route index element={<UsersPage/>} />
        </Route>

        <Route path='inventary'>
          <Route index element={<InventaryPage/>} />
          <Route path='equipment' element={<Equipments/>} />
          <Route path='component' element={<Components/>} />
        </Route>

        <Route path='loans'>
         <Route index element={<LoansPages/>}/> 
         <Route path='loansEquipment' element={<LoansEquipment/>}/>
         <Route path='loansComponent' element={<LoansComponent/>} />
         <Route path='loansStatus' element={<ReturnStatusPage/>} />
        </Route>

        <Route path='reports'>
          <Route index element={<RecordPage />} /> 
          <Route path='record' element={<RecordPage/>} />
          <Route path='incidents' element={<IncidentesPage/>} />
        </Route>
      </Route>

      </Routes>
   
  );
}

export default App;