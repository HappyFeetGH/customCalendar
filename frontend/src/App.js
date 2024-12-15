import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import "./App.css";

function App() {
  return (
    <div className="App">
      <h1>Team Calendar</h1>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={[
          { title: "Test Event 1", date: "2024-12-16" },
          { title: "Test Event 2", date: "2024-12-17" },
        ]}
      />
    </div>
  );
}

export default App;
