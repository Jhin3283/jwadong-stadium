// === 좌동 스타디움 코트 현황판 핵심 기능 ===

// 코트, 대기조, 인원 등 데이터 구조 및 상태
const courts = [
  { id: 1, name: '1번 코트', type: '복식', main: true, status: '경기 대기' },
  { id: 2, name: '2번 코트', type: '복식', main: true, status: '경기 대기' },
  { id: 3, name: '3번 코트', type: '복식', main: true, status: '경기 대기' },
  { id: 4, name: '4번 코트', type: '복식', main: true, status: '경기 대기' },
  { id: 5, name: '5번 코트', type: '단식', main: false, status: '경기 대기' },
  { id: 6, name: '6번 코트', type: '단식', main: false, status: '경기 대기' },
];

const statusClass = {
  '대기 중': 'status-waiting',
  '경기 중': 'status-playing',
  '레슨 코트': 'status-lesson',
};

// 전체 회원 명단(이름만)
const allMembers = [
  '강석웅','강원기','강향숙','곽명하','권원자','구미진','구진규','금병록','김근호','김나윤','김동율','김동환','김선길','김순덕','김영택','김은지','김재용','김종대','김태우','김태준','김태형','김혜원','류주원','문재만','박가린','박미혜','박선언','박수진','박영근','박예진','박은서','박인철','박정일','박종만','배중환','서미란','서명숙','서석표','서형동','선형식','손경석','손지원','신유정','신영숙','신정민','안언진','윤성국','윤인균','이상수','이석현','이순이','이완','이영석','이외숙','이재원','이정주','이찬명','이화진','임용호','장철영','장천숙','전경은','전재국','정병학','정수현','정엽','정은현','정현영','정현진','조정이','차규설','차대성','천건희','최성일','최영곤','최은자','최한호','탁재광','편진효','하영대','현세웅','현종석','홍나연','홍봉선','황준식','황태호','한숙영',
  '게스트A','게스트B','게스트C','게스트D','게스트E','게스트F'
];

let waitingGroups = [];
let playingPeople = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
let lessonCourts = [];
let memberStatus = {};
allMembers.forEach(name => memberStatus[name] = '미참여');

// 타이머 상태 저장용 객체 추가
let courtTimers = {};

function syncMemberStatus() {
  allMembers.forEach(name => memberStatus[name] = '미참여');
  waitingGroups.flat().forEach(name => memberStatus[name] = '대기');
  lessonCourts.forEach(cid => {
    courts[cid-1].status === '레슨 코트' && playingPeople[cid].forEach(name => memberStatus[name] = '레슨');
  });
  courts.forEach(court => {
    if (court.status === '경기 중') playingPeople[court.id].forEach(name => memberStatus[name] = '경기');
    if (court.status === '레슨 코트') playingPeople[court.id].forEach(name => memberStatus[name] = '레슨');
  });
}

function renderAll() {
  syncMemberStatus();
  renderWaitingGroups();
  renderCourts();
}

function renderWaitingGroups() {
  const container = document.getElementById('waitingList');
  container.innerHTML = '';
  waitingGroups.forEach((group, idx) => {
    const groupBox = document.createElement('div');
    groupBox.className = 'waiting-group-box';
    groupBox.dataset.idx = idx;
    // 대기조 박스 클릭 시 코트 배정 모달
    groupBox.onclick = e => {
      if (e.target.classList.contains('waiting-group-edit')) return;
      openCourtSelectModal(idx);
    };
    // 인원(라운드 박스)
    group.forEach(name => {
      const person = document.createElement('div');
      person.className = 'waiting-person';
      person.textContent = name;
      groupBox.appendChild(person);
    });
    // 삭제 버튼
    const delBtn = document.createElement('button');
    delBtn.className = 'waiting-group-edit';
    delBtn.innerHTML = '✕';
    delBtn.style.right = '10px';
    delBtn.onclick = (e) => { e.stopPropagation(); waitingGroups.splice(idx,1); renderAll(); };
    // 수정 버튼
    const editBtn = document.createElement('button');
    editBtn.className = 'waiting-group-edit';
    editBtn.innerHTML = '✎';
    editBtn.style.right = '36px';
    editBtn.onclick = (e) => { e.stopPropagation(); openEditGroupModal(idx); };
    groupBox.appendChild(delBtn);
    groupBox.appendChild(editBtn);
    container.appendChild(groupBox);
  });
}

function renderCourts() {
  for (let i = 1; i <= 6; i++) {
    const wrapper = document.getElementById('courtWrapper' + i);
    wrapper.className = 'court-wrapper';
    if (courts[i-1].status === '레슨 코트') wrapper.classList.add('lesson');
    if (courts[i-1].status === '경기 중') wrapper.classList.add('playing');
    if (i === 5 || i === 6) wrapper.classList.add('small');
    wrapper.innerHTML = '';
    const court = courts[i - 1];
    const courtDiv = document.createElement('div');
    courtDiv.className = `court`;
    courtDiv.setAttribute('aria-label', `${court.name}`);
    courtDiv.dataset.courtId = court.id;
    courtDiv.innerHTML = `<div class=\"court-number\">${court.name}</div>`;
    if (court.status === '경기 대기') {
      if (courtTimers[i]) {
        clearInterval(courtTimers[i].interval);
        delete courtTimers[i];
      }
    }
    if (court.status === '레슨 코트') {
      courtDiv.innerHTML += `<div class=\"court-status ${statusClass[court.status]}\">레슨 코트</div>`;
      if (courtTimers[i]) {
        clearInterval(courtTimers[i].interval);
        delete courtTimers[i];
      }
    }
    if (court.status === '경기 중' && playingPeople[court.id].length > 0) {
      const playersDiv = document.createElement('div');
      playersDiv.className = 'court-players';
      playersDiv.innerHTML = playingPeople[court.id].map(name => {
        return `<div class='player-name'>${name}</div>`;
      }).join('');
      courtDiv.appendChild(playersDiv);
      let timerDiv = document.createElement('div');
      timerDiv.className = 'court-status court-timer';
      timerDiv.style.marginBottom = '8px';
      if (!courtTimers[i]) {
        courtTimers[i] = {
          start: Date.now(),
          interval: null,
          div: timerDiv
        };
        courtTimers[i].interval = setInterval(() => {
          updateCourtTimer(i);
        }, 1000);
      } else {
        timerDiv = courtTimers[i].div;
      }
      updateCourtTimer(i);
      courtDiv.appendChild(timerDiv);
      const endBtn = document.createElement('button');
      endBtn.className = 'end-match-btn';
      endBtn.textContent = '경기 종료';
      endBtn.onclick = e => {
        e.stopPropagation();
        playingPeople[court.id] = [];
        court.status = '경기 대기';
        if (courtTimers[i]) {
          clearInterval(courtTimers[i].interval);
          delete courtTimers[i];
        }
        renderAll();
      };
      courtDiv.appendChild(endBtn);
    }
    wrapper.appendChild(courtDiv);
  }
}

function updateCourtTimer(courtId) {
  const timer = courtTimers[courtId];
  if (!timer) return;
  const now = Date.now();
  const elapsed = Math.floor((now - timer.start) / 1000);
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  timer.div.textContent = `${mm}:${ss}`;
  // 600초(10분) 넘으면 깜빡임 효과
  if (elapsed > 600) {
    timer.div.classList.add('timer-warning');
  } else {
    timer.div.classList.remove('timer-warning');
  }
}

function renderMemberModal(editIdx) {
  let modal = document.getElementById('memberModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'memberModal';
    modal.className = 'member-modal';
    document.body.appendChild(modal);
  }
  let selected = editIdx !== undefined ? waitingGroups[editIdx].slice() : [];
  function updateList() {
    // 전체 명단에서 모두 노출, 비활성화 조건만 적용
    const list = allMembers.map(name => {
      const isSelected = selected.includes(name);
      const isDisabled = !isSelected && (
        waitingGroups.some((g, i) => i !== editIdx && g.includes(name)) ||
        Object.values(playingPeople).some(arr => arr.includes(name))
      );
      return { name, isSelected, isDisabled };
    });
    modal.querySelector('.member-list').innerHTML = list.map(({name, isSelected, isDisabled}) => {
      return `<div class="member-name-select${isSelected ? ' selected' : ''}${isDisabled ? ' disabled' : ''}" data-name="${name}">${name}</div>`;
    }).join('');
    modal.querySelectorAll('.member-name-select').forEach(div => {
      if (div.classList.contains('disabled')) return;
      div.onclick = () => {
        if (selected.length < 4 && !selected.includes(div.dataset.name)) {
          selected.push(div.dataset.name);
          updateAll();
        }
      };
    });
  }
  function updateSelected() {
    modal.querySelector('.selected-preview').innerHTML = Array.from({length:4}).map((_,i)=>{
      const name = selected[i];
      return name ? `<span class='waiting-person empty-size'>${name}<button class='remove-person-btn' data-idx='${i}' style='margin-left:4px;background:none;border:none;color:#aaa;cursor:pointer;font-size:1.1em;'>×</button></span>` : `<span class='waiting-person empty empty-size'></span>`;
    }).join('');
    modal.querySelectorAll('.remove-person-btn').forEach(btn => {
      btn.onclick = () => {
        const idx = +btn.dataset.idx;
        selected.splice(idx,1);
        updateAll();
      };
    });
  }
  function updateAll() {
    updateSelected();
    updateList();
    modal.querySelector('#confirmBtn').disabled = selected.length !== 4;
  }
  modal.innerHTML = `
    <div class="modal-content">
      <h3>${editIdx !== undefined ? '대기조 수정' : '경기 인원 선택'}</h3>
      <div class="selected-preview" style="margin:24px 0 8px 0; justify-content:center; display:flex; gap:8px;"></div>
      <div class="member-list"></div>
      <div class="modal-actions">
        <button id="confirmBtn" class="court-btn" disabled>${editIdx !== undefined ? '수정' : '추가'}</button>
        <button id="closeMemberModalBtn" class="court-btn cancel">취소</button>
      </div>
    </div>
  `;
  modal.style.display = 'flex';
  updateAll();
  document.getElementById('closeMemberModalBtn').onclick = () => { modal.style.display = 'none'; };
  modal.querySelector('#confirmBtn').onclick = () => {
    if (selected.length !== 4) { alert('4명을 선택해야 합니다.'); return; }
    if (editIdx !== undefined) waitingGroups[editIdx] = selected;
    else waitingGroups.push(selected);
    modal.style.display = 'none';
    renderAll();
  };
}

function openEditGroupModal(idx) { renderMemberModal(idx); }

function openCourtSelectModal(groupIdx, directCourtId) {
  const modal = document.getElementById('courtSelectModal');
  // 1,2,5 상단, 3,4,6 하단으로 분리(비활성화 코트도 노출)
  const topCourts = [1,2,5].map(id => courts.find(c=>c.id===id)).filter(Boolean);
  const bottomCourts = [3,4,6].map(id => courts.find(c=>c.id===id)).filter(Boolean);
  function isDisabledCourt(c) {
    return c.status === '경기 중' || c.status === '레슨 코트';
  }
  modal.innerHTML = `<div class="court-select-modal">
    <h3>배정할 코트 선택</h3>
    <div class="court-select-list" style="margin-bottom:8px;">
      ${topCourts.map(c=>`<div class="court-select-item${isDisabledCourt(c)?' disabled':''}" data-court="${c.id}">${c.name}</div>`).join('')}
    </div>
    <div class="court-select-list">
      ${bottomCourts.map(c=>`<div class="court-select-item${isDisabledCourt(c)?' disabled':''}" data-court="${c.id}">${c.name}</div>`).join('')}
    </div>
    <div class="modal-actions">
      <button class="court-btn cancel" id="closeCourtSelectModalBtn">취소</button>
    </div>
  </div>`;
  modal.style.display = 'flex';
  modal.querySelectorAll('.court-select-item').forEach(item => {
    if (item.classList.contains('disabled')) return;
    item.onclick = () => {
      const courtId = parseInt(item.dataset.court, 10);
      assignGroupToSpecificCourt(groupIdx, courtId);
      modal.style.display = 'none';
    };
  });
  document.getElementById('closeCourtSelectModalBtn').onclick = () => {
    modal.style.display = 'none';
  };
}

function assignGroupToSpecificCourt(groupIdx, courtId) {
  const court = courts.find(c => c.id === courtId);
  if (!court || court.status === '경기 중' || court.status === '레슨 코트') return;
  playingPeople[courtId] = waitingGroups.splice(groupIdx, 1)[0];
  court.status = '경기 중';
  renderAll();
}

function openLessonSelectModal() {
  const modal = document.getElementById('lessonSelectModal');
  let selected = lessonCourts.slice();
  // 1,2,5 상단, 3,4,6 하단으로 분리
  const topCourts = [1,2,5].map(id => courts.find(c=>c.id===id)).filter(Boolean);
  const bottomCourts = [3,4,6].map(id => courts.find(c=>c.id===id)).filter(Boolean);
  modal.innerHTML = `<div class="lesson-select-modal">
    <h3>레슨 코트 지정</h3>
    <div class="lesson-select-list" style="margin-bottom:8px;">
      ${topCourts.map(c=>`<div class="lesson-select-item${selected.includes(c.id)?' selected':''}${c.status==='경기 중'?' disabled':''}" data-court="${c.id}">${c.name}</div>`).join('')}
    </div>
    <div class="lesson-select-list">
      ${bottomCourts.map(c=>`<div class="lesson-select-item${selected.includes(c.id)?' selected':''}${c.status==='경기 중'?' disabled':''}" data-court="${c.id}">${c.name}</div>`).join('')}
    </div>
    <div class="modal-actions">
      <button class="court-btn" id="confirmLessonSelectBtn">확인</button>
      <button class="court-btn cancel" id="closeLessonSelectModalBtn">취소</button>
    </div>
  </div>`;
  modal.style.display = 'flex';
  modal.querySelectorAll('.lesson-select-item').forEach(item => {
    if (item.classList.contains('disabled')) return;
    item.onclick = () => {
      const courtId = parseInt(item.dataset.court, 10);
      if (selected.includes(courtId)) {
        selected = selected.filter(id => id !== courtId);
        item.classList.remove('selected');
      } else {
        selected.push(courtId);
        item.classList.add('selected');
      }
    };
  });
  document.getElementById('confirmLessonSelectBtn').onclick = () => {
    lessonCourts = selected;
    courts.forEach(c => {
      if (lessonCourts.includes(c.id)) c.status = '레슨 코트';
      else if (c.status === '레슨 코트') c.status = '경기 대기';
      if (c.status === '레슨 코트') playingPeople[c.id] = [];
    });
    modal.style.display = 'none';
    renderAll();
  };
  document.getElementById('closeLessonSelectModalBtn').onclick = () => {
    modal.style.display = 'none';
  };
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('addWaitingGroupBtn').onclick = () => { renderMemberModal(); };
  document.getElementById('lessonCourtBtn').onclick = () => { openLessonSelectModal(); };
  renderAll();
});