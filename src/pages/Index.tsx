import { useState } from "react";
import FontInjector from "../racing/FontInjector";
import NavBar from "../racing/NavBar";
import { C } from "../racing/tokens";
import HomePage from "./HomePage";
import UploadLapPage from "./UploadLapPage";
import LiveModePage from "./LiveModePage";
import LapHistoryPage from "./LapHistoryPage";
import AnalysisPage from "./AnalysisPage";
import DriverProfilePage from "./DriverProfilePage";

const Index = () => {
  const [page, setPage] = useState("home");
  const [context, setContext] = useState<Record<string, unknown>>({});

  const navigate = (to: string, ctx: Record<string, unknown> = {}) => {
    setContext(ctx);
    setPage(to);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <FontInjector />
      <div style={{ fontFamily: "'Outfit', sans-serif", background: C.bg, minHeight: "100vh", color: C.text }}>
        <NavBar current={page} navigate={navigate} />
        {page === "home" && <HomePage navigate={navigate} />}
        {page === "upload" && <UploadLapPage navigate={navigate} />}
        {page === "live" && <LiveModePage navigate={navigate} />}
        {page === "history" && <LapHistoryPage navigate={navigate} />}
        {page === "analysis" && <AnalysisPage navigate={navigate} context={context} />}
        {page === "profile" && <DriverProfilePage navigate={navigate} />}
      </div>
    </>
  );
};

export default Index;
