import React from "react";
import { Routes, Route } from "react-router-dom";
import '@fortawesome/fontawesome-free/css/all.min.css';


// ⬇ Updated imports
import Header from "./components/common/Header";
import Footer from "./components/common/Footer";

import About from "./components/visitor/About";
import Contact from "./components/visitor/contact";
import Events from "./components/visitor/Events";
import Exhibits from "./components/visitor/exhibits";
import Promotional from "./components/visitor/Promotional";
import ScheduleVisit from "./components/visitor/ScheduleVisit";
import DonationPage from "./components/visitor/DonationPage";
import DigitalArchive from "./components/visitor/DigitalArchive";
import GroupMemberForm from "./components/visitor/GroupMemberForm";
import AdditionalVisitorForm from "./components/visitor/AdditionalVisitorForm";
import WalkInVisitorForm from "./components/visitor/WalkInVisitorForm";
import GroupWalkInLeaderForm from "./components/visitor/GroupWalkInLeaderForm";
import GroupWalkInMemberForm from "./components/visitor/GroupWalkInMemberForm";




import LoginForm from "./components/auth/LoginForm";
import SignupForm from "./components/auth/SignupForm";

import AdminDashboard from "./components/admin/AdminDashboard";

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <>
            <Header />
            <About />
            <Promotional />
            <Exhibits />
            <Events />
            <Contact />
            <Footer />
          </>
        }
      />
      <Route path="/schedule" element={<ScheduleVisit />} />
      <Route path="/donate" element={<DonationPage />} />
      <Route path="/archive" element={<DigitalArchive />} />
      <Route path="/group-member/:memberId/:bookingId" element={<GroupMemberForm />} />
      <Route path="/additional-visitor" element={<AdditionalVisitorForm />} />
      <Route path="/walkin-visitor" element={<WalkInVisitorForm />} />
      <Route path="/group-walkin-leader" element={<GroupWalkInLeaderForm />} />
      <Route path="/group-walkin-member" element={<GroupWalkInMemberForm />} />

      
      <Route path="/login" element={<LoginForm />} />
      <Route path="/signup" element={<SignupForm />} />
      <Route path="/admin" element={<AdminDashboard />} />
    </Routes>
  );
}

export default App;
