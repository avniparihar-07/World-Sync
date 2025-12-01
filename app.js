const BASE_URL = 'https://worldtimeapi.org/api';
const PEXELS_API_KEY = '6wlCOiyibO5F5WTrXcEA4AOkf7waCJD9dao3z7MQroDAosMFqrg3tmKf';
let allTimezones = [];
let activeClocks = [];
let currentComparisonSource = null;

const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
const clocksContainer = document.getElementById('clocks-container');
const comparisonModal = document.getElementById('comparison-modal');
const closeModalBtn = document.getElementById('close-modal');
const compareSelect = document.getElementById('compare-select');
const comparisonResult = document.getElementById('comparison-result');

// Initialize
async function init() {
  await fetchAllTimezones();
  
  if (allTimezones.length > 0) {
    const ny = allTimezones.find(c => c.timezone === "America/New_York");
    const london = allTimezones.find(c => c.timezone === "Europe/London");
    if (ny) await addClock(ny);
    if (london) await addClock(london);
  }

  searchInput.addEventListener('input', handleSearch);
  closeModalBtn.addEventListener('click', closeComparison);
  comparisonModal.addEventListener('click', (e) => {
    if (e.target === comparisonModal) closeComparison();
  });
  compareSelect.addEventListener('change', handleComparisonSelect);

  setInterval(updateTimes, 1000);
  updateTimes();
}

async function fetchAllTimezones() {
  try {
    const response = await fetch(`${BASE_URL}/timezone`);
    const data = await response.json();
    
    allTimezones = data.map(tz => {
      const parts = tz.split('/');
      const region = parts[0];
      const city = parts[parts.length - 1].replace(/_/g, ' ');
      return {
        name: city,
        country: region,
        timezone: tz,
        image: `https://dummyimage.com/720x400/4a5568/fff&text=${encodeURIComponent(city)}`
      };
    });
  } catch (error) {
    console.error("Error fetching timezones:", error);
    alert("Failed to load timezones from API.");
  }
}

function handleSearch(e) {
  const query = e.target.value.toLowerCase();
  searchResults.innerHTML = '';
  
  if (query.length < 1) {
    searchResults.classList.add('hidden');
    return;
  }

  const matches = allTimezones.filter(city => 
    city.name.toLowerCase().includes(query) || 
    city.country.toLowerCase().includes(query)
  );

  if (matches.length > 0) {
    searchResults.classList.remove('hidden');
    // Limit results to 10 for performance
    matches.slice(0, 10).forEach(city => {
      const div = document.createElement('div');
      div.className = 'p-2 hover:bg-gray-700 cursor-pointer text-white border-b border-gray-700 last:border-0';
      div.textContent = `${city.name}, ${city.country}`;
      div.onclick = () => {
        addClock(city);
        searchInput.value = '';
        searchResults.classList.add('hidden');
      };
      searchResults.appendChild(div);
    });
  } else {
    searchResults.classList.add('hidden');
  }
}

async function addClock(city) {
  if (activeClocks.find(c => c.timezone === city.timezone)) return; // Prevent duplicates

  try {
    const [tzResult, imageResult] = await Promise.allSettled([
      fetch(`${BASE_URL}/timezone/${city.timezone}`),
      fetchCityImage(city.name, city.country)
    ]);

    let utc_offset = city.utc_offset;
    let abbreviation = city.abbreviation;
    let image = city.image;

    if (tzResult.status === 'fulfilled') {
      try {
        const tzData = await tzResult.value.json();
        utc_offset = tzData.utc_offset;
        abbreviation = tzData.abbreviation;
      } catch (e) {
        console.error('Failed to parse timezone response for', city.timezone);
      }
    }

    if (imageResult.status === 'fulfilled' && imageResult.value) {
      image = imageResult.value;
    }

    const cityWithDetails = {
      ...city,
      utc_offset,
      abbreviation,
      image
    };

    activeClocks.push(cityWithDetails);
    renderClocks();
  } catch (error) {
    console.error("Error fetching city details:", error);
    // Fallback if API fails for specific city
    activeClocks.push(city);
    renderClocks();
  }
}

async function fetchCityImage(cityName, region) {
  const themes = ['city', 'landscape', 'architecture', 'skyline', 'nature'];
  const randomTheme = themes[Math.floor(Math.random() * themes.length)];
  const queries = [`${cityName} ${randomTheme}`, `${region} ${randomTheme}`, randomTheme];

  if (PEXELS_API_KEY && PEXELS_API_KEY.length > 0) {
    try {
      for (let q of queries) {
        const page = Math.floor(Math.random() * 50) + 1;
        const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=1&orientation=landscape&page=${page}`;
        const res = await fetch(url, { headers: { Authorization: PEXELS_API_KEY } });
        if (res.ok) {
          const data = await res.json();
          if (data.photos && data.photos.length > 0) {
            return data.photos[0].src.medium;
          }
        }
      }

      const curatedPage = Math.floor(Math.random() * 50) + 1;
      const curatedRes = await fetch(`https://api.pexels.com/v1/curated?per_page=1&page=${curatedPage}`, { headers: { Authorization: PEXELS_API_KEY } });
      if (curatedRes.ok) {
        const curatedData = await curatedRes.json();
        if (curatedData.photos && curatedData.photos.length > 0) {
          return curatedData.photos[0].src.medium;
        }
      }
    } catch (err) {
      console.error('Pexels API error:', err);
    }
  }

  const unsplashQuery = `${cityName} ${randomTheme}`.trim();
  return `https://source.unsplash.com/720x400/?${encodeURIComponent(unsplashQuery)}`;
}

function removeClock(cityName) {
  activeClocks = activeClocks.filter(c => c.name !== cityName);
  renderClocks();
}

function renderClocks() {
  clocksContainer.innerHTML = '';
  activeClocks.forEach(city => {
    const card = document.createElement('div');
    card.className = 'p-4 clock-card';
    card.innerHTML = `
      <div class="h-full bg-gray-800 bg-opacity-40 p-8 rounded-lg overflow-hidden text-center relative card-hover border border-gray-700">
        <button onclick="removeClock('${city.name}')" class="absolute top-2 right-2 text-gray-500 hover:text-red-500">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        <img class="lg:h-48 md:h-36 w-full object-cover object-center mb-6 rounded" src="${city.image}" alt="${city.name}">
        <h2 class="tracking-widest text-xs title-font font-medium text-gray-400 mb-1">${city.country.toUpperCase()} ${city.utc_offset ? `(${city.utc_offset})` : ''}</h2>
        <h1 class="title-font sm:text-2xl text-xl font-medium text-white mb-3">${city.name}</h1>
        <p class="leading-relaxed mb-3 text-4xl font-bold text-indigo-400 time-display" data-timezone="${city.timezone}">--:--:--</p>
        <p class="text-gray-500 text-sm mb-4 date-display" data-timezone="${city.timezone}">--</p>
        <div class="text-center mt-4">
          <button onclick="openComparison('${city.name}')" class="inline-flex text-white bg-indigo-500 border-0 py-1 px-4 focus:outline-none hover:bg-indigo-600 rounded text-sm">Compare</button>
        </div>
      </div>
    `;
    clocksContainer.appendChild(card);
  });
  updateTimes();
}

function updateTimes() {
  const timeDisplays = document.querySelectorAll('.time-display');
  const dateDisplays = document.querySelectorAll('.date-display');

  timeDisplays.forEach(display => {
    const timezone = display.getAttribute('data-timezone');
    const now = new Date();
    const timeString = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: timezone,
      hour12: true
    }).format(now);
    display.textContent = timeString;
  });

  dateDisplays.forEach(display => {
    const timezone = display.getAttribute('data-timezone');
    const now = new Date();
    const dateString = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: timezone
    }).format(now);
    display.textContent = dateString;
  });
}

function openComparison(cityName) {
  currentComparisonSource = activeClocks.find(c => c.name === cityName);
  if (!currentComparisonSource) return;

  document.getElementById('source-city').textContent = currentComparisonSource.name;
  compareSelect.innerHTML = '<option value="">Select a city...</option>';
  activeClocks.forEach(city => {
    if (city.name !== currentComparisonSource.name) {
      const option = document.createElement('option');
      option.value = city.name;
      option.textContent = `${city.name}, ${city.country}`;
      compareSelect.appendChild(option);
    }
  });

  comparisonResult.classList.add('hidden');
  comparisonModal.classList.remove('hidden');
}

function closeComparison() {
  comparisonModal.classList.add('hidden');
  currentComparisonSource = null;
}

function handleComparisonSelect(e) {
  const targetCityName = e.target.value;
  if (!targetCityName || !currentComparisonSource) {
    comparisonResult.classList.add('hidden');
    return;
  }

  const targetCity = activeClocks.find(c => c.name === targetCityName);
  
  const now = new Date();
  const sourceDateStr = new Date().toLocaleString("en-US", { timeZone: currentComparisonSource.timezone });
  const targetDateStr = new Date().toLocaleString("en-US", { timeZone: targetCity.timezone });
  
  const sourceDate = new Date(sourceDateStr);
  const targetDate = new Date(targetDateStr);
  
  const diffMs = targetDate - sourceDate;
  const diffHours = Math.floor(Math.abs(diffMs) / 3600000);
  const diffMinutes = Math.floor((Math.abs(diffMs) % 3600000) / 60000);
  
  const isAhead = diffMs >= 0;
  
  document.getElementById('target-city').textContent = targetCity.name;
  document.getElementById('time-diff').textContent = `${diffHours}h ${diffMinutes > 0 ? diffMinutes + 'm' : ''}`;
  document.getElementById('ahead-behind').textContent = isAhead ? 'ahead' : 'behind';
  
  // Show target time
  const targetTimeStr = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: targetCity.timezone,
    hour12: true
  }).format(now);
  
  document.getElementById('target-time-display').textContent = `Current time in ${targetCity.name}: ${targetTimeStr}`;

  comparisonResult.classList.remove('hidden');
}

// Start the app
init();
