
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ChannelPartner from "./pages/ChannelPartner";
import CPOutgoing from "./pages/CPOutgoing";
import PrivateRoute from "./routes/PrivateRoute";
import CallToBroker from "./callToBroker/CallToBroker.jsx";
import Followup from "./followUp/Followup.jsx";
import Meetings from "./Meetings/Meetings.jsx";
import MeetingsOverview from "./Meetings/MeetingsOverview.jsx";
import FullKittingPage from "./Meetings/FullKitting.jsx";
import AgreementPage from "./Meetings/Agreement.jsx";
import NewProjectProcess from "./pages/NewProjectProcess";
import NBD_IN from "./Nbd/step-1followup.jsx";
import NbdIn from "./pages/NbdIn.jsx";
import FieldVisit from "./Nbd/FieldVisit.jsx";
import AfterFieldVisitFollowUp from "./Nbd/AfterFieldVisitFollowUp.jsx";
import MeetingNbd from "./Nbd/MeetingNbd.jsx";
import CP_Page from "./pages/cp_Page.jsx";
import CPLeadForm from "./cpNbd/CPLeadForm.jsx";
import MainPage from "./cpNbd/CPCanContact/MainPage.jsx";
import CpMainPage from "./cpNbd/CPCannotContact/CpMainPage.jsx";
import CPCanContactFollowup from "./cpNbd/CPCanContact/StepOne.jsx";
import CPFieldVisitCanContact from "./cpNbd/CPCanContact/StepTwo.jsx";
import CPAfterFieldVisitFollowUp from "./cpNbd/CPCanContact/StepThree.jsx";
import CPMeetingCanContact from "./cpNbd/CPCanContact/StepFour.jsx";
import CPCannotContactFollowup from "./cpNbd/CPCannotContact/CpStepOne.jsx";
import CPFieldVisitCannotContact from "./cpNbd/CPCannotContact/CpStepTwo.jsx";
import CPCannotContactAfterFV from "./cpNbd/CPCannotContact/CpStepThree.jsx";
import CPMeetingCannotContact from "./cpNbd/CPCannotContact/CpStepFour.jsx";
import FSRPage from "./pages/FSRPage.jsx";
import CNPLeads from "./Nbd/CNPLeads.jsx";
import BirthdayPopup from "./components/BirthdayPopup";
import CrrFollowup from "./pages/CrrFollowup";

function App() {
  const { user } = useAuth();

  return (
    <>
      <Routes>
        {/* ============================================ */}
        {/* PUBLIC ROUTE - Login */}
        {/* ============================================ */}
        <Route
          path="/"
          element={user ? <Navigate to="/dashboard" replace /> : <Login />}
        />

        {/* ============================================ */}
        {/* PROTECTED - Dashboard (All users) */}
        {/* ============================================ */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        {/* ============================================ */}
        {/* NBD IN ROUTES - Only BDM1 (nbd) + Admin */}
        {/* ============================================ */}
        <Route
          path="/nbd-in"
          element={
            <PrivateRoute requiredModule="nbd">
              <NbdIn />
            </PrivateRoute>
          }
        />
        <Route
          path="/nbd-in/NBD_IN"
          element={
            <PrivateRoute requiredModule="nbd">
              <NBD_IN />
            </PrivateRoute>
          }
        />
        <Route
          path="/nbd-in/field-visit"
          element={
            <PrivateRoute requiredModule="nbd">
              <FieldVisit />
            </PrivateRoute>
          }
        />
        <Route
          path="/nbd-in/followup"
          element={
            <PrivateRoute requiredModule="nbd">
              <AfterFieldVisitFollowUp />
            </PrivateRoute>
          }
        />
        <Route
          path="/nbd-in/meeting"
          element={
            <PrivateRoute requiredModule="nbd">
              <MeetingNbd />
            </PrivateRoute>
          }
        />
        <Route
          path="/nbd-in/cnp"
          element={
            <PrivateRoute requiredModule="nbd">
              <CNPLeads />
            </PrivateRoute>
          }
        />

        {/* ============================================ */}
        {/* CP NBD ROUTES - Only BDM2 (cp) + Admin */}
        {/* ============================================ */}
        <Route
          path="/cp"
          element={
            <PrivateRoute requiredModule="cp">
              <CP_Page />
            </PrivateRoute>
          }
        />
        <Route
          path="/cp/lead-form"
          element={
            <PrivateRoute requiredModule="cp">
              <CPLeadForm />
            </PrivateRoute>
          }
        />
        <Route
          path="/cp/can-contact"
          element={
            <PrivateRoute requiredModule="cp">
              <MainPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/cp/cannot-contact"
          element={
            <PrivateRoute requiredModule="cp">
              <CpMainPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/cp/can-contact/follow-up"
          element={
            <PrivateRoute requiredModule="cp">
              <CPCanContactFollowup />
            </PrivateRoute>
          }
        />
        <Route
          path="/cp/can-contact/field-visit"
          element={
            <PrivateRoute requiredModule="cp">
              <CPFieldVisitCanContact />
            </PrivateRoute>
          }
        />
        <Route
          path="/cp/can-contact/after-field-visit"
          element={
            <PrivateRoute requiredModule="cp">
              <CPAfterFieldVisitFollowUp />
            </PrivateRoute>
          }
        />
        <Route
          path="/cp/can-contact/meetings"
          element={
            <PrivateRoute requiredModule="cp">
              <CPMeetingCanContact />
            </PrivateRoute>
          }
        />
        <Route
          path="/cp/cannot-contact/follow-up"
          element={
            <PrivateRoute requiredModule="cp">
              <CPCannotContactFollowup />
            </PrivateRoute>
          }
        />
        <Route
          path="/cp/cannot-contact/field-visit"
          element={
            <PrivateRoute requiredModule="cp">
              <CPFieldVisitCannotContact />
            </PrivateRoute>
          }
        />
        <Route
          path="/cp/cannot-contact/after-field-visit"
          element={
            <PrivateRoute requiredModule="cp">
              <CPCannotContactAfterFV />
            </PrivateRoute>
          }
        />
        <Route
          path="/cp/cannot-contact/meetings"
          element={
            <PrivateRoute requiredModule="cp">
              <CPMeetingCannotContact />
            </PrivateRoute>
          }
        />

        {/* ============================================ */}
        {/* CHANNEL PARTNER ROUTES */}
        {/* ============================================ */}
        <Route
          path="/channel-partner"
          element={
            <PrivateRoute>
              <ChannelPartner />
            </PrivateRoute>
          }
        />
        <Route
          path="/channel-partner/cp-outgoing"
          element={
            <PrivateRoute>
              <CPOutgoing />
            </PrivateRoute>
          }
        />

        <Route
  path="/channel-partner/crr-followup"
  element={
    <PrivateRoute>
      <CrrFollowup />
    </PrivateRoute>
  }
/>

        {/* ============================================ */}
        {/* PROCESS ROUTES */}
        {/* ============================================ */}
        <Route
          path="/process/call-to-broker"
          element={
            <PrivateRoute>
              <CallToBroker />
            </PrivateRoute>
          }
        />
        <Route
          path="/process/meetings/overview"
          element={
            <PrivateRoute>
              <MeetingsOverview />
            </PrivateRoute>
          }
        />
        <Route
          path="/process/meetings/Meetings"
          element={
            <PrivateRoute>
              <Meetings />
            </PrivateRoute>
          }
        />
        <Route
          path="/process/meetings/agreement"
          element={
            <PrivateRoute>
              <AgreementPage />
            </PrivateRoute>
          }
        />

        {/* ============================================ */}
        {/* NEW PROJECT DEVELOPMENT */}
        {/* ============================================ */}
        <Route
          path="/new-project-development"
          element={
            <PrivateRoute>
              <NewProjectProcess />
            </PrivateRoute>
          }
        />

        {/* ============================================ */}
        {/* FSR ROUTES */}
        {/* ============================================ */}
        <Route
          path="/fsr"
          element={
            <PrivateRoute requiredModule="fsr">
              <FSRPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/fsr/field-visit"
          element={
            <PrivateRoute requiredModule="fsr">
              <FieldVisit />
            </PrivateRoute>
          }
        />
        <Route
          path="/fsr/followup"
          element={
            <PrivateRoute requiredModule="fsr">
              <AfterFieldVisitFollowUp />
            </PrivateRoute>
          }
        />
        <Route
          path="/fsr/meeting"
          element={
            <PrivateRoute requiredModule="fsr">
              <MeetingNbd />
            </PrivateRoute>
          }
        />



        {/* ============================================ */}
        {/* CATCH ALL - Redirect to Dashboard */}
        {/* ============================================ */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      {/* ✅ Birthday Popup - OUTSIDE Routes, shows globally */}
      <BirthdayPopup />
    </>
  );
}

export default App;