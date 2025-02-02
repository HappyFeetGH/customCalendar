
// 🔹 3. 취합 사유 불러오기
function loadRequestsDetail() {
    fetch(`${API_BASE_URL}/api/purchase/requests`)
        .then(response => response.json())
        .then(requests => {
            //console.log("🔹 불러온 취합 사유 목록:", requests);

            const requestSelect = document.getElementById("requestSelectDetail");
            if (!requestSelect) {
                console.error("❌ requestSelect 요소를 찾을 수 없음. AJAX 로딩이 완료되었는지 확인 필요.");
                return;
            }
            
            requestSelect.innerHTML = ""; // 기존 옵션 초기화
            
            if (requests.length === 0) {
                console.warn("⚠️ 불러온 취합 사유가 없습니다.");
                return;
            }

            // 🔹 기본 선택 옵션 추가
            const defaultOption = document.createElement("option");
            defaultOption.value = "";
            defaultOption.textContent = "취합 사유 선택";
            defaultOption.disabled = true;
            defaultOption.selected = true;
            requestSelect.appendChild(defaultOption);

            // 🔹 취합 사유 목록 추가
            requests.forEach(request => {
                const option = document.createElement("option");
                option.value = request.id;
                option.textContent = request.title;
                requestSelect.appendChild(option);
            });

            //console.log("✅ 취합 사유 콤보박스 업데이트 완료:", requestSelect.options.length);
        })
        .catch(error => console.error("❌ 취합 사유 불러오기 실패:", error));

}

loadRequestsDetail(); // 🔥 취합 사유 목록 불러오기


// 🔹 4. 선택된 취합 사유에 맞는 대상자 불러오기
function loadParticipantsCombo(requestId) {
    fetch(`${API_BASE_URL}/api/purchase/participants/${requestId}`)
        .then(response => response.json())
        .then(participants => {
            
            const participantSelect = document.getElementById("participantSelect");
            participantSelect.innerHTML = '<option value="">대상을 선택하세요</option>';
            participantSelect.disabled = false;

            participants.forEach(participant => {
                const option = document.createElement("option");
                option.value = participant.id;
                option.textContent = participant.participant_name;
                participantSelect.appendChild(option);
            });

            // 🔥 첫 번째 대상자가 있다면 자동 선택 후 품목 불러오기
            if (participants.length > 0) {
                participantSelect.value = participants[0].id;
                loadItems(participants[0].id);
            }
        })
        .catch(error => console.error("취합 대상자 로드 실패:", error));
}

// 🔹 5. 선택된 취합 대상자의 품목 불러오기
function loadItems(participantId) {
    document.getElementById("itemForm").style.display = "block"; // 물품 입력 폼 활성화
    fetch(`${API_BASE_URL}/api/purchase/items/${participantId}`)
        .then(response => response.json())
        .then(items => {
            const itemList = document.getElementById("itemList");
            itemList.innerHTML = ""; // 기존 리스트 초기화
            renderItemTable(items);
        })
        .catch(error => console.error("품목 불러오기 실패:", error));
}

// 테이블 기반 목록 생성
function renderItemTable(items) {
    const tbody = document.getElementById("itemTable").querySelector("tbody");
    tbody.innerHTML = "";

    // 기존 품목 행 추가
    items.forEach(item => {
        const row = createItemRow(item);
        tbody.appendChild(row);
    });

    // 새 품목 추가 행 추가
    tbody.appendChild(createNewItemRow());
}

// 🔹 5. 기존 품목 행 생성 (Inline Editing 지원)
function createItemRow(item) {
    const tr = document.createElement("tr");
    tr.dataset.itemId = item.id;

    // 입력 가능한 필드
    ["item_name", "specification", "quantity", "unit_price", "note", "delivery_fee"].forEach(field => {
        const td = document.createElement("td");
        const input = document.createElement("input");

        input.value = item[field] || "";
        if (["quantity", "unit_price", "delivery_fee"].includes(field)) input.type = "number";
        input.addEventListener("change", () => {
            updateTotalPrice(tr); // ✅ 총액 업데이트
            saveInlineEdit(tr);
        });

        td.appendChild(input);
        tr.appendChild(td);
    });

    // 🔹 총액 TD (입력 불가)
    const totalTd = document.createElement("td");
    totalTd.className = "total-price";  // ✅ 총액 필드 추가
    totalTd.textContent = calculateTotal(item);  // ✅ 초기 총액 계산
    tr.appendChild(totalTd);

    // 삭제 버튼 추가
    const actionTd = document.createElement("td");
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "삭제";
    deleteBtn.style.backgroundColor = "#ff4444";
    deleteBtn.style.color = "white";
    deleteBtn.style.padding = "5px";
    deleteBtn.style.border = "none";
    deleteBtn.style.cursor = "pointer";
    deleteBtn.addEventListener("click", () => deleteItem(tr));
    actionTd.appendChild(deleteBtn);
    tr.appendChild(actionTd);

    return tr;
}

// 총액 계산 함수
function calculateTotal(item) {
    const quantity = parseInt(item.quantity, 10) || 0;
    const unitPrice = parseInt(item.unit_price, 10) || 0;
    const deliveryFee = parseInt(item.delivery_fee, 10) || 0;
    let totalPrice =  quantity * unitPrice + deliveryFee;
    const formattedPrice = totalPrice.toLocaleString("ko-KR");
    const koreanPrice = convertToKoreanNumber(totalPrice);
    return `${formattedPrice} (${koreanPrice})`;
}

// 총액 업데이트 함수
function updateTotalPrice(tr) {
    // 각 열에서 input 요소 찾기
    const inputs = tr.querySelectorAll("input");

    if (inputs.length < 6) {
        console.error("❌ 예상보다 적은 input 요소가 발견됨:", inputs);
        return;
    }

    const quantity = parseInt(inputs[2].value, 10) || 0; // 개수
    const unitPrice = parseInt(inputs[3].value, 10) || 0; // 단가
    const deliveryFee = parseInt(inputs[5].value, 10) || 0; // 택배비

    // ✅ 총액 계산
    const totalPrice = quantity * unitPrice + deliveryFee;

    // ✅ 총액 필드 업데이트 (td.total-price)
    const totalTd = tr.querySelector(".total-price");
    if (totalTd) {
        // 1️⃣ 천 단위 콤마 적용
        const formattedPrice = totalPrice.toLocaleString("ko-KR");

        // 2️⃣ 한글 금액 변환
        const koreanPrice = convertToKoreanNumber(totalPrice);

        // 최종 표시 형식: 1,000 (일천원)
        totalTd.textContent = `${formattedPrice} (${koreanPrice})`;
    } else {
        console.error("❌ 총액 TD를 찾을 수 없음.");
    }
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

// 🔹 6. 새 물품 추가 행 생성
function createNewItemRow() {
    const tr = document.createElement("tr");
    tr.dataset.itemId = "new";

    ["item_name", "specification", "quantity", "unit_price", "note", "delivery_fee"].forEach(field => {
        const td = document.createElement("td");
        const input = document.createElement("input");

        //if (["quantity", "unit_price", "delivery_fee"].includes(field)) input.type = "number";        
        if (["quantity", "unit_price", "delivery_fee"].includes(field)){
            input.type = "number";
            input.classList.add("numeric-input"); 

            // ✅ 값이 변경될 때마다 총액 업데이트
            input.addEventListener("input", () => updateTotalPrice(tr));
        } 
        td.appendChild(input);
        tr.appendChild(td);
    });

    // 🔹 총액 TD (입력 불가)
    const totalTd = document.createElement("td");
    totalTd.className = "total-price";  // ✅ 총액 필드 추가
    totalTd.textContent = '0(영원)';  // ✅ 초기 총액 계산
    tr.appendChild(totalTd);

    // 추가 버튼
    const actionTd = document.createElement("td");
    const addBtn = document.createElement("button");
    addBtn.textContent = "+추가";
    addBtn.style.backgroundColor = "#0094ff";
    addBtn.style.color = "white";
    addBtn.style.padding = "5px";
    addBtn.style.border = "none";
    addBtn.style.cursor = "pointer";
    addBtn.addEventListener("click", () => addNewItem(tr));
    actionTd.appendChild(addBtn);
    tr.appendChild(actionTd);

    return tr;
}

// 🔹 7. 수정 사항 즉시 서버 반영 (PUT)
function saveInlineEdit(tr) {
    const itemId = tr.dataset.itemId;
    if (itemId === "new") return;

    const inputs = tr.querySelectorAll("input");
    const fields = ["item_name", "specification", "quantity", "unit_price", "note", "delivery_fee"];

    const itemData = {};
    inputs.forEach((input, index) => {
        itemData[fields[index]] = input.value;        
    });

    fetch(`${API_BASE_URL}/api/purchase/items/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(itemData),
    }).catch(error => console.error("❌ 품목 수정 오류:", error));
}

// 🔹 8. 새 품목 추가 (POST)
function addNewItem(tr) {
    const participantId = document.getElementById("participantSelect").value;
    const inputs = tr.querySelectorAll("input");
    const fields = ["item_name", "specification", "quantity", "unit_price", "note", "delivery_fee"];

    const newItem = {};
    inputs.forEach((input, index) => {
        newItem[fields[index]] = input.value;
    });
    newItem.participant_id = participantId;

    fetch(`${API_BASE_URL}/api/purchase/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
    }).then(() => loadItems(participantId));
}

// 🔹 품목 삭제 (DELETE 요청)
function deleteItem(tr) {
    const itemId = tr.dataset.itemId;
    if (!itemId || itemId === "new") return;

    if (!confirm("정말 삭제하시겠습니까?")) return;

    fetch(`${API_BASE_URL}/api/purchase/items/${itemId}`, {
        method: "DELETE",
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            tr.remove(); // ✅ 성공적으로 삭제되면 행 제거
        } else {
            alert("품목 삭제 실패");
        }
    })
    .catch(error => console.error("❌ 품목 삭제 중 오류 발생:", error));
}


function watchContentLoad() {
    const observer = new MutationObserver(() => {
        const requestSelect = document.getElementById("requestSelectDetail");
        if (requestSelect) {
            console.log("🔍 requestSelect 요소 감지됨, 데이터 로드 시작...");
            observer.disconnect(); // ✅ 요소 감지 후 감시 종료
            restoreSelections();  // ✅ 선택 복원 실행
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
}



function initializeEventListeners() {
    document.body.addEventListener("change", function (event) {
        if (event.target.matches("#requestSelectDetail")) {
            const requestId = event.target.value;
            if (requestId) {
                console.log(`📌 취합 사유 변경 감지: ${requestId}`);
                sessionStorage.setItem("selectedRequest", requestId);  // ✅ 브라우저 개별 저장
                loadParticipantsCombo(requestId);
            }
        }

        if (event.target.matches("#participantSelect")) {
            const participantId = event.target.value;
            if (participantId) {
                console.log(`📌 취합 대상자 변경 감지: ${participantId}`);
                sessionStorage.setItem("selectedParticipant", participantId);
                loadItems(participantId);
            }
        }
    });
}



// ✅ AJAX 로드 후 이벤트 리스너 자동 추가
watchContentLoad();
initializeEventListeners();


// 🔹 페이지 로드 시 이전 선택 복원
function restoreSelections() {
    const savedRequestId = sessionStorage.getItem("selectedRequest");
    const savedParticipantId = sessionStorage.getItem("selectedParticipant");

    const requestSelect = document.getElementById("requestSelectDetail");
    const participantSelect = document.getElementById("participantSelect");

    if (!requestSelect || !participantSelect) {
        console.error("❌ 요소를 찾을 수 없음.");
        return;
    }

    if (savedRequestId) {
        console.log("🔄 저장된 취합 사유 복원:", savedRequestId);

        // 🔥 AJAX 데이터 로드 후에 실행되도록 `setTimeout` 사용
        setTimeout(() => {
            requestSelect.value = savedRequestId;
            requestSelect.dispatchEvent(new Event("change"));
        }, 500); // ✅ 데이터가 로드될 시간을 고려하여 지연 실행
    }

    if (savedParticipantId) {
        console.log("🔄 저장된 취합 대상자 복원 대기:", savedParticipantId);

        // `MutationObserver`로 대상자 목록이 채워질 때까지 기다린 후 복원
        const observer = new MutationObserver(() => {
            if (participantSelect.options.length > 1) {
                console.log("✅ 취합 대상자 목록 로드 완료. 저장된 값 복원:", savedParticipantId);
                participantSelect.value = savedParticipantId;
                participantSelect.dispatchEvent(new Event("change"));
                observer.disconnect(); // ✅ 감시 중지
            }
        });

        observer.observe(participantSelect, { childList: true, subtree: true });
    }
}


/*

let purchaseData = {
    requests: [],
    participants: {},
    items: {}
};

// 🔹 모든 취합 관련 데이터 한 번에 불러오기
async function loadAllPurchaseData() {
    try {
        const requests = await fetch(`${API_BASE_URL}/api/purchase/requests`).then(res => res.json());
        purchaseData.requests = requests;

        // 🔹 모든 참가자 데이터를 병렬로 불러오기
        const participantPromises = requests.map(request =>
            fetch(`${API_BASE_URL}/api/purchase/participants/${request.id}`).then(res => res.json())
        );

        const participantsResults = await Promise.all(participantPromises);

        // 🔹 가져온 데이터를 객체에 저장
        requests.forEach((request, index) => {
            purchaseData.participants[request.id] = participantsResults[index];
        });

        // 🔹 모든 아이템 데이터를 병렬로 불러오기
        const itemPromises = Object.values(purchaseData.participants).flat().map(participant =>
            fetch(`${API_BASE_URL}/api/purchase/items/${participant.id}`).then(res => res.json())
        );

        const itemsResults = await Promise.all(itemPromises);

        // 🔹 가져온 데이터를 객체에 저장
        let participantIndex = 0;
        for (const requestId in purchaseData.participants) {
            for (const participant of purchaseData.participants[requestId]) {
                purchaseData.items[participant.id] = itemsResults[participantIndex];
                participantIndex++;
            }
        }

        console.log("✅ 모든 취합 데이터 로드 완료:", purchaseData);
        renderRequestSelect();
    } catch (error) {
        console.error("❌ 취합 데이터 불러오기 실패:", error);
    }
}


function renderRequestSelect() {
    const requestSelect = document.getElementById("requestSelectDetail");
    requestSelect.innerHTML = `<option value="">취합 사유 선택</option>`;

    purchaseData.requests.forEach(request => {
        const option = document.createElement("option");
        option.value = request.id;
        option.textContent = request.title;
        requestSelect.appendChild(option);
    });

    // ✅ 이전에 선택한 값 복원
    const savedRequestId = sessionStorage.getItem("selectedRequest");
    if (savedRequestId) {
        requestSelect.value = savedRequestId;
        renderParticipantSelect(savedRequestId);
    }
}


function renderParticipantSelect(requestId) {
    const participantSelect = document.getElementById("participantSelect");
    participantSelect.innerHTML = `<option value="">대상을 선택하세요</option>`;
    participantSelect.disabled = false;
    if (purchaseData.participants[requestId]) {
        purchaseData.participants[requestId].forEach(participant => {
            const option = document.createElement("option");
            option.value = participant.id;
            option.textContent = participant.participant_name;
            participantSelect.appendChild(option);
        });

        // ✅ 이전에 선택한 값 복원
        const savedParticipantId = sessionStorage.getItem("selectedParticipant");
        if (savedParticipantId) {
            participantSelect.value = savedParticipantId;
            renderItemTable(savedParticipantId);
        }
    }
}


function renderItemTable(participantId) {
    const tbody = document.getElementById("itemTable").querySelector("tbody");
    tbody.innerHTML = "";

    if (purchaseData.items[participantId]) {
        purchaseData.items[participantId].forEach(item => {
            const row = createItemRow(item);
            tbody.appendChild(row);
        });
    }

    // 새 품목 추가 행 추가
    tbody.appendChild(createNewItemRow());
}


function initializeEventListeners() {
    document.body.addEventListener("change", function (event) {
        if (event.target.matches("#requestSelectDetail")) {
            const requestId = event.target.value;
            sessionStorage.setItem("selectedRequest", requestId);
            renderParticipantSelect(requestId);
        }

        if (event.target.matches("#participantSelect")) {
            const participantId = event.target.value;
            sessionStorage.setItem("selectedParticipant", participantId);
            renderItemTable(participantId);
        }
    });
}


function watchContentLoad() {
    const observer = new MutationObserver(() => {
        const requestSelect = document.getElementById("requestSelectDetail");
        if (requestSelect) {
            console.log("🔍 requestSelect 요소 감지됨, 데이터 로드 시작...");
            
            observer.disconnect(); // ✅ 감지 종료 (불필요한 중복 방지)
            
            // ✅ 모든 데이터 로드 후 이벤트 리스너 초기화
            loadAllPurchaseData().then(() => initializeEventListeners());
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

function createNewItemRow() {
    const tr = document.createElement("tr");
    tr.dataset.itemId = "new";

    ["item_name", "specification", "quantity", "unit_price", "note", "delivery_fee"].forEach(field => {
        const td = document.createElement("td");
        const input = document.createElement("input");

        //if (["quantity", "unit_price", "delivery_fee"].includes(field)) input.type = "number";        
        if (["quantity", "unit_price", "delivery_fee"].includes(field)){
            input.type = "number";
            input.classList.add("numeric-input"); 

            // ✅ 값이 변경될 때마다 총액 업데이트
            input.addEventListener("input", () => updateTotalPrice(tr));
        } 
        td.appendChild(input);
        tr.appendChild(td);
    });

    // 🔹 총액 TD (입력 불가)
    const totalTd = document.createElement("td");
    totalTd.className = "total-price";  // ✅ 총액 필드 추가
    totalTd.textContent = '0(영원)';  // ✅ 초기 총액 계산
    tr.appendChild(totalTd);

    // 추가 버튼
    const actionTd = document.createElement("td");
    const addBtn = document.createElement("button");
    addBtn.textContent = "+추가";
    addBtn.style.backgroundColor = "#0094ff";
    addBtn.style.color = "white";
    addBtn.style.padding = "5px";
    addBtn.style.border = "none";
    addBtn.style.cursor = "pointer";
    addBtn.addEventListener("click", () => addNewItem(tr));
    actionTd.appendChild(addBtn);
    tr.appendChild(actionTd);

    return tr;
}

function createItemRow(item) {
    const tr = document.createElement("tr");
    tr.dataset.itemId = item.id;

    // 입력 가능한 필드
    ["item_name", "specification", "quantity", "unit_price", "note", "delivery_fee"].forEach(field => {
        const td = document.createElement("td");
        const input = document.createElement("input");

        input.value = item[field] || "";
        if (["quantity", "unit_price", "delivery_fee"].includes(field)) input.type = "number";
        input.addEventListener("change", () => {
            updateTotalPrice(tr); // ✅ 총액 업데이트
            saveInlineEdit(tr);
        });

        td.appendChild(input);
        tr.appendChild(td);
    });

    // 🔹 총액 TD (입력 불가)
    const totalTd = document.createElement("td");
    totalTd.className = "total-price";  // ✅ 총액 필드 추가
    totalTd.textContent = calculateTotal(item);  // ✅ 초기 총액 계산
    tr.appendChild(totalTd);

    // 삭제 버튼 추가
    const actionTd = document.createElement("td");
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "삭제";
    deleteBtn.style.backgroundColor = "#ff4444";
    deleteBtn.style.color = "white";
    deleteBtn.style.padding = "5px";
    deleteBtn.style.border = "none";
    deleteBtn.style.cursor = "pointer";
    deleteBtn.addEventListener("click", () => deleteItem(tr));
    actionTd.appendChild(deleteBtn);
    tr.appendChild(actionTd);

    return tr;
}

// 총액 계산 함수
function calculateTotal(item) {
    const quantity = parseInt(item.quantity, 10) || 0;
    const unitPrice = parseInt(item.unit_price, 10) || 0;
    const deliveryFee = parseInt(item.delivery_fee, 10) || 0;
    let totalPrice =  quantity * unitPrice + deliveryFee;
    const formattedPrice = totalPrice.toLocaleString("ko-KR");
    const koreanPrice = convertToKoreanNumber(totalPrice);
    return `${formattedPrice} (${koreanPrice})`;
}

// 총액 업데이트 함수
function updateTotalPrice(tr) {
    // 각 열에서 input 요소 찾기
    const inputs = tr.querySelectorAll("input");

    if (inputs.length < 6) {
        console.error("❌ 예상보다 적은 input 요소가 발견됨:", inputs);
        return;
    }

    const quantity = parseInt(inputs[2].value, 10) || 0; // 개수
    const unitPrice = parseInt(inputs[3].value, 10) || 0; // 단가
    const deliveryFee = parseInt(inputs[5].value, 10) || 0; // 택배비

    // ✅ 총액 계산
    const totalPrice = quantity * unitPrice + deliveryFee;

    // ✅ 총액 필드 업데이트 (td.total-price)
    const totalTd = tr.querySelector(".total-price");
    if (totalTd) {
        // 1️⃣ 천 단위 콤마 적용
        const formattedPrice = totalPrice.toLocaleString("ko-KR");

        // 2️⃣ 한글 금액 변환
        const koreanPrice = convertToKoreanNumber(totalPrice);

        // 최종 표시 형식: 1,000 (일천원)
        totalTd.textContent = `${formattedPrice} (${koreanPrice})`;
    } else {
        console.error("❌ 총액 TD를 찾을 수 없음.");
    }
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
// ✅ AJAX 로드 후 `requestSelectDetail`이 감지될 때 실행
watchContentLoad();
*/