const API_BASE_URL = "http://localhost:5000"

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
                option.textContent = `${participant.participant_name}`; // ✅ 사용 금액 표시
                participantSelect.appendChild(option);
            });

            // 🔥 첫 번째 대상자가 있다면 자동 선택 후 품목 불러오기
            /*
            if (participants.length > 0) {
                participantSelect.value = participants[0].id;
                loadItems(participants[0].id);
            }
            */
        })
        .catch(error => console.error("취합 대상자 로드 실패:", error));
}

// 🔹 5. 선택된 취합 대상자의 품목 불러오기
function loadItems(participantId) {
    //document.getElementById("itemForm").style.display = "none"; // 물품 입력 폼 활성화
    fetch(`${API_BASE_URL}/api/purchase/items/${participantId}`)
        .then(response => response.json())
        .then(items => {
            //const itemList = document.getElementById("itemList");
            //itemList.innerHTML = ""; // 기존 리스트 초기화
            renderItemTable(items);

            updateSummary();
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
// 🔹 6. 새 물품 추가 행 생성
function createNewItemRow() {
    const tr = document.createElement("tr");
    tr.dataset.itemId = "new";

    // 필드 배열 정의
    const fields = ["item_name", "specification", "quantity", "unit_price", "note", "delivery_fee"];
    
    fields.forEach((field, index) => {
        const td = document.createElement("td");
        const input = document.createElement("input");

        // 🔥 각 필드에 id 추가 (`new_` prefix 사용)
        input.id = `new_${field}`;
        input.name = field;

        if (["quantity", "unit_price", "delivery_fee"].includes(field)) {
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
    })
    .then(() => {
        loadSummaryTable(document.getElementById('requestSelectDetail').value); // 🔥 Summary 업데이트
    })
    .catch(error => console.error("❌ 품목 수정 오류:", error));
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
    })
    .then(() => {
        console.log("✅ 새 품목 추가 완료. Summary 테이블 업데이트!");
        loadItems(participantId); // 기존 개별 품목 목록 업데이트
        loadSummaryTable(document.getElementById('requestSelectDetail').value); // 🔥 Summary 테이블 업데이트
    });
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
            loadSummaryTable(document.getElementById('requestSelectDetail').value); // 🔥 Summary 업데이트
        } else {
            alert("품목 삭제 실패");
        }
    })
    .catch(error => console.error("❌ 품목 삭제 중 오류 발생:", error));
}

// 전체 품목 요약 테이블
function loadSummaryTable(requestId) {
    fetch(`${API_BASE_URL}/api/purchase/summary/${requestId}`)
        .then(response => response.json())
        .then(items => {
            const tbody = document.getElementById("summaryTable").querySelector("tbody");
            tbody.innerHTML = "";  // 기존 데이터 초기화
            items.forEach(item => {
                const tr = document.createElement("tr");

                ["item_name", "specification", "unit_price", "total_quantity", "note"].forEach(field => {
                    const td = document.createElement("td");
                    td.textContent = item[field] || "";
                    tr.appendChild(td);
                });

                // 🔹 총액 계산
                const totalAmount = item.total_quantity * item.unit_price;
                const formattedPrice = totalAmount.toLocaleString("ko-KR");
                const koreanPrice = convertToKoreanNumber(totalAmount);

                const totalTd = document.createElement("td");
                totalTd.textContent = `${formattedPrice} (${koreanPrice})`;
                tr.appendChild(totalTd);

                // 🔥 "복사" 버튼 추가
                const actionTd = document.createElement("td");
                const copyBtn = document.createElement("button");
                copyBtn.textContent = "복사";
                copyBtn.classList.add("copy-btn");
                copyBtn.onclick = () => copyItemToForm(item);
                actionTd.appendChild(copyBtn);
                tr.appendChild(actionTd);

                tbody.appendChild(tr);
            });
        })
        .catch(error => console.error("취합 사유별 전체 물품 로드 실패:", error));
}

//복사 버튼 기능
function copyItemToForm(item) {
    document.querySelector("#new_item_name").value = item.item_name;
    document.querySelector("#new_specification").value = item.specification;
    document.querySelector("#new_quantity").value = item.total_quantity;
    document.querySelector("#new_unit_price").value = item.unit_price;
    document.querySelector("#new_note").value = item.note || ""; // 🔥 비고 추가

    updateTotalPrice(document.querySelector("tr[data-item-id='new']")); // ✅ 총액 자동 업데이트
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
                loadSummaryTable(requestId);
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


//총액 자동 계산
function updateSummary() {
    const rows = document.querySelectorAll("#itemTable tbody tr");
    let totalAmount = 0;

    rows.forEach(row => {
        const inputs = row.querySelectorAll("input");
        const quantity = parseInt(inputs[2]?.value, 10) || 0;
        const unitPrice = parseInt(inputs[3]?.value, 10) || 0;
        const deliveryFee = parseInt(inputs[5]?.value, 10) || 0;

        totalAmount += quantity * unitPrice + deliveryFee;
    });

    // 한글 변환 적용
    const formattedPrice = totalAmount.toLocaleString("ko-KR");
    const koreanPrice = convertToKoreanNumber(totalAmount);
    document.getElementById("totalAmount").textContent = `${formattedPrice}원 (${koreanPrice})`;
}

function exportItemTableToXLSX() {
    exportTableToXLS("itemTable");
}

function exportSummaryTableToXLSX() {
    exportSummaryToXLS(document.getElementById('requestSelectDetail').value);
}


// xlsx 다운로드 중 ',' 제거
function cleanData(text) {
    if (!text) return ""; // 빈 값 처리
    return `"${text.replace(/"/g, '""').replace(/,/g, '')}"`; // 큰따옴표 처리 & 쉼표 제거
}

// xlsx 다운로드
function exportTableToXLS(tableId) {
    let table = document.getElementById(tableId);
    let rows = table.querySelectorAll("tr");

    let content = [];

    // 헤더 가져오기 (마지막 "작업" 열 제외)
    let header = [];
    let headers = rows[0].querySelectorAll("th");
    for (let j = 0; j < headers.length - 1; j++) { // 🔥 마지막 열 제외
        header.push(cleanData(headers[j].textContent.trim()));
    }
    content.push(header.join(",")); // 🔹 쉼표(,)로 구분

    
    // 데이터 행 가져오기
    for (let i = 1; i < rows.length; i++) {
        let row = [];
        let cells = rows[i].querySelectorAll("td");

        for (let j = 0; j < cells.length - 1; j++) { // 🔥 마지막 "작업" 열 제외
            let cell = cells[j];
            let input = cell.querySelector("input");
            let value = input ? input.value : cell.textContent.trim();
            row.push(cleanData(value));
        }
        content.push(row.join(",")); // 🔹 쉼표(,)로 구분
    }

    
    // XLS 파일 생성 (BOM 추가)
    let blob = new Blob(["\uFEFF" + content.join("\n")], { type: "application/vnd.ms-excel" });

    // 다운로드 링크 생성
    let selectedElement = document.getElementById('participantSelect');
    let selectedIndex = selectedElement.selectedIndex;
    let selectedText = selectedElement.options[selectedIndex].text;

    let link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${selectedText}.xls`;
    link.click();
}

async function exportSummaryToXLS(requestId) {
    if (!requestId) {
        alert("취합 사유를 먼저 선택하세요!");
        return;
    }

    let table = document.getElementById("summaryTable");
    let rows = table.querySelectorAll("tr");

    let content = [];

    // 🔹 헤더 가져오기 (마지막 "작업" 열 제외)
    let header = [];
    let headers = rows[0].querySelectorAll("th");
    for (let j = 0; j < headers.length - 1; j++) { // 🔥 마지막 열 제외
        header.push(cleanData(headers[j].textContent.trim()));
    }
    content.push(header.join(",")); // 🔹 쉼표(,)로 구분

    // 🔹 참가자별 데이터 가져오기
    let response = await fetch(`${API_BASE_URL}/api/purchase/items/summary/${requestId}`);
    let allItems = await response.json();

    // 🔹 개별 참가자별 데이터 저장용
    let participantData = {};

    // 🔹 참가자별 데이터를 itemKey 기준으로 정리
    allItems.forEach(item => {
        let itemKey = `${item.item_name}|${item.specification}|${item.unit_price}`;
        let quantity = parseInt(item.quantity, 10) || 0;
        let participantName = item.participant_name;

        if (!participantData[itemKey]) {
            participantData[itemKey] = { total: 0, details: [] };
        }
        participantData[itemKey].total += quantity;
        participantData[itemKey].details.push(`${participantName}: ${quantity}`);
    });

    // 🔹 Summary Table 업데이트
    for (let i = 1; i < rows.length; i++) {
        let row = [];
        let cells = rows[i].querySelectorAll("td");

        let itemKeyParts = []; // 🔹 아이템 키 구성 요소
        let quantityValue = 0; // 개수 값 저장

        for (let j = 0; j < cells.length - 1; j++) { // 🔥 마지막 "작업" 열 제외
            let cell = cells[j];
            let input = cell.querySelector("input");
            let value = input ? input.value : cell.textContent.trim();

            if (j === 0 || j === 1 || j === 2) { // 물품명, 규격, 단가
                itemKeyParts.push(value); // 🔹 배열에 저장
            }
            if (j === 3) { // 개수 저장
                quantityValue = parseInt(value, 10) || 0;
            }
            row.push(cleanData(value));
        }
        
        let itemKey = itemKeyParts.join("|"); // 🔹 불필요한 `|` 제거된 문자열 생성

        // 🔥 참가자별 개수 정보 추가
        if (participantData[itemKey]) {
            let totalQty = participantData[itemKey].total;
            let participantDetail = participantData[itemKey].details.join(" + ");
            row[3] = `${totalQty} (${participantDetail})`; // ✅ 개수 정보 추가
        }

        content.push(row.join(",")); // 🔹 쉼표(,)로 구분
    }

    // XLS 파일 생성 (BOM 추가)
    let blob = new Blob(["\uFEFF" + content.join("\n")], { type: "application/vnd.ms-excel" });

    // 다운로드 링크 생성
    let selectedElement = document.getElementById('requestSelectDetail');
    let selectedIndex = selectedElement.selectedIndex;
    let selectedText = selectedElement.options[selectedIndex].text;
    let link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `취합_요약_${selectedText}.xls`;
    link.click();
}

document.body.addEventListener("input", function (event) {
    if (event.target.closest("#itemTable tbody")) {
        updateSummary();
        
        loadSummaryTable(document.getElementById('requestSelectDetail').value);
    }
});

