import { Provider } from "react-redux";
import { store } from "./store/store";
import Navbar from "./components/layout/Navbar";
import GenerationPage from "./pages/GenerationPage";

export default function App() {
  return (
    <Provider store={store}>
      <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-200 font-sans transition-colors duration-300">
        <Navbar />
        <GenerationPage />
      </div>
    </Provider>
  );
}
