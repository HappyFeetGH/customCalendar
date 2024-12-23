document.addEventListener('DOMContentLoaded', function () {
    const calendarEl = document.getElementById('calendar');
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        events: [
            {
                title: 'Event 1',
                start: '2024-12-25',
                end: '2024-12-26'
            },
            {
                title: 'Event 2',
                start: '2024-12-27'
            }
        ]
    });
    calendar.render();
});
