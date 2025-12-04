const BASE_URL = 'https://worldtimeapi.org/api';
const PEXELS_API_KEY = '6wlCOiyibO5F5WTrXcEA4AOkf7waCJD9dao3z7MQroDAosMFqrg3tmKf';
const API_WEATHER = "https://api.open-meteo.com/v1/forecast";

let allTimezones = [];
let activeClocks = [];
let currentComparisonSource = null;
let selectedCity = null;


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
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();

      // Only add the city the user selected
      if (selectedCity) {
        addClock(selectedCity);
        selectedCity = null;
        searchInput.value = "";
        searchResults.classList.add("hidden");
      }
    }
  });

  closeModalBtn.addEventListener('click', closeComparison);
  comparisonModal.addEventListener('click', (e) => {
    if (e.target === comparisonModal) closeComparison();
  });
  compareSelect.addEventListener('change', handleComparisonSelect);

  setInterval(updateTimes, 1000);
  updateTimes();

  // Weather update every 10 minutes
  setInterval(updateWeatherForAll, 600000);
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
    matches.slice(0, 10).forEach(city => {
      const div = document.createElement('div');
      div.className = 'p-2 hover:bg-gray-700 cursor-pointer text-white border-b border-gray-700 last:border-0';
      div.textContent = `${city.name}, ${city.country}`;
      div.onclick = () => {
        selectedCity = city;  // store selected city
        searchInput.value = `${city.name}, ${city.country}`;
        searchResults.classList.add('hidden');
      };

      searchResults.appendChild(div);
    });
  } else {
    searchResults.classList.add('hidden');
  }
}

async function getCoordinates(cityName, timezone) {
  try {
    // Try city-based search first
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.results && data.results.length > 0) {
      return {
        lat: data.results[0].latitude,
        lon: data.results[0].longitude
      };
    }

    // Fallback: use TIMEZONE LOCATION
    const tzRes = await fetch(`${BASE_URL}/timezone/${timezone}`);
    const tzData = await tzRes.json();

    if (tzData.latitude && tzData.longitude) {
      return {
        lat: tzData.latitude,
        lon: tzData.longitude
      };
    }
  } catch (e) {
    console.error("Coordinate fetch failed:", e);
  }
  return null;
}


async function fetchWeather(lat, lon) {
  try {
    const url = `${API_WEATHER}?latitude=${lat}&longitude=${lon}&current_weather=true`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.current_weather) {
      return {
        temperature: data.current_weather.temperature,
        wind: data.current_weather.windspeed,
        weather_code: data.current_weather.weathercode
      };
    }
  } catch (err) {
    console.error("Weather fetch failed:", err);
  }

  return null;
}

async function addClock(city) {
  if (activeClocks.find(c => c.timezone === city.timezone)) return;

  try {
    const coords = await getCoordinates(city.name);
    let weather = null;

    if (coords) {
      weather = await fetchWeather(coords.lat, coords.lon);
    }

    const tzRes = await fetch(`${BASE_URL}/timezone/${city.timezone}`);
    const tzData = await tzRes.json();

    const cityWithDetails = {
      ...city,
      utc_offset: tzData.utc_offset,
      abbreviation: tzData.abbreviation,
      weather: weather
    };
    cityWithDetails.image = await fetchCityImage(city.name, city.country);

    activeClocks.push(cityWithDetails);
    renderClocks();
  } catch (error) {
    console.error("Error loading city data:", error);
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
        const page = Math.floor(Math.random() * 10) + 1;

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

function getWeatherDescription(code) {
  const map = {
    0: "Clear",
    1: "Mainly Clear",
    2: "Partly Cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Heavy Fog",
    51: "Light Drizzle",
    61: "Rain",
    71: "Snow",
    95: "Thunderstorm"
  };
  return map[code] || "Weather";
}

function renderClocks() {
  clocksContainer.innerHTML = '';
  activeClocks.forEach(city => {
    const weather = city.weather
      ? `
        <p class="text-gray-300 text-sm mt-2">
          🌡️ ${city.weather.temperature}°C  
          • ${getWeatherDescription(city.weather.weather_code)}  
          • 💨 ${city.weather.wind} km/h
        </p>`
      : `<p class="text-gray-300 text-sm mt-2">Weather unavailable</p>`;

    const card = document.createElement('div');
    card.className = 'p-4 clock-card';
    card.innerHTML = `
      <div class="h-full bg-gray-800 bg-opacity-40 p-8 rounded-lg overflow-hidden text-center relative card-hover border border-gray-700">
        <button onclick="removeClock('${city.timezone}')" class="absolute top-2 right-2 text-gray-500 hover:text-red-500">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        <img class="lg:h-48 md:h-36 w-full object-cover object-center mb-6 rounded" 
          src="${city.image}" 
          alt="${city.name}" 
          onerror="this.src='https://source.unsplash.com/720x400/?nature'">
        <h2 class="tracking-widest text-xs title-font font-medium text-gray-400 mb-1">
           ${city.country.toUpperCase()} (${city.utc_offset})
        </h2>
        <h1 class="title-font sm:text-2xl text-xl font-medium text-white mb-3">${city.name}</h1>
        <p class="leading-relaxed mb-3 text-4xl font-bold text-indigo-400 time-display" 
          data-timezone="${city.timezone}">--:--:--</p>
        <p class="text-gray-500 text-sm mb-4 date-display" 
          data-timezone="${city.timezone}">--</p>
        ${weather}
        <div class="text-center mt-4">
          <button onclick="openComparison('${city.timezone}')" 
            class="inline-flex text-white bg-indigo-500 border-0 py-1 px-4 focus:outline-none hover:bg-indigo-600 rounded text-sm">
            Compare
          </button>
        </div>
      </div>
    `;
    clocksContainer.appendChild(card);
  });
  updateTimes();
}

async function updateWeatherForAll() {
  for (let city of activeClocks) {
    const coords = await getCoordinates(city.name);
    if (coords) {
      city.weather = await fetchWeather(coords.lat, coords.lon);
    }
  }
  renderClocks();
}

function removeClock(timezone) {
  activeClocks = activeClocks.filter(c => c.timezone !== timezone);
  renderClocks();
}

function updateTimes() {
  const timeDisplays = document.querySelectorAll('.time-display');
  const dateDisplays = document.querySelectorAll('.date-display');

  timeDisplays.forEach(display => {
    const timezone = display.getAttribute('data-timezone');
    const now = new Date();
    display.textContent = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: timezone,
      hour12: true
    }).format(now);
  });

  dateDisplays.forEach(display => {
    const timezone = display.getAttribute('data-timezone');
    const now = new Date();
    display.textContent = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: timezone
    }).format(now);
  });
}

function openComparison(timezone) {
  currentComparisonSource = activeClocks.find(c => c.timezone === timezone);
  if (!currentComparisonSource) return;

  document.getElementById('source-city').textContent = currentComparisonSource.name;
  compareSelect.innerHTML = '<option value="">Select a city...</option>';

  activeClocks.forEach(city => {
    if (city.timezone !== currentComparisonSource.timezone) {
      const option = document.createElement('option');
      option.value = city.timezone;
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
  const targetTimezone = e.target.value;
  if (!targetTimezone || !currentComparisonSource) {
    comparisonResult.classList.add('hidden');
    return;
  }

  const targetCity = activeClocks.find(c => c.timezone === targetTimezone);

  const now = new Date();
  const sourceDateStr = now.toLocaleString("en-US", { timeZone: currentComparisonSource.timezone });
  const targetDateStr = now.toLocaleString("en-US", { timeZone: targetCity.timezone });

  const sourceDate = new Date(sourceDateStr);
  const targetDate = new Date(targetDateStr);

  const diffMs = targetDate - sourceDate;
  const diffHours = Math.floor(Math.abs(diffMs) / 3600000);
  const diffMinutes = Math.floor((Math.abs(diffMs) % 3600000) / 60000);

  const isAhead = diffMs >= 0;

  document.getElementById('target-city').textContent = targetCity.name;
  document.getElementById('time-diff').textContent = `${diffHours}h ${diffMinutes ? diffMinutes + 'm' : ''}`;
  document.getElementById('ahead-behind').textContent = isAhead ? 'ahead' : 'behind';

  const targetTimeStr = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: targetCity.timezone,
    hour12: true
  }).format(now);

  document.getElementById('target-time-display').textContent =
    `Current time in ${targetCity.name}: ${targetTimeStr}`;

  comparisonResult.classList.remove('hidden');
}

init();
const btn = document.getElementById("theme-toggle");
let isDark = true;

btn.addEventListener("click", () => {
  document.body.classList.toggle("dark");

  if (isDark) {
    btn.textContent = "☀️";  
  } else {
    btn.textContent = "🌙";  
  }

  isDark = !isDark;
});
