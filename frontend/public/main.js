const API_BASE_URL = "http://144.24.69.30:5000"

let calendar;

document.addEventListener('DOMContentLoaded', function () {
    const selectedTags = []; // 선택된 태그 초기화

    const calendarPage = document.getElementById('calendar-page');
    const managerPage = document.getElementById('manager-page');
    const navCalendar = document.getElementById('nav-calendar');
    const navManager = document.getElementById('nav-manager');

    // 페이지 전환 함수
    function showPage(page) {
        if (page === 'calendar') {
            calendarPage.style.display = 'block';
            managerPage.style.display = 'none';
        } else if (page === 'manager') {
            calendarPage.style.display = 'none';
            managerPage.style.display = 'block';
        }
    }

    // 네비게이션 버튼 클릭 이벤트
    navCalendar.addEventListener('click', () => showPage('calendar'));
    navManager.addEventListener('click', () => showPage('manager'));

    // 기본 페이지는 캘린더
    showPage('calendar');

    calendar = new FullCalendar.Calendar(document.getElementById('calendar'), {
        initialView: 'dayGridMonth',
        selectable: true,
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

    loadTagManager();
    loadTagsForManager();
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

function loadTagManager() {
    fetch(`${API_BASE_URL}/api/events/tags`)
        .then(response => response.json())
        .then(tags => {
            const tagList = document.getElementById('tagList');
            tagList.innerHTML = ''; // 기존 태그 제거
            tags.forEach(tag => {
                const li = document.createElement('li');
                li.textContent = tag.name;
                tagList.appendChild(li);
            });
        })
        .catch(error => console.error('태그 로드 실패:', error));
}

// 태그 추가
function addTag(name) {
    console.log('Adding tag:', name);
    if (!name || name.trim() === '') {
        alert('태그 이름을 입력하세요.');
        return;
    }

    fetch(`${API_BASE_URL}/api/events/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
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
                tags: event.tags || []
            }));
            
            calendar.addEventSource(formattedFilteredEvents);
            calendar.refetchEvents();
        })
        .catch(error => console.error('이벤트 필터링 실패:', error));
        
}


// 태그 관리용 태그 로드
function loadTagsForManager() {
    fetch(`${API_BASE_URL}/api/events/tags`, { method: 'GET' })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(tags => {
            const tagList = document.getElementById('tagList');
            tagList.innerHTML = ''; // 기존 태그 목록 초기화

            tags.forEach(tag => {
                const container = document.createElement('div');
                container.style.display = 'flex';
                container.style.alignItems = 'center';
                container.style.marginBottom = '8px';

                // Checkbox 생성
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.value = tag.name;
                checkbox.id = `tag-${tag.id}`;
                checkbox.name = 'tags';

                // Label 생성
                const label = document.createElement('label');
                label.htmlFor = `tag-${tag.id}`;
                label.textContent = tag.name;
                label.style.marginLeft = '10px';

                // 삭제 버튼 생성
                const deleteButton = document.createElement('button');
                deleteButton.textContent = '삭제';
                deleteButton.style.marginLeft = 'auto';
                deleteButton.style.backgroundColor = '#ff4d4d';
                deleteButton.style.color = '#fff';
                deleteButton.style.border = 'none';
                deleteButton.style.padding = '5px 10px';
                deleteButton.style.cursor = 'pointer';
                deleteButton.style.borderRadius = '5px';

                deleteButton.onclick = () => deleteTag(tag.id);

                container.appendChild(checkbox);
                container.appendChild(label);
                container.appendChild(deleteButton);
                tagList.appendChild(container);
            });
        })
        .catch(error => console.error('태그 로드 실패:', error));
}

function deleteTag(tagId) {
    if (!confirm('태그를 삭제하시겠습니까?')) return;

    fetch(`${API_BASE_URL}/api/events/tags/${tagId}`, { method: 'DELETE' })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                alert('태그가 삭제되었습니다.');
                loadTags(); // 태그 목록 갱신
            } else {
                alert('태그 삭제에 실패했습니다.');
            }
        })
        .catch(error => console.error('태그 삭제 중 에러 발생:', error));
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