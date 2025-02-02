// 취합 사유 불러오기
function loadRequests() {
    fetch(`${API_BASE_URL}/api/purchase/requests`)
        .then(response => response.json())
        .then(data => {
            const requestList = document.getElementById('requestList');
            const requestSelect = document.getElementById('requestSelect');

            if (!requestSelect) {
                console.error("⚠ 'requestSelect' 요소를 찾을 수 없습니다.");
                return;
            }

            requestList.innerHTML = '';

            if (data.length === 0) {
                console.warn("⚠ 취합 요청이 없습니다.");
                return;
            }

            requestSelect.innerHTML = '';

            data.forEach((request, index) => {
                const option = document.createElement('option');
                option.value = request.id;
                option.textContent = request.title;
                requestSelect.appendChild(option);
            });

            if (requestSelect.options.length > 0) {
                console.log("📌 첫 번째 항목 자동 선택:", requestSelect.options[0].value);
                loadParticipants(parseInt(requestSelect.options[0].value, 10));
            }
        }).catch(error => console.error('취합 요청 목록 로드 실패:', error));
}

// 취합 사유 추가
function addRequest() {
    const title = document.getElementById('requestTitle').value;
    if (!title) return alert("취합 사유를 입력하세요.");

    fetch(`${API_BASE_URL}/api/purchase/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title })
    }).then(() => {
        loadRequests();
        document.getElementById('requestTitle').value = '';
    });
}

// 취합 사유 삭제
function deleteRequest(id) {
    fetch(`${API_BASE_URL}/api/purchase/requests/${id}`, { method: "DELETE" })
        .then(() => loadRequests());
}

// 취합 대상자 불러오기
function loadParticipants(requestId) {
    fetch(`${API_BASE_URL}/api/purchase/participants/${requestId}`)
        .then(response => response.json())
        .then(data => {
            const participantList = document.getElementById('participantList');
            participantList.innerHTML = '';  // 기존 리스트 초기화

            if (data.length === 0) {
                participantList.innerHTML = '<li>등록된 참가자가 없습니다.</li>';
                return;
            }

            data.forEach(participant => {
                const li = document.createElement('li');
                li.textContent = participant.participant_name;

                // 🔥 삭제 버튼 추가
                const deleteButton = document.createElement('button');
                deleteButton.textContent = '삭제';
                deleteButton.classList.add('delete-btn');
                deleteButton.onclick = () => deleteParticipant(participant.id, requestId);

                li.appendChild(deleteButton);
                participantList.appendChild(li);
            });
        })
        .catch(error => console.error('참가자 로드 실패:', error));
}

// 취합 대상자 추가
function addParticipant() {
    const requestId = Number(document.getElementById('requestSelect').value);
    const name = document.getElementById('participantName').value;
    if (!name) return alert("대상자를 입력하세요.");
    
    fetch(`${API_BASE_URL}/api/purchase/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_id: requestId, participant_name:name })
    }).then(() => {
        loadParticipants(requestId);
        document.getElementById('participantName').value = '';
    });
}

// 취합 대상자 삭제
function deleteParticipant(id) {
    
    fetch(`${API_BASE_URL}/api/purchase/participants/${id}`, { method: "DELETE" })
        .then(() => loadRequests());
}

// 초기 로드
loadRequests();

function setupEventListeners() {
    //console.log("📌 setupEventListeners 실행됨!");
    
    const requestSelect = document.getElementById('requestSelect');

    if (!requestSelect) {
        console.error("⚠ 'requestSelect' 요소를 찾을 수 없습니다. AJAX로 로드되는 페이지인지 확인하세요.");
        return;
    }
    
    // 🔥 페이지 로드 시 첫 번째 항목 자동 선택 및 참가자 불러오기
    if (requestSelect.options.length > 0) {
        const firstRequestId = parseInt(requestSelect.options[0].value, 10);
        if (!isNaN(firstRequestId)) {
            //console.log("📌 첫 번째 항목 자동 선택:", firstRequestId);
            loadParticipants(firstRequestId);
        }
    }

    requestSelect.addEventListener('change', function (event) {        
        const requestId = parseInt(this.value, 10);
        if (!isNaN(requestId)) {
            //console.log("📌 'loadParticipants' 함수 호출!");
            loadParticipants(requestId);
        } else {
            console.warn("⚠ 유효하지 않은 requestId:", this.value);
        }
    });
}

// 즉시 실행 (AJAX 환경 고려)
setupEventListeners();

// AJAX로 페이지 로드 후에도 실행
document.addEventListener('DOMContentLoaded', setupEventListeners);
