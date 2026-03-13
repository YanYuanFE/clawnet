import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import AgentList from "./pages/AgentList";
import AgentDetail from "./pages/AgentDetail";
import SkillBrowser from "./pages/SkillBrowser";
import Transactions from "./pages/Transactions";
import JoinGuide from "./pages/JoinGuide";
import Layout from "./components/Layout";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/agents" element={<AgentList />} />
          <Route path="/agents/:agentId" element={<AgentDetail />} />
          <Route path="/skills" element={<SkillBrowser />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/join" element={<JoinGuide />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
