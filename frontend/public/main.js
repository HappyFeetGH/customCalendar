const API_BASE_URL = "http://localhost:5000"

let calendar;

document.addEventListener('DOMContentLoaded', function () {
    const selectedTags = []; // 선택된 태그 초기화

    const calendarPage = document.getElementById('calendar-page');
    const managerPage = document.getElementById('manager-page');
    const purchasePage = document.getElementById('purchase-page');

    const navCalendar = document.getElementById('nav-calendar');
    const navManager = document.getElementById('nav-manager');
    const navPurchase = document.getElementById('nav-purchase');

    // 네비게이션 버튼 클릭 이벤트
    //navCalendar.addEventListener('click', () => showPage('calendar'));  
    navManager.addEventListener('click', () => window.open("/purchase/manager.html", "_blank"));
    navPurchase.addEventListener('click', () => window.open("/purchase/participants.html", "_blank"));

    // 기본 페이지는 캘린더
    //showPage('calendar');

    calendar = new FullCalendar.Calendar(document.getElementById('calendar'), {
        initialView: 'dayGridMonth',
        selectable: true,
        timeZone: 'Asia/Seoul',
        dateClick: function (info) {
            document.getElementById('event-start').value = info.dateStr + 'T00:00';
            document.getElementById('event-end').value = info.dateStr + 'T01:00';
            document.getElementById('eventModal').style.display = 'block';
        },
        events: async function (info, successCallback, failureCallback) {
            try {
                const response = await fetch(`${API_BASE_URL}/api/events`);
                if (!response.ok) throw new Error('Failed to load events');
                const events = await response.json();
                
                const filteredEvents = selectedTags.length > 0
                    ? events.filter(event => event.tags.some(tag => selectedTags.includes(tag)))
                    : events;
                
                const formattedEvents = filteredEvents.map(event => ({
                    id: event.id.toString(),
                    title: event.title,
                    start: event.start_datetime,
                    end: event.end_datetime,
                    backgroundColor: event.primary_color,
                    tags: event.tags
                }));

                successCallback(formattedEvents);
            } catch (error) {
                console.error('Error loading events:', error);
                failureCallback(error);
            }
        },
        eventClick: function (info) {
            openEventModal(info.event); // 이벤트 상세 보기 모달 열기
        }
    });

    calendar.render();

    // 태그 로드
    loadTags();
    

    // 이벤트 추가 폼 제출 이벤트 리스너
    document.getElementById('eventForm').addEventListener('submit', function (e) {
        e.preventDefault(); // 기본 동작 막기

        const title = document.getElementById('event-title').value;
        const description = document.getElementById('event-description').value;
        const start = document.getElementById('event-start').value;
        const end = document.getElementById('event-end').value;
        const repeat = document.getElementById('event-repeat').value;
        const repeatCount = document.getElementById('repeat-count').value;

        const selectedTags = Array.from(document.querySelectorAll('#eventTags input:checked')).map(cb => cb.value);        

        // 서버로 이벤트 데이터 전송
        fetch(`${API_BASE_URL}/api/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title,
                description,
                start,
                end,
                tags: selectedTags,
                repeat,
                repeatCount
            })
        }).then(response => {
            console.log('Response status:', response.status);
            return response.json();
        }).then(data => {
            if (data.success) {
                alert('이벤트가 저장되었습니다!');
                calendar.refetchEvents(); // FullCalendar 새로고침
                document.getElementById('eventModal').style.display = 'none'; // 모달 닫기
            } else {
                alert('저장에 실패했습니다.');
                console.error('Fetch Error:', error);
            }
        });
    });

    // 모달 닫기 버튼
    document.querySelector('.close').onclick = function () {
        document.getElementById('eventModal').style.display = 'none';
    };

    // 모달 외부 클릭 시 닫기
    window.onclick = function (event) {
        if (event.target === document.getElementById('eventModal')) {
            document.getElementById('eventModal').style.display = 'none';
        }
    };

    loadAnnouncement();

    loadReminders();
    //loadReminderManager();

    //loadManagerPage("purchase/manager", "purchaseManager","purchase/manager");
    //loadManagerPage("purchase/participants", "purchase-page","purchase/participants");
});



function editEvent() {
    const eventId = document.getElementById('eventId').value;
    const title = document.getElementById('eventTitle').value;
    const description = document.getElementById('eventDescription').value;
    const start = document.getElementById('eventStart').value;
    const end = document.getElementById('eventEnd').value;
    
    // 선택된 태그들을 배열로 가져오기
    const selectedTags = Array.from(document.getElementById('eventTags').selectedOptions).map(option => option.value);

    const updatedEvent = { title, description, start, end, tags: selectedTags };

    fetch(`${API_BASE_URL}/api/events/${eventId}`, {
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
            console.log('Update response:', data); // 디버깅용 로그 추가

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

    fetch(`${API_BASE_URL}/api/events/${eventId}`, {
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
    const eventId = event.id;

    // 백엔드에서 이벤트 데이터 가져오기
    fetch(`${API_BASE_URL}/api/events/${eventId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // 이벤트 디테일 모달에 데이터 채우기
            document.getElementById('eventTitle').value = data.title;
            document.getElementById('eventDescription').value = data.description;
            document.getElementById('eventStart').value = new Date(data.start_datetime).toISOString().slice(0, 16);
            document.getElementById('eventEnd').value = new Date(data.end_datetime).toISOString().slice(0, 16);
            document.getElementById('eventId').value = data.id;

            // 태그 체크박스 설정
            const selectedTags = data.tags || []; // 이미 연결된 태그
            loadTags(data.id, selectedTags); // eventId와 selectedTags 전달

            // 모달 열기
            const modal = document.getElementById('eventDetailModal');
            modal.style.display = 'block';
        })
        .catch(err => console.error('이벤트 세부 정보 로드 실패:', err));
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
    document.getElementById('eventTags').disabled = true;

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

    // 태그 체크박스 활성화
    const checkboxes = document.querySelectorAll('#eventTagsDetail input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.disabled = false;
    });

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
    const tag = document.getElementById('eventTags').value;

    const selectedTags = Array.from(document.querySelectorAll('#eventTagsDetail input:checked')).map(cb => cb.value);

    // PUT 요청으로 수정된 데이터를 전송
    fetch(`${API_BASE_URL}/api/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            title,
            description,
            start,
            end,
            tags: selectedTags
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

// 태그 목록 로드
function loadTags(eventId = null, selectedTags = []) {
    fetch(`${API_BASE_URL}/api/events/tags`, {
        method: 'GET'
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(tags => {
            // 이벤트 추가 모달 태그
            const eventTagsAdd = document.getElementById('eventTags');
            if (eventTagsAdd && !eventId) {
                eventTagsAdd.innerHTML = ''; // 기존 체크박스 제거
                tags.forEach(tag => {
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.value = tag.name;
                    checkbox.id = `tag-add-${tag.id}`;
                    checkbox.name = 'tags';

                    const label = document.createElement('label');
                    label.htmlFor = `tag-add-${tag.id}`;
                    label.textContent = tag.name;

                    const container = document.createElement('div');
                    container.appendChild(checkbox);
                    container.appendChild(label);
                    eventTagsAdd.appendChild(container);
                });
            }

            // 이벤트 수정 모달 태그
            const eventTagsDetail = document.getElementById('eventTagsDetail');
            if (eventTagsDetail && eventId) {
                eventTagsDetail.innerHTML = ''; // 기존 체크박스 제거
                tags.forEach(tag => {
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.value = tag.name;
                    checkbox.id = `tag-detail-${tag.id}`;
                    checkbox.name = 'tags';
                    if (selectedTags.includes(tag.id)) {
                        checkbox.checked = true; // 선택된 태그만 체크
                    }

                    const label = document.createElement('label');
                    label.htmlFor = `tag-detail-${tag.id}`;
                    label.textContent = tag.name;

                    const container = document.createElement('div');
                    container.appendChild(checkbox);
                    container.appendChild(label);
                    eventTagsDetail.appendChild(container);
                });
            }

            // 태그 필터링 체크박스 추가
            const tagFilter = document.getElementById('tagFilter');
            if (tagFilter) {
                tagFilter.innerHTML = ''; // 기존 체크박스 제거
                tags.forEach(tag => {
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.value = tag.name;
                    checkbox.id = `tag-filter-${tag.id}`;
                    checkbox.name = 'filter-tags';
                    checkbox.addEventListener('change', filterEventsByTags); // 필터링 이벤트 추가

                    const label = document.createElement('label');
                    label.htmlFor = `tag-filter-${tag.id}`;
                    label.textContent = tag.name;

                    const container = document.createElement('div');
                    container.appendChild(checkbox);
                    container.appendChild(label);
                    tagFilter.appendChild(container);
                });
            }
        })
        .catch(error => console.error('태그 로드 실패:', error));
}

// 태그 추가
function addTag(name, color) {    
    if (!name || name.trim() === '') {
        alert('태그 이름을 입력하세요.');
        return;
    }

    fetch(`${API_BASE_URL}/api/events/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color }),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                alert('태그가 추가되었습니다!');
                loadTags(); // 태그 목록을 다시 불러옵니다.
            } else {
                alert('태그 추가에 실패했습니다.');
            }
        })
        .catch(err => {
            console.error('태그 추가 중 에러 발생:', err);
            alert('태그 추가 중 에러가 발생했습니다.');
        });
}



function filterEventsByTags() {
    const selectedTags = Array.from(document.querySelectorAll('#tagFilter input[type="checkbox"]:checked'))
        .map(checkbox => checkbox.value);
    
    // 기존 이벤트 소스 제거
    const currentEventSources = calendar.getEventSources();
    currentEventSources.forEach(source => source.remove());

    
    // 새로운 이벤트 필터링
    fetch(`${API_BASE_URL}/api/events`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(events => {
            // 필터링 로직
            const filteredEvents = events.filter(event => {
                const eventTags = event.tags || []; // 태그가 없는 경우 빈 배열 처리
                return selectedTags.length === 0 || eventTags.some(tag => selectedTags.includes(tag));
            });

            // FullCalendar 형식으로 변환
            const formattedFilteredEvents = filteredEvents.map(event => ({
                id: event.id.toString(),
                title: event.title,
                start: new Date(event.start_datetime).toISOString(),
                end: new Date(event.end_datetime).toISOString(),
                backgroundColor: event.primary_color,
                tags: event.tags || []
            }));
            
            calendar.addEventSource(formattedFilteredEvents);
            calendar.refetchEvents();
        })
        .catch(error => console.error('이벤트 필터링 실패:', error));
        
}


document.getElementById('searchButton').addEventListener('click', function () {
    const query = document.getElementById('searchInput').value.trim();
    const selectedTags = Array.from(document.querySelectorAll('#tagFilter input[type="checkbox"]:checked'))
    .map(checkbox => checkbox.value);

    fetch(`${API_BASE_URL}/api/events`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(events => {
            // 필터링 로직
            const filteredEvents = events.filter(event => {
                const matchesQuery = query ? event.title.includes(query) || event.description.includes(query) : true;
                const matchesTags = selectedTags.length > 0
                    ? event.tags.some(tag => selectedTags.includes(tag))
                    : true;

                return matchesQuery && matchesTags;
            });

            // FullCalendar 형식으로 변환
            const formattedEvents = filteredEvents.map(event => ({
                id: event.id.toString(),
                title: event.title,
                start: new Date(event.start_datetime).toISOString(),
                end: new Date(event.end_datetime).toISOString(),
                backgroundColor: event.primary_color,
                tags: event.tags || []
            }));

            // 기존 이벤트 제거 및 필터링된 이벤트 추가
            calendar.getEvents().forEach(event => event.remove());
            calendar.addEventSource(formattedEvents);
            calendar.refetchEvents();
        })
        .catch(error => console.error('이벤트 필터링 실패:', error));
});

document.getElementById('resetButton').addEventListener('click', function () {
    document.getElementById('searchInput').value = ''; // 검색어 초기화
    //calendar.refetchEvents(); // 모든 이벤트 다시 로드
    filterEventsByTags(); // 태그 필터 유지하며 다시 로드
});




// 공지 로드
function loadAnnouncement() {
    fetch(`${API_BASE_URL}/api/events/announcement`)
      .then((response) => response.json())
      .then((data) => {
        const announcementDisplay = document.getElementById('announcementDisplay');
        announcementDisplay.innerHTML = renderMarkdown(data.announcement || '공지 사항이 없습니다.');
      })
      .catch((error) => console.error('공지 불러오기 실패:', error));
}


// 마크다운 변환함수
function renderMarkdown(markdown) {
    if (!markdown) return '';
    return markdown
      .replace(/# (.*?)(\n|$)/g, '<h1>$1</h1>')
      .replace(/## (.*?)(\n|$)/g, '<h2>$1</h2>')
      .replace(/### (.*?)(\n|$)/g, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
      .replace(/\*(.*?)\*/g, '<i>$1</i>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
}

//리마인더 로드
function loadReminders() {
    fetch(`${API_BASE_URL}/api/events/reminders`)
        .then((response) => response.json())
        .then((reminders) => {
            const today = new Date();

            reminders.forEach((reminder) => {
                const startDate = new Date(reminder.start_datetime);
                console.log(startDate);
                const daysDifference = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));

                displayReminder(reminder, daysDifference-1);
            });
        })
        .catch((error) => console.error('리마인더 로드 실패:', error));
}

// 리마인더 표시
function displayReminder(reminder, daysDifference) {
    const message =
        daysDifference === 0
            ? `오늘`
            : daysDifference > 0
            ? `${daysDifference}일 후`
            : `${Math.abs(daysDifference)}일 전`;

    const reminderCard = document.createElement('div');
    reminderCard.className = 'reminder-card';
    reminderCard.innerHTML = `
        <p><strong>${reminder.title}</strong></p>
        <p>${message}</p>
        <button class="close-reminder">X</button>
    `;

    reminderCard.querySelector('.close-reminder').addEventListener('click', () => {
        reminderCard.remove();
    });

    document.body.appendChild(reminderCard);
}

/* 고정 이벤트 조정*/

let fixedEventSource = null; // 고정 이벤트 소스
let isFixedEventsActive = false; // 고정 이벤트 활성화 상태


let fixedEvents = {
    monday: ['6반 체육 2교시', '4반 체육 1교시'],
    tuesday: [],
    wednesday: ['4반 과학 1교시'],
    thursday: ['4반 과학 3교시', '4반 과학 4교시'],
    friday: [],
    saturday: [],
    sunday: []
};

function generateFixedEvents(startDate, endDate) {
    const events = [];
    const currentDate = new Date(startDate);
  
    while (currentDate <= new Date(endDate)) {
      const day = currentDate.getDay(); // 요일 (0: 일요일, 1: 월요일, ...)
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const eventTitles = fixedEvents[dayNames[day]]; // 해당 요일의 이벤트 배열 가져오기
  
      if (eventTitles && eventTitles.length > 0) {
        eventTitles.forEach(title => {
          events.push({
            title,
            start: new Date(currentDate).toISOString(),
            allDay: true,
            backgroundColor: '#FFD700', // 이벤트 색상 설정
            borderColor: '#FFAA00',     // 테두리 색상
          });
        });
      }
  
      currentDate.setDate(currentDate.getDate() + 1); // 다음 날로 이동
    }
  
    return events;
}


//토글형 학급별 시간표
function toggleFixedEvents() {
    const toggle = document.getElementById('toggleFixedEvents').checked;
    const startDate = document.getElementById('fixedStartDate').value;
    const endDate = document.getElementById('fixedEndDate').value;
  
    if (!startDate || !endDate) {
      alert('시작일과 종료일을 입력하세요.');
      document.getElementById('toggleFixedEvents').checked = false;
      return;
    }
  
 
    if (toggle) {
      const fixed = generateFixedEvents(startDate, endDate);
      fixedEventSource = calendar.addEventSource(fixed);
      isFixedEventsActive = true;
      alert('고정 이벤트가 활성화되었습니다.');
    } else {
      if (fixedEventSource) {
        fixedEventSource.remove(); // 기존 이벤트 소스 제거
      }
      isFixedEventsActive = false;
      alert('고정 이벤트가 비활성화되었습니다.');
    }
}



/*
function loadManagerPage(pagename, divname,jsname=""){
    fetch(`${pagename}.html`)  // AJAX 요청
    .then(response => {
        if (!response.ok) throw new Error('페이지 로드 실패');
        return response.text();
    })
    .then(html => {
        document.getElementById(divname).innerHTML = html;

        // 추가적으로 필요한 스크립트 실행
        const script = document.createElement('script');
        script.src = `${jsname}.js`; // 매니저 페이지의 전용 스크립트
        document.body.appendChild(script);
    })
    .catch(error => console.error('Error loading manager page:', error));
}

*/