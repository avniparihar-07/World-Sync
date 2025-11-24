const BASE_URL = 'https://worldtimeapi.org/api';

let allTimezones = [];

const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');

// Initialize
async function init() {
  await fetchAllTimezones();

  // Enable live search
  searchInput.addEventListener('input', handleSearch);
}

// Fetch all timezones
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
      };
    });
  } catch (error) {
    console.error("Error fetching timezones:", error);
    alert("Failed to load timezones from API.");
  }
}

// Handle search input
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

      // NO clock-adding action — just hides after click
      div.onclick = () => {
        searchInput.value = `${city.name}, ${city.country}`;
        searchResults.classList.add('hidden');
      };

      searchResults.appendChild(div);
    });
  } else {
    searchResults.classList.add('hidden');
  }
}

// Start app
init();
