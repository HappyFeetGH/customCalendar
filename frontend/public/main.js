document.addEventListener('DOMContentLoaded', function () {
    var calendar = new FullCalendar.Calendar(document.getElementById('calendar'), {
        initialView: 'dayGridMonth',
        selectable: true,
        dateClick: function (info) {
            // 클릭한 날짜 기본값 설정
            document.getElementById('event-start').value = info.dateStr + 'T00:00';
            document.getElementById('event-end').value = info.dateStr + 'T01:00';
            document.getElementById('eventModal').style.display = 'block';
        }
    });
    calendar.render();

    // 모달 닫기 버튼
    const modal = document.getElementById('eventModal');
    const closeButton = document.querySelector('.close');
    closeButton.onclick = function () {
        modal.style.display = 'none';
    };

    // 모달 외부 클릭 시 닫기
    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };

    // 폼 제출 이벤트
    document.getElementById('eventForm').addEventListener('submit', function (e) {
        e.preventDefault(); // 기본 동작 막기

        const title = document.getElementById('event-title').value;
        const description = document.getElementById('event-description').value;
        const start = document.getElementById('event-start').value;
        const end = document.getElementById('event-end').value;
        const tag = document.getElementById('event-tag').value;
        const repeat = document.getElementById('event-repeat').value;
        const repeatCount = document.getElementById('repeat-count').value;

        // 서버로 이벤트 데이터 전송
        fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title,
                description,
                start,
                end,
                tag,
                repeat,
                repeatCount
            })
        }).then(response => response.json())
          .then(data => {
              if (data.success) {
                  alert('이벤트가 저장되었습니다!');
                  calendar.refetchEvents(); // FullCalendar 새로고침
                  modal.style.display = 'none'; // 모달 닫기
              } else {
                  alert('저장에 실패했습니다.');
              }
          });
    });
});
