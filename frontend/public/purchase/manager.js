const API_BASE_URL = "http://144.24.69.30:5000"

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
            } else {
                alert('태그 추가에 실패했습니다.');
            }
        })
        .catch(err => {
            console.error('태그 추가 중 에러 발생:', err);
            alert('태그 추가 중 에러가 발생했습니다.');
        });
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

            tags.sort((a, b) => a.order_index - b.order_index); // ✅ order_index 기준 정렬

            tags.forEach(tag => {
                const li = document.createElement('li');
                li.className = "tag-item";
                li.dataset.id = tag.id;
                li.innerHTML = `
                    <span class="tag-name">${tag.name}</span>
                    <input type="color" value="${tag.color}" class="tag-color-input">
                    <button onclick="updateTag(${tag.id}, '${tag.name}', this.previousElementSibling.value)">수정</button>
                    <button onclick="deleteTag(${tag.id})" class="delete-btn">삭제</button>
                `;
                tagList.appendChild(li);
            });

            // ✅ 드래그 기능 활성화
            enableDragAndDrop();

        })
        .catch(error => console.error('태그 로드 실패:', error));
}

//drag n drop
function enableDragAndDrop() {
    new Sortable(document.getElementById('tagList'), {
        animation: 150,  // 부드러운 이동 효과
        ghostClass: 'dragging', // 드래그 중인 요소 스타일 추가
        onEnd: function (evt) {
            updateTagOrder(); // 순서 변경 시 서버에 업데이트
        }
    });
}

//변경된 순서를 서버에 저장
function updateTagOrder() {
    const tagList = document.querySelectorAll('#tagList .tag-item');
    const updatedTags = [];

    tagList.forEach((li, index) => {
        const tagId = parseInt(li.dataset.id, 10); // ✅ 숫자로 변환
        if (!isNaN(tagId)) {
            updatedTags.push({ id: tagId, order_index: index + 1 });
        } else {
            console.error("🚨 잘못된 ID 값:", li.dataset.id);
        }
    });

    fetch(`${API_BASE_URL}/api/events/tags/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTags)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('✅ 태그 순서가 업데이트되었습니다.');
        } else {
            console.error('태그 순서 업데이트 실패:', data.message);
        }
    })
    .catch(error => console.error('태그 순서 저장 중 오류 발생:', error));
}



function updateTag(tagId, name, color) {
    if (!name || !color) {
        alert('태그 이름과 색상을 모두 입력하세요.');
        return;
    }

    fetch(`${API_BASE_URL}/api/events/tags/${tagId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color }),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('태그 업데이트 실패');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                alert('태그가 성공적으로 업데이트되었습니다!');
                loadTagsForManager(); // 태그 목록을 다시 로드합니다.
            } else {
                alert('태그 업데이트에 실패했습니다.');
            }
        })
        .catch(error => {
            console.error('태그 업데이트 중 오류 발생:', error);
            alert('태그 업데이트 중 오류가 발생했습니다.');
        });
}

// 태그 색상 수정
function updateTagColor(tagId, name, newColor) {
    fetch(`${API_BASE_URL}/api/events/tags/${tagId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color: newColor }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('태그 색상이 수정되었습니다!');
                loadTags();
            } else {
                alert('태그 수정에 실패했습니다.');
            }
        })
        .catch(err => console.error('태그 수정 중 에러 발생:', err));
}


//태그 삭제
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
                loadTagsForManager(); // 태그 목록을 다시 로드합니다.
            } else {
                alert('태그 삭제에 실패했습니다.');
            }
        })
        .catch(error => console.error('태그 삭제 중 에러 발생:', error));
}





//공지 저장
document.getElementById('updateAnnouncementButton').addEventListener('click', function () {
    const newAnnouncement = document.getElementById('announcementInput').value;
  
    fetch(`${API_BASE_URL}/api/events/announcement`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ announcement: newAnnouncement }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          alert('공지 업데이트 성공!');
          //loadAnnouncement(); // 공지를 새로 불러옵니다.
        } else {
          alert('공지 업데이트 실패!');
        }
      })
      .catch((error) => console.error('공지 업데이트 중 오류:', error));
});

// 공지 삭제 버튼 클릭 이벤트
document.getElementById('deleteAnnouncementButton').addEventListener('click', function () {
    if (!confirm('정말로 공지를 삭제하시겠습니까?')) return;

    fetch(`${API_BASE_URL}/api/events/announcement`, {
        method: 'DELETE',
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                alert('공지 삭제 완료!');
                document.getElementById('announcementInput').value = ''; // 텍스트박스 초기화                
            } else {
                alert('공지 삭제 실패!');
            }
        })
        .catch((error) => console.error('공지 삭제 중 오류:', error));
});



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

// 리마인더 메니저
function loadReminderManager() {
    fetch(`${API_BASE_URL}/api/events`)
        .then((response) => response.json())
        .then((events) => {
            const reminderManager = document.getElementById('reminderManager');
            reminderManager.innerHTML = ''; // 기존 목록 초기화

            events.forEach((event) => {
                const container = document.createElement('div');
                container.style.display = 'flex';
                container.style.alignItems = 'center';
                container.style.marginBottom = '10px';

                // 리마인더 체크박스
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = event.reminder_enabled; // 리마인더 상태 반영]
                
                checkbox.id = `reminder-${event.id}`;

                // 이벤트 제목
                const label = document.createElement('label');
                label.htmlFor = `reminder-${event.id}`;
                label.textContent = event.title;
                label.style.marginLeft = '10px';

                container.appendChild(checkbox);
                container.appendChild(label);
                reminderManager.appendChild(container);
            });
        })
        .catch((error) => console.error('리마인더 관리자 로드 실패:', error));
}


// 리마인더 저장 버튼 이벤트
document.getElementById('saveReminderSettings').addEventListener('click', () => {
    const reminders = Array.from(document.querySelectorAll('#reminderManager div')).map((div) => {
        const id = div.querySelector('input[type="checkbox"]').id.split('-')[1]; // 이벤트 ID
        const reminderEnabled = div.querySelector('input[type="checkbox"]').checked; // 체크 상태

        return { id, reminder_enabled: reminderEnabled };
    });

    // 리마인더 설정 업데이트 요청
    Promise.all(
        reminders.map((reminder) =>
            fetch(`${API_BASE_URL}/api/events/reminder/${reminder.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reminder_enabled: reminder.reminder_enabled }),
            })            
        )
    )
        .then(() => {            
            alert('리마인더 설정이 저장되었습니다.');
        })
        .catch((error) => {
            console.error('리마인더 저장 실패:', error);
            alert('리마인더 저장 중 오류가 발생했습니다.');
        });
});

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
                const li = document.createElement('li');

                // 취합 사유 제목 수정 가능하도록 input 필드 추가
                const titleInput = document.createElement('input');
                titleInput.type = 'text';
                titleInput.value = request.title;
                titleInput.classList.add('edit-input');

                // 총액 수정 가능하도록 input 필드 추가
                const amountInput = document.createElement('input');
                amountInput.type = 'number';
                amountInput.value = request.total_amount;
                amountInput.classList.add('edit-input');

                // 🔹 수정 버튼 추가
                const editButton = document.createElement('button');
                editButton.textContent = '수정';
                editButton.classList.add('edit-btn');
                editButton.onclick = () => updateRequest(request.id, titleInput.value, amountInput.value);

                // 🔥 삭제 버튼 추가
                const deleteButton = document.createElement('button');
                deleteButton.textContent = '삭제';
                deleteButton.classList.add('delete-btn');
                deleteButton.onclick = () => deleteRequest(request.id);

                li.appendChild(titleInput);
                li.appendChild(amountInput);
                li.appendChild(editButton);
                li.appendChild(deleteButton);
                requestList.appendChild(li);

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

// 취합 사유 수정기능
function updateRequest(requestId, newTitle, newAmount) {
    if (!newTitle.trim()) return alert("취합 사유를 입력하세요.");
    if (!newAmount || isNaN(newAmount) || newAmount < 0) return alert("올바른 총액을 입력하세요.");

    fetch(`${API_BASE_URL}/api/purchase/requests/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, total_amount: newAmount })
    }).then(() => {
        alert("취합 사유가 수정되었습니다.");
        loadRequests(); // ✅ 변경 사항 반영
    }).catch(error => console.error("취합 사유 수정 실패:", error));
}


// 취합 사유 추가
function addRequest() {
    const title = document.getElementById('requestTitle').value;
    const total_amount = document.getElementById('requestTotalAmount').value;
    if (!title) return alert("취합 사유를 입력하세요.");
    if (!total_amount) return alert("알맞은 금액을 입력하세요.");

    fetch(`${API_BASE_URL}/api/purchase/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, total_amount })
    }).then(() => {
        loadRequests();
        document.getElementById('requestTitle').value = '';
        document.getElementById('requestTotalAmount').value = '';
    });
}

// 취합 사유 삭제
function deleteRequest(requestId) {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    fetch(`${API_BASE_URL}/api/purchase/requests/${requestId}`, {
        method: "DELETE"
    }).then(() => {
        alert("취합 사유가 삭제되었습니다.");
        loadRequests(); // ✅ UI에서 삭제 반영
    }).catch(error => console.error("취합 사유 삭제 실패:", error));
}


// 취합 대상자 불러오기
function loadParticipants(requestId) {
    fetch(`${API_BASE_URL}/api/purchase/participants/${requestId}`)
        .then(response => response.json())
        .then(async (data) => {
            const participantList = document.getElementById('participantList');
            participantList.innerHTML = '';  // 기존 리스트 초기화

            if (data.length === 0) {
                participantList.innerHTML = '<li>등록된 참가자가 없습니다.</li>';
                return;
            }

            let totalUsedAmount = 0;

            for (const participant of data) {
                // 🔥 각 대상자의 총 사용 금액 가져오기
                const totalUsed = await getParticipantTotalUsed(participant.id);
                totalUsedAmount += Number(totalUsed);

                const li = document.createElement('li');
                li.textContent = `${participant.participant_name} - 사용 금액: ${totalUsed.toLocaleString()}원`;

                // 🔥 삭제 버튼 추가
                const deleteButton = document.createElement('button');
                deleteButton.textContent = '삭제';
                deleteButton.classList.add('delete-btn');
                deleteButton.onclick = () => deleteParticipant(participant.id, requestId);

                li.appendChild(deleteButton);
                participantList.appendChild(li);
            }
            // 🔹 취합 사유의 총액 가져오기
            const requestTotalAmount = await getRequestTotalAmount(requestId);
            const remainingAmount = requestTotalAmount - totalUsedAmount;

            // 🔹 마지막 줄에 메타 정보 추가
            const metaInfo = document.createElement('li');
            metaInfo.innerHTML = `
                <strong>취합 사유 총 금액:<rstrong> ${requestTotalAmount.toLocaleString()}원 (${convertToKoreanNumber(requestTotalAmount)})<br>
                <strong>대상자들이 사용한 금액:</strong> ${totalUsedAmount.toLocaleString()}원 (${convertToKoreanNumber(totalUsedAmount)})<br>
                <strong>남은 금액:</strong> ${remainingAmount.toLocaleString()}원 (${convertToKoreanNumber(remainingAmount)})
            `;
            metaInfo.style.fontWeight = "bold";
            metaInfo.style.marginTop = "10px";

            participantList.appendChild(metaInfo);
        })
        .catch(error => console.error('참가자 로드 실패:', error));
}


// 취합 대상자 사용 금액 계산 함수
async function getParticipantTotalUsed(participantId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/purchase/total-used/${participantId}`);
        const data = await response.json();
        return data.total || 0; // 총 사용 금액 반환
    } catch (error) {
        console.error('총 사용 금액 조회 실패:', error);
        return 0;
    }
}

// 취합 사유 총액을 가져오는 함수
async function getRequestTotalAmount(requestId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/purchase/request-total/${requestId}`);
        const data = await response.json();
        return data.total || 0; // 총액 반환
    } catch (error) {
        console.error('취합 사유 총 금액 조회 실패:', error);
        return 0;
    }
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

//한글 금액 변환 함수
function convertToKoreanNumber(num) {
    if (num === 0) return "영원";

    const units = ["", "만", "억", "조"];
    const smallUnits = ["", "십", "백", "천"];
    const koreanNumbers = ["", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"];

    let result = "";
    let unitIndex = 0;

    while (num > 0) {
        let part = num % 10000; // 4자리씩 분할
        let partStr = "";
        let smallUnitIndex = 0;

        while (part > 0) {
            const digit = part % 10;
            if (digit > 0) {
                partStr = koreanNumbers[digit] + smallUnits[smallUnitIndex] + partStr;
            }
            part = Math.floor(part / 10);
            smallUnitIndex++;
        }

        if (partStr) {
            result = partStr + units[unitIndex] + " " + result;
        }

        num = Math.floor(num / 10000);
        unitIndex++;
    }

    return result.trim() + "원";
}

document.addEventListener('DOMContentLoaded', function () {
    loadTagsForManager();
    loadReminderManager();
    loadRequests();
});

document.body.addEventListener("change", function (event) {
    if (event.target.matches("#requestSelect")) {
        const requestId = event.target.value;
        if (requestId) {
            console.log(`📌 취합 사유 변경 감지: ${requestId}`);
            loadParticipants(requestId);            
        }
    }
});
