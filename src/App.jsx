import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"
import { TeamProvider } from './context/TeamContext';

function App() {
  return (
    <TeamProvider>
      <>
        <Pages />
        <Toaster />
      </>
    </TeamProvider>
  )
}

export default App