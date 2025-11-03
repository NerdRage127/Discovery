# Discovery Map - Road Explorer

A web application that reveals roads and paths as you physically travel them, using real-time GPS tracking and OpenStreetMap data. Plan routes using roads you've already discovered and explore new areas.

## Features

- **Real Map Overlay**: Uses OpenStreetMap tiles showing actual roads and geography
- **Road Discovery**: Automatically highlights roads as you travel them via GPS tracking
- **Travel Path Visualization**: See your journey as a green line on the map
- **Route Planning**: Click on traveled roads to plan future exploration routes
- **Distance Tracking**: Monitor total distance traveled
- **Persistent Progress**: Your discovered roads and travel history are saved locally
- **Real-time GPS Tracking**: Continuous location updates for accurate road discovery

## Visual Indicators

- **Gray/Faded**: Undiscovered roads (not yet traveled)
- **Green**: Roads you've traveled with your travel path overlay
- **Blue Dashed**: Planned route connecting selected road segments
- **Orange Marker**: Your current location

## How It Works

1. **GPS Tracking**: The app continuously monitors your location using high-accuracy GPS
2. **Road Discovery**: When you travel on a road, it's automatically detected and marked as discovered
3. **Path Recording**: Your travel path is drawn as a green line showing where you've been
4. **Route Planning**: 
   - Click "Plan Route" button to enter planning mode
   - Click on any traveled road segments to add them to your route
   - The app connects selected points with a blue dashed line
   - Use planned routes to explore new areas and connect discovered roads

## Usage

1. Open `index.html` in a modern web browser
2. Grant location access when prompted
3. Start moving around - roads will be discovered automatically
4. View your travel statistics in the header (distance traveled, roads discovered)
5. Click "Plan Route" to create exploration routes from traveled roads
6. Click "Clear Route" to remove your planned route

## Technical Details

- **Frontend**: HTML, CSS, and JavaScript (ES6+)
- **Mapping**: Leaflet.js with OpenStreetMap tile layer
- **Storage**: Browser localStorage for persistent progress
- **Geolocation**: HTML5 Geolocation API with high accuracy mode
- **Road Detection**: Grid-based proximity detection (can be enhanced with Overpass API for real road data)

## Future Enhancements

- Integration with OpenStreetMap Overpass API for actual road segment data
- Road name display and identification
- Route navigation with turn-by-turn directions
- Export traveled routes as GPX files
- Statistics dashboard with graphs and achievements
- Social features to share discovered routes

## Browser Compatibility

Requires a modern browser with:
- HTML5 Geolocation API support
- localStorage support
- ES6+ JavaScript support
- SVG and Canvas support for map rendering

## Privacy

All location and travel data is stored locally in your browser. No data is sent to external servers except map tile requests to OpenStreetMap.