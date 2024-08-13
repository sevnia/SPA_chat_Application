// 로컬 스토리지에서 데이터 가져오기
let users = JSON.parse(localStorage.getItem('users')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let friends = JSON.parse(localStorage.getItem('friends')) || [];
let chats = JSON.parse(localStorage.getItem('chats')) || {};
let currentPage = 1;
const itemsPerPage = 10;

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    if (currentUser) {
        showChatUI();
        loadFriends();
    }
});

// 로그인 폼과 회원가입 폼 토글
function toggleForms() {
    document.getElementById('login-form').classList.toggle('hidden');
    document.getElementById('signup-form').classList.toggle('hidden');
}

// 회원가입 기능
function signup() {
    const username = document.getElementById('signup-username').value;
    const password = document.getElementById('signup-password').value;

    if (users.some(user => user.username === username)) {
        alert('이미 존재하는 사용자 이름입니다.');
        return;
    }

    users.push({ username, password });
    localStorage.setItem('users', JSON.stringify(users));
    alert('회원가입이 완료되었습니다.');
    toggleForms();
}

// 로그인 기능
function login() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const user = users.find(user => user.username === username && user.password === password);

    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showChatUI();
    } else {
        alert('존재하지 않는 사용자 이거나 사용자\n이름 또는 비밀번호가 잘못되었습니다.');
    }
}

// 채팅 UI 보여주기
function showChatUI() {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('signup-form').classList.add('hidden');
    document.getElementById('chat-ui').classList.remove('hidden');
}

// 친구 목록 로드
function loadFriends() {
    const friendList = document.getElementById('friend-list');
    friendList.innerHTML = '';

    // 최신순으로 정렬
    friends.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const paginatedFriends = friends.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    
    paginatedFriends.forEach(friend => {
        const li = document.createElement('li');
        li.textContent = friend.name;
        li.classList.add('friend-item');

        // 친구 오른쪽 클릭 시 삭제 확인
        li.oncontextmenu = (e) => {
            e.preventDefault();
            const confirmation = confirm(`"${friend.name}" 친구를 삭제하시겠습니까?`);
            if (confirmation) {
                removeFriend(friend);
            }
        };

        li.onclick = () => openPrivateChat(friend);

        friendList.appendChild(li);
    });

    // 페이지네이션 버튼 활성화/비활성화
    document.getElementById('prev-page').disabled = currentPage === 1;
    document.getElementById('next-page').disabled = currentPage * itemsPerPage >= friends.length;

    // 총 친구 수 업데이트
    document.getElementById('friend-count').textContent = friends.length;
}

// 친구 추가 폼 토글
function showFriendForm() {
    document.getElementById('friend-name').classList.toggle('hidden');
    document.getElementById('friend-email').classList.toggle('hidden');
    document.getElementById('add-friend-button').classList.toggle('hidden');
}

// 친구 추가 기능
function addFriend() {
    const name = document.getElementById('friend-name').value;
    const email = document.getElementById('friend-email').value;

    if (!name || !email) {
        alert('친구 이름과 이메일을 입력하세요.');
        return;
    }

    if (friends.some(friend => friend.name === name)) {
        alert('친구의 이름은 중복되면 안됩니다.');
        return;
    }

    friends.push({ name, email, timestamp: new Date() });
    localStorage.setItem('friends', JSON.stringify(friends));
    loadFriends();
    showFriendForm();
}

// 친구 삭제 기능
function removeFriend(friendToRemove) {
    friends = friends.filter(friend => friend.email !== friendToRemove.email);
    localStorage.setItem('friends', JSON.stringify(friends));
    chats = Object.keys(chats).reduce((acc, email) => {
        if (email !== friendToRemove.email) {
            acc[email] = chats[email];
        }
        return acc;
    }, {});
    localStorage.setItem('chats', JSON.stringify(chats));
    loadFriends();
    if (document.getElementById('private-chat-friend').textContent === friendToRemove.name) {
        closePrivateChat();
    }
}

// 1:1 채팅 창 열기
function openPrivateChat(friend) {
    document.getElementById('private-chat-friend').textContent = friend.name;
    document.getElementById('private-chat-window').classList.remove('hidden');
    loadChatMessages(friend);
}

// 1:1 채팅 창 닫기
function closePrivateChat() {
    document.getElementById('private-chat-window').classList.add('hidden');
}

// 날짜 형식 포맷 함수
function formatDate(date) {
    const now = new Date();
    const isSameYear = date.getFullYear() === now.getFullYear();

    const formattedDate = isSameYear 
        ? `${date.getMonth() + 1}월 ${date.getDate()}일` 
        : `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`
    ;

    return formattedDate;
}

// 메시지 삭제 기능 - 오른쪽 클릭
function handleRightClick(friendEmail, messageIndex) {
    const confirmation = confirm("이 메시지를 삭제하시겠습니까?");
    if (confirmation) {
        deleteMessage(friendEmail, messageIndex);
    }
}

// 채팅 메시지 로드
function loadChatMessages(friend) {
    const chatRoom = document.getElementById('private-messages');
    chatRoom.innerHTML = '';

    const messages = chats[friend.email] || [];
    let lastDate = '';

    messages.forEach((message, index) => {
        const messageDate = new Date(message.timestamp);
        const formattedDate = formatDate(messageDate);

        // 날짜가 바뀌면 날짜를 출력
        if (formattedDate !== lastDate) {
            const dateDiv = document.createElement('div');
            dateDiv.classList.add('message-date');
            dateDiv.textContent = formattedDate;
            chatRoom.appendChild(dateDiv);
            lastDate = formattedDate;
        }

        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.textContent = message.text;

        // 메시지 삭제 기능 - 오른쪽 클릭
        messageDiv.oncontextmenu = (e) => {
            e.preventDefault();
            handleRightClick(friend.email, index);
        };

        chatRoom.appendChild(messageDiv);
    });
}

// 채팅 메시지 전송
function sendPrivateMessage() {
    const input = document.getElementById('private-message-input');
    const messageText = input.value;
    const friendEmail = document.getElementById('private-chat-friend').textContent;
    const friend = friends.find(f => f.name === friendEmail);

    if (!messageText || !friend) return;

    const timestamp = new Date().toISOString(); // ISO 포맷으로 저장
    const message = { text: messageText, timestamp };

    if (!chats[friend.email]) {
        chats[friend.email] = [];
    }

    chats[friend.email].push(message);
    localStorage.setItem('chats', JSON.stringify(chats));

    input.value = '';
    loadChatMessages(friend);
}

// 메시지 삭제
function deleteMessage(friendEmail, messageIndex) {
    if (!chats[friendEmail]) return;

    chats[friendEmail].splice(messageIndex, 1);
    localStorage.setItem('chats', JSON.stringify(chats));
    const friend = friends.find(f => f.email === friendEmail);
    loadChatMessages(friend);
}

// 로그아웃
function logout() {
    localStorage.removeItem('currentUser');
    currentUser = null;
    document.getElementById('chat-ui').classList.add('hidden');
    document.getElementById('login-form').classList.remove('hidden');
}

// 공지사항 모달 표시
function showNotice() {
    document.getElementById('notice-modal').style.display = "block";
    document.getElementById('notice-overlay').style.display = "block";
}

// 공지사항 모달 숨기기
function hideNotice() {
    document.getElementById('notice-modal').style.display = "none";
    document.getElementById('notice-overlay').style.display = "none";
}

// 친구 추가 모달 표시
function showFriendForm() {
    document.getElementById('add-friend-overlay').style.display = "block";
    document.getElementById('add-friend-modal').style.display = "block";
}

// 친구 추가 모달 숨기기
function hideAddFriendModal() {
    document.getElementById('add-friend-overlay').style.display = "none";
    document.getElementById('add-friend-modal').style.display = "none";
}

// 모달에서 친구 추가 기능
function addFriendFromModal() {
    const name = document.getElementById('modal-friend-name').value;
    const email = document.getElementById('modal-friend-email').value;

    if (!name || !email) {
        alert('친구 이름과 이메일을 입력하세요.');
        return;
    }

    if (friends.some(friend => friend.name === name)) {
        alert('친구의 이름은 중복되면 안 됩니다.');
        return;
    }

    friends.push({ name, email, timestamp: new Date() });
    localStorage.setItem('friends', JSON.stringify(friends));
    loadFriends();
    hideAddFriendModal();
}

// 페이지네이션 변경
function changePage(direction) {
    const totalPages = Math.ceil(friends.length / itemsPerPage);
    currentPage += direction;

    if (currentPage < 1) {
        currentPage = 1;
    } else if (currentPage > totalPages) {
        currentPage = totalPages;
    }

    loadFriends();
}

// 프로필 버튼 클릭 시 메뉴 토글
$(document).ready(function() {
    $('#profile-button').click(function() {
        $('#profile-menu').slideToggle(0);
    });
});