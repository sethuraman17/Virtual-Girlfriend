import { Route, Routes } from "react-router-dom";
import { MainScreen } from "./pages/MainScreen";
import { InterviewScreen } from "./pages/InterviewScreen";
import { DemoScreen } from "./pages/DemoScreen";

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainScreen />} />
      <Route path="/demo" element={<DemoScreen />} />
      <Route path="/interview" element={<InterviewScreen />} />
    </Routes>
  );
}

export default App;
