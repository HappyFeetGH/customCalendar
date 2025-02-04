const API_BASE_URL = "http://144.24.69.30:5000";

// 취합 요청 추가
function addPurchaseRequest() {
    const title = document.getElementById('requestTitle').value;

    fetch(`${API_BASE_URL}/api/purchase-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert("취합 요청이 추가되었습니다.");
            loadPurchaseRequests();
        }
    });
}

// 취합 요청 목록 로드
function loadPurchaseRequests() {
    fetch(`${API_BASE_URL}/api/purchase-requests`)
        .then(res => res.json())
        .then(requests => {
            const requestList = document.getElementById('requestList');
            requestList.innerHTML = "";
            requests.forEach(request => {
                const li = document.createElement('li');
                li.textContent = request.title;
                requestList.appendChild(li);
            });
        });
}

// 페이지 로드시 요청 목록 불러오기
document.addEventListener('DOMContentLoaded', loadPurchaseRequests);
