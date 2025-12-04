⏱️ WorldSync – World Clock, Weather & Time Comparison App

WorldSync is an interactive web application that allows users to search global cities, add live clocks, view real-time weather, compare time zones, and switch between dark/light themes — all in a beautifully responsive UI.

🚀 Features
🔍 1. City Search with Autocomplete

Search any city using the search bar

Autocomplete suggestions update dynamically

Press Enter to add the selected city’s live clock

🕒 2. Live World Clocks

Each city card displays:

Current time (auto-updated every second)

Current date

Country & timezone offset

Dynamic city image

Weather information (temperature, wind speed, weather condition)

Clock cards include a remove button to delete a city.

🌤️ 3. Weather Integration

Powered by Open-Meteo API, the app fetches:

Temperature (°C)

Windspeed

Weather condition (mapped from weather codes)

Weather refreshes automatically every 10 minutes.

🌆 4. Dynamic City Images

Images fetched using Pexels API

Fallback to Unsplash when needed

Provides unique visuals for each city

🔀 5. Time Comparison Modal

Compare the time difference between two active cities:

Shows hour/minute difference

Tells whether a city is ahead or behind

Displays real-time time in the target city

🌙 6. Dark Mode Toggle

One-click theme switch

Smooth UI adaptation

Custom CSS for enhanced visuals

🛠️ Tech Stack
Technology	Purpose
HTML5 / CSS3 / Tailwind	UI & Styling
JavaScript (Vanilla)	Core Logic
WorldTimeAPI	Timezone Data
Open-Meteo API	Weather Data
Pexels API / Unsplash	Dynamic Images
Custom CSS	Dark Mode & Animations

⚙️ How It Works
1. Load All Timezones

The app fetches a list of global timezones via WorldTimeAPI.

2. Add a City

Adding a city triggers:

Coordinates lookup

Weather fetch

Timezone details

City image retrieval

Clock card rendering

3. Live Clock Updates

Times and dates refresh every second using Intl.DateTimeFormat.

4. Compare Time

Calculates real-time difference between two cities using JS Date objects.