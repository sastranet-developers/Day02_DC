// SASTRANET Organizer - Buggy Script

document.addEventListener('DOMContentLoaded', () => {

  // Select key DOM elements
  // BUG 1: Element ID mismatch! In index.html the input is id="task-title", but here it looks for "task-input"
  const taskInput = document.getElementById('task-input');
  const taskPriority = document.getElementById('task-priority');
  const taskColumn = document.getElementById('task-column');
  const taskAssignee = document.getElementById('task-assignee');
  const taskForm = document.getElementById('task-form');
  const searchInput = document.getElementById('search-input');

  // Collaborator and My Tasks elements
  const collabList = document.getElementById('collab-list');
  const newCollabInput = document.getElementById('new-collab-input');
  const addCollabBtn = document.getElementById('add-collab-btn');
  const myTasksUserSelect = document.getElementById('my-tasks-user-select');

  // Poll Elements
  const pollVoterSelect = document.getElementById('poll-voter-select');
  const pollDisplayQuestion = document.getElementById('poll-display-question');
  const pollOptionsList = document.getElementById('poll-options-list');
  const castVoteBtn = document.getElementById('cast-vote-btn');
  const pollMessage = document.getElementById('poll-message');
  const toggleCreatePollBtn = document.getElementById('toggle-create-poll-btn');
  const createPollForm = document.getElementById('create-poll-form');
  const pollQuestionInput = document.getElementById('poll-question-input');
  const pollOptionsInput = document.getElementById('poll-options-input');

  // State
  let teamCollaborators = ['Alex', 'Sam', 'Taylor'];
  let currentUser = myTasksUserSelect ? myTasksUserSelect.value : 'Alex';

  let currentPoll = {
    question: 'What should be our top priority for SASTRANET Hackathon?',
    options: [
      { text: 'Cloud Gateway & Wi-Fi Setup', votes: 2 },
      { text: 'Contest Question Bank & Solutions', votes: 1 },
      { text: 'Registration Portal & Certificates', votes: 0 }
    ],
    votedUsers: ['Alex', 'Sam']
  };

  // Listen to user switcher in "My Tasks"
  if (myTasksUserSelect) {
    myTasksUserSelect.addEventListener('change', (e) => {
      currentUser = e.target.value;
      updateMyTasks();
    });
  }

  // Initialize board
  updateCounters();
  updateMyTasks();
  renderPoll();


  // ----------------------------------------------------
  // FEATURE: Global Team Collaborators Bar
  // ----------------------------------------------------
  addCollabBtn.addEventListener('click', () => {
    const name = newCollabInput.value.trim();
    if (!name) {
      alert('Please enter a collaborator name!');
      return;
    }

    // Duplicate names are allowed and will get added
    teamCollaborators.push(name);

    // Add chip to the common bar
    const chip = document.createElement('span');
    chip.className = 'collab-chip';
    chip.textContent = name;
    collabList.appendChild(chip);

    newCollabInput.value = '';

    // BUG 10: Desync between global collaborators and dropdowns!
    // Adding a collaborator updates the chip list on screen, but forgot to update
    // the <select id="task-assignee"> dropdown in the "Add Task" form and
    // the <select id="my-tasks-user-select"> in the "My Tasks" section,
    // as well as the <select id="poll-voter-select"> in the Poll section!
    /*
    const option = document.createElement('option');
    option.value = name;
    option.textContent = `Assignee: ${name}`;
    taskAssignee.appendChild(option);

    const userOption = document.createElement('option');
    userOption.value = name;
    userOption.textContent = name;
    myTasksUserSelect.appendChild(userOption);

    const voterOption = document.createElement('option');
    voterOption.value = name;
    voterOption.textContent = name;
    pollVoterSelect.appendChild(voterOption);
    */
  });


  // ----------------------------------------------------
  // FEATURE: My Tasks Section
  // ----------------------------------------------------
  function updateMyTasks() {
    const myTasksContainer = document.getElementById('my-tasks-container');
    const myTasksCount = document.getElementById('my-tasks-count');

    if (!myTasksContainer) return;

    const allCards = document.querySelectorAll('.task-card');
    const myCards = [];

    allCards.forEach(card => {
      const tag = card.querySelector('.collab-tag');
      // BUG: My tasks shown should be wrong!
      // Inverted check (!includes instead of includes) displays everyone else's tasks instead of the current user's!
      if (tag && !tag.textContent.includes(currentUser)) {
        const title = card.querySelector('.task-text')?.textContent || 'Untitled';
        const column = card.closest('.column')?.querySelector('h2')?.textContent || 'Unknown';
        myCards.push({ title, column });
      }
    });

    if (myTasksCount) {
      myTasksCount.textContent = `${myCards.length} task${myCards.length === 1 ? '' : 's'}`;
    }

    if (myCards.length === 0) {
      myTasksContainer.innerHTML = `<p class="empty-msg">No tasks currently assigned to ${currentUser}.</p>`;
    } else {
      myTasksContainer.innerHTML = myCards.map(item => `
        <div class="my-task-item">
          <strong>${item.title}</strong>
          <span class="my-task-status">${item.column}</span>
        </div>
      `).join('');
    }
  }


  // ----------------------------------------------------
  // FEATURE: Team Poll & Voting with Progress Bar
  // ----------------------------------------------------
  function renderPoll() {
    pollDisplayQuestion.textContent = currentPoll.question;
    pollOptionsList.innerHTML = '';

    // BUG 8: String concatenation in total votes calculation!
    // Passing "" as the accumulator initial value causes string concatenation ("" + 2 + 1 + 0 = "210").
    // Dividing by "210" ruins the percentage calculation for every progress bar!
    const totalVotes = currentPoll.options.reduce((acc, opt) => acc + opt.votes, "");

    currentPoll.options.forEach((opt, index) => {
      const percentage = (totalVotes > 0 && !isNaN(totalVotes)) ? Math.round((opt.votes / totalVotes) * 100) : 0;

      const row = document.createElement('div');
      row.className = 'poll-option-row';

      row.innerHTML = `
        <label class="poll-option-label">
          <span>
            <input type="radio" name="poll-vote-choice" value="${index}">
            ${opt.text}
          </span>
          <span class="poll-vote-meta">${opt.votes} vote(s) (${percentage}%)</span>
        </label>
        <div class="poll-progress-track">
          <div class="poll-progress-fill" id="progress-fill-${index}"></div>
        </div>
      `;

      pollOptionsList.appendChild(row);

      // BUG 7: Missing '%' unit when applying progress bar width!
      // Setting fill.style.width = percentage sets a unitless number (e.g. 50 instead of "50%").
      // Browsers ignore unitless values in CSS width, keeping progress bars locked at 0%!
      const fill = row.querySelector(`#progress-fill-${index}`);
      if (fill) {
        fill.style.width = percentage; // BUG: Should be `${percentage}%`
      }
    });
  }

  // Cast Vote Handler
  castVoteBtn.addEventListener('click', () => {
    const voter = pollVoterSelect.value;
    // BUG: Vote should not work!
    // Queries 'poll-option-choice' instead of 'poll-vote-choice'.
    // 'selected' is always null, so clicking Cast Vote always fails!
    const selected = document.querySelector('input[name="poll-option-choice"]:checked');

    if (!selected) {
      pollMessage.textContent = 'Please select an option to vote!';
      pollMessage.style.color = '#e65100';
      return;
    }

    if (currentPoll.votedUsers.includes(voter)) {
      pollMessage.textContent = `⚠️ ${voter} has already cast a vote in this poll!`;
      pollMessage.style.color = '#c62828';
      return;
    }

    const optionIndex = parseInt(selected.value, 10);
    currentPoll.options[optionIndex].votes += 1;
    currentPoll.votedUsers.push(voter);

    pollMessage.textContent = `✅ Vote cast successfully by ${voter}!`;
    pollMessage.style.color = '#2e7d32';

    renderPoll();
  });

  // Toggle Create Poll Form
  toggleCreatePollBtn.addEventListener('click', () => {
    createPollForm.classList.toggle('hidden');
  });

  // Submit New Poll
  createPollForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const question = pollQuestionInput.value.trim();
    const rawOptions = pollOptionsInput.value.trim();

    if (!question || !rawOptions) return;

    const parsedOptions = rawOptions.split(',')
      .map(o => o.trim())
      .filter(o => o.length > 0)
      .map(text => ({ text, votes: 0 }));

    if (parsedOptions.length < 2) {
      alert('Please provide at least 2 options separated by commas!');
      return;
    }

    currentPoll = {
      question: question,
      options: parsedOptions,
      votedUsers: []
    };

    pollQuestionInput.value = '';
    pollOptionsInput.value = '';
    createPollForm.classList.add('hidden');
    pollMessage.textContent = '🎉 New poll created! Cast your votes.';
    pollMessage.style.color = '#1a237e';

    renderPoll();
  });


  // ----------------------------------------------------
  // FEATURE 1: Add New Task
  // ----------------------------------------------------
  taskForm.addEventListener('submit', (e) => {
    // BUG 2: Missing e.preventDefault()!
    // Submitting the form reloads the whole page and wipes any newly created task.
    // e.preventDefault();

    const title = taskInput.value.trim();
    if (!title) {
      alert('Please enter a task title!');
      return;
    }

    const rawPriority = taskPriority.value;
    // BUG: Wrong priority assigning!
    // Inverts priority: High maps to Low, and Low maps to High!
    let priority = rawPriority;
    if (rawPriority === 'high') {
      priority = 'low';
    } else if (rawPriority === 'low') {
      priority = 'high';
    }

    const targetListId = taskColumn.value;
    const targetList = document.getElementById(targetListId);
    const assignee = taskAssignee.value || 'Unassigned';

    // Create options for the card's assignee dropdown
    const assigneeOptions = teamCollaborators.map(c => 
      `<option value="${c}" ${c === assignee ? 'selected' : ''}>${c}</option>`
    ).join('') + `<option value="Unassigned" ${assignee === 'Unassigned' ? 'selected' : ''}>Unassigned</option>`;

    // Create new card with "Delete" button option
    const card = document.createElement('div');
    card.className = 'task-card';
    card.draggable = true;
    card.setAttribute('data-id', Date.now());

    card.innerHTML = `
      <div class="card-header">
        <span class="badge badge-${priority}">${priority}</span>
        <button class="delete-btn" title="Delete Task"><span class="delete-text">Delete</span></button>
      </div>
      <p class="task-text">${title}</p>
      <div class="card-collab-row">
        <span class="collab-tag">👤 ${assignee}</span>
        <select class="card-assignee-select">
          ${assigneeOptions}
        </select>
      </div>
      <div class="card-actions">
        <button class="move-btn move-left">◀ Back</button>
        <button class="move-btn move-right">Move Next ▶</button>
      </div>
    `;

    // Attach listeners to new card
    setupCardEvents(card);

    // BUG: Task should not be added!
    // The appendChild call is commented out, so newly created cards are never added to the board!
    // targetList.appendChild(card);
    taskInput.value = '';
    updateCounters();
    updateMyTasks();
  });


  // ----------------------------------------------------
  // FEATURE 2: Move Task (Left / Right buttons)
  // ----------------------------------------------------
  function moveCard(card, direction) {
    const columnOrder = ['todo-list', 'inprogress-list', 'done-list'];
    const currentList = card.closest('.task-list');
    if (!currentList) return;

    const currentIndex = columnOrder.indexOf(currentList.id);

    // BUG 5: Off-by-one / Missing boundary check when moving
    let targetIndex;
    if (direction === 'right') {
      targetIndex = currentIndex + 1;
    } else {
      targetIndex = currentIndex - 1;
    }

    if (targetIndex >= 0 && targetIndex < columnOrder.length) {
      const targetList = document.getElementById(columnOrder[targetIndex]);
      targetList.appendChild(card);
      updateCounters();
      // BUG 12: updateMyTasks() is missing here, so column status in "My Tasks" never updates on move!
    }
  }


  // ----------------------------------------------------
  // FEATURE 3: Task Delete & Card Events Setup
  // ----------------------------------------------------
  function setupCardEvents(card) {
    // Drag events
    card.addEventListener('dragstart', (e) => {
      card.classList.add('dragging');
      e.dataTransfer.setData('text/plain', card.getAttribute('data-id'));
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
    });

    // Delete button event
    const deleteBtn = card.querySelector('.delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        // BUG 6: e.target.parentElement deletes the wrong element!
        // Because the button contains <span class="delete-text">Delete</span>, clicking
        // the text makes e.target the <span>, so e.target.parentElement is the <button>,
        // which deletes only the delete button instead of the entire .task-card!
        e.target.parentElement.remove();
        updateCounters();
      });
    }

    // Move buttons
    const moveLeft = card.querySelector('.move-left');
    const moveRight = card.querySelector('.move-right');

    if (moveLeft) {
      moveLeft.addEventListener('click', () => moveCard(card, 'left'));
    }
    if (moveRight) {
      moveRight.addEventListener('click', () => moveCard(card, 'right'));
    }

    // Collaborator re-assignment on card
    const assigneeSelect = card.querySelector('.card-assignee-select');
    if (assigneeSelect) {
      assigneeSelect.addEventListener('change', (e) => {
        // BUG 11: document.querySelector instead of card.querySelector!
        // This targets the very FIRST .collab-tag on the entire page rather than the
        // tag on THIS specific card, changing the wrong card's assignee name!
        const badge = document.querySelector('.collab-tag');
        if (badge) {
          badge.textContent = `👤 ${e.target.value}`;
        }
      });
    }
  }

  // Bind existing cards in DOM
  document.querySelectorAll('.task-card').forEach(card => {
    setupCardEvents(card);
  });


  // ----------------------------------------------------
  // FEATURE 4: Drag and Drop Columns
  // ----------------------------------------------------
  const columns = document.querySelectorAll('.task-list');

  columns.forEach(column => {
    column.addEventListener('dragover', (e) => {
      // BUG 7 (DnD): Missing e.preventDefault() in dragover!
      // In HTML5 Drag and Drop, if dragover does NOT call e.preventDefault(),
      // the browser cancels the drop event, and the drop listener below NEVER triggers!
      // e.preventDefault();
    });

    column.addEventListener('drop', (e) => {
      e.preventDefault();
      const draggingCard = document.querySelector('.dragging');
      if (draggingCard) {
        column.appendChild(draggingCard);
        updateCounters();
      }
    });
  });


  // ----------------------------------------------------
  // FEATURE 5: Column Task Counter
  // ----------------------------------------------------
  function updateCounters() {
    const listIds = ['todo-list', 'inprogress-list', 'done-list'];
    
    listIds.forEach(id => {
      const list = document.getElementById(id);
      const countBadge = document.getElementById(id.replace('-list', '-count'));
      
      if (list && countBadge) {
        // BUG 8 (Counter): list.children count
        const count = list.children.length;
        countBadge.textContent = count;
      }
    });
  }


  // ----------------------------------------------------
  // FEATURE 6: Search and Filter Tasks
  // ----------------------------------------------------
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value;
    const cards = document.querySelectorAll('.task-card');

    cards.forEach(card => {
      const text = card.querySelector('.task-text')?.textContent || '';

      // BUG 9: Case-sensitive search!
      if (text.indexOf(query) !== -1) {
        card.classList.remove('hidden');
      } else {
        card.classList.add('hidden');
      }
    });
  });

});
