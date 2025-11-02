# Discovery Map

A web application that tracks your real-world location and reveals places on a map as you discover them in person.

## Features

- **Interactive Map**: View your current location on a real-time map
- **Discovery System**: All locations start as undiscovered (shown in gray/black)
- **Visit Detection**: Locations are automatically discovered when you get within 100 meters
- **Private Locations**: Gated communities, clubs, and other members-only places remain red until you actually visit them
- **Persistent Progress**: Your discoveries are saved in local storage
- **Real-time Tracking**: Continuous geolocation updates to track your movement
- **Visual Indicators**:
  - Gray/Black: Undiscovered locations
  - Green: Discovered locations
  - Red: Private locations (members only) - remain red until visited

## How It Works

1. **Geolocation**: The app uses your browser's geolocation API to track your position
2. **Distance Calculation**: When you move, the app calculates your distance to each location
3. **Discovery**: If you're within 100 meters of a location, it's marked as discovered
4. **Private Places**: Locations marked as "private" (gated communities, exclusive clubs) stay red on the map until you physically visit them, just like any other location
5. **Progress Saving**: All discoveries are saved to your browser's local storage

## Usage

1. Open `index.html` in a web browser
2. Grant location access when prompted
3. Move around in the real world to discover new places
4. Watch as the map updates with your discoveries!

## Technical Details

- **Frontend**: Pure HTML, CSS, and JavaScript
- **Mapping Library**: Leaflet.js with CartoDB dark theme tiles
- **Storage**: Browser localStorage for persistence
- **Geolocation**: HTML5 Geolocation API with high accuracy mode

## Sample Locations

The app includes sample locations in New York City:
- Public places: Central Park, Times Square, Brooklyn Bridge, Metropolitan Museum, Grand Central Terminal
- Private places: Elite Country Club, Luxury Gated Community, Exclusive Golf Club

## Customization

To add your own locations, edit the `locations` array in `app.js`:

```javascript
{
    id: 9,
    name: "Your Location",
    lat: 40.7128,
    lng: -74.0060,
    type: "public", // or "private"
    discovered: false,
    description: "Description of your location"
}
```

## Browser Compatibility

Requires a modern browser with:
- HTML5 Geolocation API support
- localStorage support
- ES6+ JavaScript support

## Privacy

All location data is stored locally in your browser. No data is sent to external servers.