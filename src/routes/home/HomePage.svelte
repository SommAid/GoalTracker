<style>
    @import '../../style/home.css';

    .add-tracker-container {
        display: flex;
        justify-content: flex-end; /* Aligns the button to the right */
        margin-bottom: 15px; /* Adds space below the button */
    }
    #add-tracker-btn {
        padding: 8px 15px;
        font-size: 0.9rem;
        font-weight: 600;
        color: #ffffff;
        background-color: #3b82f6;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        transition: background-color 0.2s;
    }
    #add-tracker-btn:hover { background-color: #2563eb; }
    
    .date-navigator {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 25px;
        padding-bottom: 20px;
        border-bottom: 2px solid #e5e7eb;
    }
    .nav-arrows button, .view-switcher button {
        background: none;
        border: none;
        cursor: pointer;
        padding: 5px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .nav-arrows button:hover, .view-switcher button:hover {
        background-color: #f0f2f5;
    }
    .nav-arrows svg, .view-switcher svg {
        width: 24px;
        height: 24px;
        stroke: #4b5563;
    }
    .date-display {
        font-size: 1.2rem;
        font-weight: 600;
        color: #1f2937;
    }
    .view-switcher {
        display: flex;
        gap: 5px;
    }
    .view-switcher button.active svg {
        stroke: #3b82f6;
    }

    .summary-wrapper {
        position: relative;
    }
    .weekly-summary {
        display: flex;
        flex-wrap: wrap; 
        justify-content: center;
        gap: 20px;
        margin-bottom: 40px;
        padding-bottom: 20px;
        border-bottom: 2px solid #e5e7eb;
    }
    .weekly-summary.is-scrollable {
        flex-wrap: nowrap;
        justify-content: flex-start;
        overflow-x: auto;
        scroll-behavior: smooth;
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
    .weekly-summary.is-scrollable::-webkit-scrollbar {
        display: none;
    }

    .summary-item {
        text-align: center;
        flex-shrink: 0; 
    }
    .summary-item h3 { margin: 0 0 15px 0; font-weight: 600; color: #374151; }
    .progress-ring { width: 150px; height: 150px; }
    .progress-ring__circle {
        transition: stroke-dashoffset 0.8s ease-out;
        transform: rotate(-90deg);
        transform-origin: 50% 50%;
    }
    .progress-ring__text { font-size: 1.7rem; font-weight: 700; fill: #1f2f37; }
    .progress-ring__label { font-size: 0.8rem; fill: #6c757d; text-transform: uppercase; }

    .scroll-arrow {
        position: absolute;
        top: 55%;
        transform: translateY(-50%);
        background-color: rgba(255, 255, 255, 0.9);
        border: 1px solid #e5e7eb;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        z-index: 10;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .scroll-arrow.left { left: -20px; }
    .scroll-arrow.right { right: -20px; }
    .scroll-arrow svg { stroke: #374151; }
</style>

<script>
    import { onMount, afterUpdate } from 'svelte';

    // --- Central Reactive State ---
    let appData = {
        trackers: [
            { id: 'calories', name: 'Calories', goal: 14950, timeframe: 'weekly' },
            { id: 'protein', name: 'Protein', goal: 1115, timeframe: 'weekly' },
            { id: 'carbs', name: 'Carbs', goal: 1675, timeframe: 'weekly' },
            { id: 'fat', name: 'Fat', goal: 398, timeframe: 'weekly' }
        ],
        dayData: {
            "2025-09-21": { values: { calories: 2100, protein: 150, carbs: 250, fat: 58 } },
            "2025-09-22": { values: { calories: 1950, protein: 160, carbs: 210, fat: 51 } },
            "2025-09-23": { values: { calories: 2050, protein: 155, carbs: 230, fat: 55 } },
            "2025-09-24": { values: { calories: 2000, protein: 150, carbs: 225, fat: 55 } },
            "2025-09-25": { values: { calories: 2150, protein: 165, carbs: 240, fat: 59 } },
            "2025-09-26": { values: { calories: 2300, protein: 170, carbs: 260, fat: 64 } },
            "2025-09-27": { values: { calories: 2400, protein: 180, carbs: 270, fat: 66 } }
        },
        activeDayDate: null
    };

    let currentView = 'week';
    let currentDate = new Date();
    let isModalOpen = false;
    let isEditing = false;
    let newTrackerName = '';
    let newTrackerGoal = null;

    let showLeftArrow = false;
    let showRightArrow = false;
    let summaryContainer; 

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayLabels = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'S'];

    // --- Reactive Computations (`$:` syntax) ---
    $: isScrollable = appData.trackers.length > 4;

    $: displayedWeek = (() => {
        const start = getWeekStart(currentDate);
        return Array.from({ length: 7 }).map((_, i) => {
            const date = new Date(start);
            date.setDate(start.getDate() + i);
            const dateKey = formatDate(date);
            
            if (!appData.dayData[dateKey]) {
                appData.dayData[dateKey] = { values: {} };
            }
            const data = appData.dayData[dateKey];
            
            appData.trackers.forEach(t => {
                if(data.values[t.id] === undefined) data.values[t.id] = 0;
            });

            return { date, dateKey, name: date.toLocaleDateString('en-US', { weekday: 'long' }), ...data };
        });
    })();

    $: activeDay = displayedWeek.find(d => d.dateKey === appData.activeDayDate);

    $: dateDisplay = (() => {
        if (currentView === 'week' && displayedWeek.length > 0) {
            const start = displayedWeek[0].date;
            const end = displayedWeek[6].date;
            const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
            const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
            if (startMonth === endMonth) {
                return `${startMonth} ${start.getDate()} - ${end.getDate()}, ${end.getFullYear()}`;
            }
            return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${end.getFullYear()}`;
        }
        return 'Date Display';
    })();
    
    $: summaryData = appData.trackers.map(tracker => {
        let consumed = 0;
        displayedWeek.forEach(day => {
            if (day.date <= today) {
                consumed += day.values[tracker.id] || 0;
            }
        });
        const goal = (tracker.timeframe === 'weekly') ? tracker.goal : tracker.goal * 7;
        const percentage = goal > 0 ? consumed / goal : 0;
        const circumference = 2 * Math.PI * 60;
        const offset = circumference - percentage * circumference;
        return { ...tracker, consumed, offset, circumference, goal };
    });

    // --- Date Utility Functions ---
    function getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day;
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d;
    }
    
    function formatDate(date) {
        return date.toISOString().split('T')[0];
    }
    
    // --- Event Handler Functions ---
    function navigate(direction) {
        const newDate = new Date(currentDate);
        if (currentView === 'week') newDate.setDate(newDate.getDate() + (direction * 7));
        currentDate = newDate;
    }
    
    function handleDayClick(dateKey) {
        appData.activeDayDate = dateKey;
        isEditing = false;
    }

    function handleSave() {
        isEditing = false;
        appData = appData;
    }

    function handleAddNewTracker() {
        if (newTrackerName && newTrackerGoal) {
            const id = newTrackerName.toLowerCase().replace(/ /g, '-');
            appData.trackers = [...appData.trackers, { id, name: newTrackerName, goal: newTrackerGoal, timeframe: 'weekly' }];
            Object.keys(appData.dayData).forEach(dateKey => {
                appData.dayData[dateKey].values[id] = 0;
            });
            isModalOpen = false;
            newTrackerName = '';
            newTrackerGoal = null;
        }
    }

    function updateArrowVisibility() {
        if (!isScrollable || !summaryContainer) {
            showLeftArrow = false;
            showRightArrow = false;
            return;
        }
        const atStart = summaryContainer.scrollLeft <= 0;
        const atEnd = summaryContainer.scrollLeft >= summaryContainer.scrollWidth - summaryContainer.clientWidth - 1;
        showLeftArrow = !atStart;
        showRightArrow = !atEnd;
    }

    function scrollSummary(direction) {
        if (!summaryContainer) return;
        const scrollAmount = summaryContainer.clientWidth * 0.8;
        summaryContainer.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
    }
    
    // --- Lifecycle Functions ---
    afterUpdate(() => {
        updateArrowVisibility();
    });

    onMount(() => {
        appData.activeDayDate = formatDate(today);
    });
</script>

<div class="card">
    <div class="date-navigator">
        <div class="nav-arrows">
            <button on:click={() => navigate(-1)} title="Previous">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            </button>
        </div>
        <div class="date-display">{dateDisplay}</div>
        <div class="nav-arrows">
            <button on:click={() => navigate(1)} title="Next">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
            </button>
        </div>
        <div class="view-switcher">
            <button on:click={() => currentView = 'week'} class:active={currentView === 'week'} title="Week View">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
            </button>
            <button on:click={() => currentView = 'month'} class:active={currentView === 'month'} title="Month View">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M-7.5 12h13.5" /></svg>
            </button>
            <button on:click={() => currentView = 'year'} class:active={currentView === 'year'} title="Year View">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
            </button>
        </div>
    </div>

    <div class="add-tracker-container">
        <button id="add-tracker-btn" on:click={() => isModalOpen = true}>+ Add Tracker</button>
    </div>
    {#if currentView === 'week'}
        <div class="summary-wrapper">
            {#if isScrollable && showLeftArrow}
            <button class="nav-arrows scroll-arrow left" on:click={() => scrollSummary(-1)} title="Scroll Left">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            </button>
            {/if}

            <div 
                class="weekly-summary"
                class:is-scrollable={isScrollable}
                bind:this={summaryContainer} 
                on:scroll={updateArrowVisibility}
            >
                {#each summaryData as ring (ring.id)}
                    <div class="summary-item">
                        <h3>{ring.name}</h3>
                        <svg class="progress-ring" viewBox="0 0 140 140">
                            <circle class="progress-ring__track" stroke="#e5e7eb" stroke-width="10" fill="transparent" r="60" cx="70" cy="70"/>
                            <circle class="progress-ring__circle" stroke="#28a745" stroke-width="10" fill="transparent" r="60" cx="70" cy="70" style:stroke-dasharray={ring.circumference} style:stroke-dashoffset={ring.offset}/>
                            <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" class="progress-ring__text">
                                <tspan>{ring.consumed.toLocaleString()}</tspan>
                                <tspan x="50%" dy="1.4em" class="progress-ring__label">/ {ring.goal.toLocaleString()} Total</tspan>
                            </text>
                        </svg>
                    </div>
                {/each}
            </div>

            {#if isScrollable && showRightArrow}
            <button class="nav-arrows scroll-arrow right" on:click={() => scrollSummary(1)} title="Scroll Right">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
            </button>
            {/if}
        </div>

        <div class="timeline-container">
            <ul class="timeline">
                {#each displayedWeek as day}
                    <li class="day">
                        <button class="marker" class:past-day={day.date < today} class:current-day={day.dateKey === formatDate(today)} class:active={day.dateKey === appData.activeDayDate} on:click={() => handleDayClick(day.dateKey)}>
                            {dayLabels[day.date.getDay()]}
                        </button>
                    </li>
                {/each}
            </ul>
        </div>

        <div class="day-display">
            {#if activeDay}
                {#if isEditing}
                    <form class="edit-form" on:submit|preventDefault={handleSave}>
                        {#each appData.trackers as tracker (tracker.id)}
                            <div class="form-row">
                                <label for={tracker.id}>{tracker.name}</label>
                                <input type="number" id={tracker.id} bind:value={activeDay.values[tracker.id]}>
                            </div>
                        {/each}
                        <div class="form-actions">
                            <button type="submit" class="edit-btn save-btn">Save</button>
                            <button type="button" class="edit-btn cancel-btn" on:click={() => isEditing = false}>Cancel</button>
                        </div>
                    </form>
                {:else}
                    <h2>{activeDay.name}</h2>
                    <div class="day-stats">
                        {#each appData.trackers as tracker (tracker.id)}
                        <div class="stat-item">
                            <span>{ (activeDay.values[tracker.id] || 0).toLocaleString() }{tracker.id !== 'calories' ? 'g' : ''}</span>
                            <label>{tracker.name}</label>
                        </div>
                        {/each}
                    </div>
                    
                    {#if activeDay.date <= today}
                        <button class="edit-btn" class:past-day-edit={activeDay.date < today} class:current-day-edit={activeDay.dateKey === formatDate(today)} on:click={() => isEditing = true}>
                            Edit
                        </button>
                    {/if}
                {/if}
            {/if}
        </div>

    {:else if currentView === 'month'}
        <div class="day-display"><h2>Monthly View Coming Soon!</h2></div>
    {:else if currentView === 'year'}
        <div class="day-display"><h2>Yearly View Coming Soon!</h2></div>
    {/if}
</div>

{#if isModalOpen}
    <div class="modal-overlay" on:click|self={() => isModalOpen = false}>
        <div class="modal-content">
            <h2>Add New Tracker</h2>
            <form class="modal-form" on:submit|preventDefault={handleAddNewTracker}>
                <input type="text" placeholder="Tracker Name (e.g., Fiber)" required bind:value={newTrackerName}>
                <input type="number" placeholder="Weekly Goal (e.g., 200)" required bind:value={newTrackerGoal}>
                <select disabled><option value="weekly">Weekly</option></select>
                <div class="modal-actions">
                    <button type="button" class="edit-btn cancel-btn" on:click={() => isModalOpen = false}>Cancel</button>
                    <button type="submit" class="edit-btn save-btn">Add</button>
                </div>
            </form>
        </div>
    </div>
{/if}