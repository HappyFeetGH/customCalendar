document.addEventListener('DOMContentLoaded', function () {
    var calendar = new FullCalendar.Calendar(document.getElementById('calendar'), {
        initialView: 'dayGridMonth',
        selectable: true,
        dateClick: function (info) {
            // 클릭한 날짜 기본값 설정
            document.getElementById('event-start').value = info.dateStr + 'T00:00';
            document.getElementById('event-end').value = info.dateStr + 'T01:00';
            document.getElementById('eventModal').style.display = 'block';
        },
        events: async function (info, successCallback, failureCallback) {
            try {
                const response = await fetch('http://localhost:5000/api/events');
                if (!response.ok) {
                    throw new Error('Failed to load events');
                }
                const events = await response.json();
                //console.log('Loaded events:', events);
                successCallback(events);
            } catch (error) {
                console.error('Error loading events:', error);
                failureCallback(error);
            }
        },eventClick: function (info) {
            const eventId = info.event.id;
    
            // 백엔드에서 이벤트 세부 정보 가져오기
            fetch(`http://localhost:5000/api/events/${eventId}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    // 모달에 데이터 채우기
                    document.getElementById('eventTitle').value = data.title;
                    document.getElementById('eventDescription').value = data.description;
                    document.getElementById('eventStart').value = new Date(data.start_datetime).toISOString().slice(0, 16);
                    document.getElementById('eventEnd').value = new Date(data.end_datetime).toISOString().slice(0, 16);
                    document.getElementById('eventTag').value = data.tag_id;
    
                    // 숨겨진 input에 eventId 설정
                    document.getElementById('eventId').value = data.id;
                    document.getElementById('eventTagId').value = data.tag_id;
    
                    // 모달 열기
                    document.getElementById('eventDetailModal').style.display = 'block';
                })
                .catch(err => console.error('이벤트 세부 정보 로드 실패:', err));
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
        const tagName = document.getElementById('event-tag').value;
        const repeat = document.getElementById('event-repeat').value;
        const repeatCount = document.getElementById('repeat-count').value;

        // 서버로 이벤트 데이터 전송
        fetch('http://localhost:5000/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title,
                description,
                start,
                end,
                tag: tagName,
                repeat,
                repeatCount
            })
        }).then(response => {
            console.log('Response status:', response.status);
            return response.json();
          })
          .then(data => {
              if (data.success) {
                  alert('이벤트가 저장되었습니다!');
                  calendar.refetchEvents(); // FullCalendar 새로고침
                  modal.style.display = 'none'; // 모달 닫기
              } else {
                  alert('저장에 실패했습니다.');
                  console.error('Fetch Error:', error);
              }
          });
    });
});

function editEvent() {
    const eventId = document.getElementById('eventId').value;
    const title = document.getElementById('eventTitle').value;
    const description = document.getElementById('eventDescription').value;
    const start = document.getElementById('eventStart').value;
    const end = document.getElementById('eventEnd').value;
    const tag = document.getElementById('eventTag').value;
    const tagId = document.getElementById('eventTagId').value;

    
    const updatedEvent = { title, description, start, end, tag: tagId };

    fetch(`http://localhost:5000/api/events/${eventId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedEvent),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                alert('이벤트가 성공적으로 수정되었습니다.');
                location.reload(); // 페이지 새로고침
            } else {
                alert('이벤트 수정에 실패했습니다.');
            }
        })
        .catch(err => {
            console.error('이벤트 수정 중 에러 발생:', err);
            alert('이벤트 수정 중 에러가 발생했습니다.');
        });
}



function deleteEvent() {
    const eventId = document.getElementById('eventId').value;

    fetch(`http://localhost:5000/api/events/${eventId}`, {
        method: 'DELETE',
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                alert('이벤트가 성공적으로 삭제되었습니다.');
                location.reload(); // 페이지 새로고침
            } else {
                alert('이벤트 삭제에 실패했습니다.');
            }
        })
        .catch(err => {
            console.error('이벤트 삭제 중 에러 발생:', err);
            alert('이벤트 삭제 중 에러가 발생했습니다.');
        });
}



function openEventModal(event) {
    const eventId = event.id; // FullCalendar 이벤트 ID 가져오기

    // 숨겨진 input에 eventId 설정
    const hiddenInput = document.getElementById('eventId');
    hiddenInput.value = eventId;

    // 이벤트 데이터를 모달에 채우기
    document.getElementById('eventTitle').value = event.title;
    document.getElementById('eventDescription').value = event.extendedProps.description || '';
    document.getElementById('eventStart').value = event.start.toISOString().slice(0, 16); // datetime-local 형식
    document.getElementById('eventEnd').value = event.end ? event.end.toISOString().slice(0, 16) : '';
    document.getElementById('eventTag').value = event.extendedProps.tag || '';

    // 모달 열기
    const modal = document.getElementById('eventModal');
    modal.style.display = 'block';
}

function closeEventModal() {
    // 모달 닫기
    const modal = document.getElementById('eventDetailModal');
    modal.style.display = 'none';

    // 수정 불가 상태로 초기화
    document.getElementById('eventTitle').disabled = true;
    document.getElementById('eventDescription').disabled = true;
    document.getElementById('eventStart').disabled = true;
    document.getElementById('eventEnd').disabled = true;
    document.getElementById('eventTag').disabled = true;

    // 버튼 상태 초기화
    document.getElementById('editButton').style.display = 'inline-block';
    document.getElementById('saveButton').style.display = 'none';
}


// 텍스트박스 및 입력 필드를 수정 가능하게 만드는 함수
function enableEditing() {
    // 모든 입력 필드 활성화
    document.getElementById('eventTitle').disabled = false;
    document.getElementById('eventDescription').disabled = false;
    document.getElementById('eventStart').disabled = false;
    document.getElementById('eventEnd').disabled = false;
    document.getElementById('eventTag').disabled = false;

    // 버튼 상태 변경
    document.getElementById('editButton').style.display = 'none';
    document.getElementById('saveButton').style.display = 'inline-block';
}

// 수정된 이벤트를 저장하는 함수
function saveEditedEvent() {
    const eventId = document.getElementById('eventId').value;
    const title = document.getElementById('eventTitle').value;
    const description = document.getElementById('eventDescription').value;
    const start = document.getElementById('eventStart').value;
    const end = document.getElementById('eventEnd').value;
    const tag = document.getElementById('eventTag').value;

    // PUT 요청으로 수정된 데이터를 전송
    fetch(`http://localhost:5000/api/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            title,
            description,
            start,
            end,
            tag,
        }),
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            if (data.success) {
                alert('이벤트가 수정되었습니다!');
                calendar.refetchEvents(); // 캘린더 새로고침
                document.getElementById('eventDetailModal').style.display = 'none'; // 모달 닫기
            } else {
                alert('이벤트 수정에 실패했습니다.');
            }
        })
        .catch((err) => {
            console.error('이벤트 수정 중 에러 발생:', err);
        });
}

