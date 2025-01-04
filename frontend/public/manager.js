// 태그 불러오기
function loadTags() {
    fetch('http://localhost:5000/api/tags', { method: 'GET' })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(tags => {
            const tagList = document.getElementById('tagList');
            tagList.innerHTML = ''; // 기존 목록 초기화

            tags.forEach(tag => {
                const li = document.createElement('li');
                li.className = 'tag-item';

                // 태그 정보 표시
                const tagInfo = document.createElement('div');
                tagInfo.className = 'tag-info';
                tagInfo.innerHTML = `
                    <span class="tag-name">${tag.name}</span>
                    <span class="tag-color" style="background-color: ${tag.color}"></span>
                `;
                li.appendChild(tagInfo);

                // 삭제 버튼
                const deleteButton = document.createElement('button');
                deleteButton.textContent = '삭제';
                deleteButton.className = 'tag-delete-button';
                deleteButton.onclick = () => deleteTag(tag.id);
                li.appendChild(deleteButton);

                tagList.appendChild(li);
            });
        })
        .catch(error => console.error('태그 로드 실패:', error));
}

// 태그 추가
function addTag() {
    const tagName = document.getElementById('tagNameInput').value.trim();
    const tagColor = document.getElementById('tagColorInput').value;

    if (!tagName) {
        alert('태그 이름을 입력하세요.');
        return;
    }

    fetch('http://localhost:5000/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tagName, color: tagColor }),
    })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (data.success) {
                alert('태그가 추가되었습니다!');
                document.getElementById('tagNameInput').value = '';
                loadTags(); // 태그 목록 갱신
            } else {
                alert('태그 추가에 실패했습니다.');
            }
        })
        .catch(error => console.error('태그 추가 실패:', error));
}

// 태그 삭제
function deleteTag(tagId) {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    fetch(`http://localhost:5000/api/tags/${tagId}`, { method: 'DELETE' })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (data.success) {
                alert('태그가 삭제되었습니다!');
                loadTags(); // 태그 목록 갱신
            } else {
                alert('태그 삭제에 실패했습니다.');
            }
        })
        .catch(error => console.error('태그 삭제 실패:', error));
}

// 페이지 로드 시 태그 목록 초기화
document.addEventListener('DOMContentLoaded', loadTags);
