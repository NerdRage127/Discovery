// Discovery Map - Road Explorer Application
class RoadDiscoveryMap {
    constructor() {
        this.map = null;
        this.userLocation = null;
        this.userMarker = null;
        this.travelPath = [];
        this.discoveredRoads = new Set();
        this.roadSegments = new Map();
        this.plannedRoute = [];
        this.routePlanningMode = false;
        this.totalDistance = 0;
        
        // Road discovery settings
        this.discoveryRadius = 20; // meters - how close to be to a road to discover it
        this.pathUpdateInterval = 5000; // Update path every 5 seconds
        this.lastPathUpdate = 0;
        
        this.init();
    }
    
    init() {
        this.initMap();
        this.setupEventListeners();
        this.startLocationTracking();
        this.loadProgress();
        this.updateStats();
    }
    
    initMap() {
        // Initialize Leaflet map with OpenStreetMap tiles
        this.map = L.map('map').setView([40.7128, -74.0060], 13);
        
        // Add OpenStreetMap tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(this.map);
        
        // Add click handler for route planning
        this.map.on('click', (e) => this.handleMapClick(e));
    }
    
    setupEventListeners() {
        const routeModeBtn = document.getElementById('route-mode-btn');
        const clearRouteBtn = document.getElementById('clear-route-btn');
        
        routeModeBtn.addEventListener('click', () => {
            this.routePlanningMode = !this.routePlanningMode;
            
            if (this.routePlanningMode) {
                routeModeBtn.classList.add('active');
                routeModeBtn.textContent = '✓ Planning Mode';
                clearRouteBtn.style.display = 'block';
                this.showInfo('Click on traveled roads to plan your route');
            } else {
                routeModeBtn.classList.remove('active');
                routeModeBtn.textContent = '📍 Plan Route';
                clearRouteBtn.style.display = this.plannedRoute.length > 0 ? 'block' : 'none';
            }
        });
        
        clearRouteBtn.addEventListener('click', () => {
            this.clearPlannedRoute();
        });
    }
    
    startLocationTracking() {
        if ('geolocation' in navigator) {
            navigator.geolocation.watchPosition(
                (position) => {
                    this.updateUserLocation(position);
                },
                (error) => {
                    console.error('Error getting location:', error);
                    this.showLocationError();
                },
                {
                    enableHighAccuracy: true,
                    maximumAge: 5000,
                    timeout: 10000
                }
            );
        } else {
            this.showLocationError();
        }
    }
    
    updateUserLocation(position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        const isFirstUpdate = !this.userLocation;
        this.userLocation = { lat, lng };
        
        // Update or create user marker
        if (this.userMarker) {
            this.userMarker.setLatLng([lat, lng]);
        } else {
            // Create custom icon for user location
            const userIcon = L.divIcon({
                className: 'user-location-marker',
                html: '<div style="width: 16px; height: 16px; background-color: #FF9800; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(255,152,0,0.8);"></div>',
                iconSize: [16, 16],
                iconAnchor: [8, 8]
            });
            
            this.userMarker = L.marker([lat, lng], { icon: userIcon })
                .addTo(this.map)
                .bindPopup('You are here!');
            
            // Center map on user location (only on first update)
            if (isFirstUpdate) {
                this.map.setView([lat, lng], 16);
            }
        }
        
        // Add to travel path
        this.travelPath.push({ lat, lng, timestamp: Date.now() });
        
        // Update path and check for nearby roads periodically
        const now = Date.now();
        if (now - this.lastPathUpdate >= this.pathUpdateInterval) {
            this.updateTravelPath();
            this.checkNearbyRoads();
            this.lastPathUpdate = now;
        }
    }
    
    updateTravelPath() {
        // Keep only recent path points (last 24 hours)
        const cutoffTime = Date.now() - (24 * 60 * 60 * 1000);
        this.travelPath = this.travelPath.filter(p => p.timestamp > cutoffTime);
        
        // Draw the travel path
        if (this.travelPath.length > 1) {
            const pathCoords = this.travelPath.map(p => [p.lat, p.lng]);
            
            // Remove old path polyline if exists
            if (this.pathPolyline) {
                this.map.removeLayer(this.pathPolyline);
            }
            
            // Draw new path
            this.pathPolyline = L.polyline(pathCoords, {
                color: '#4CAF50',
                weight: 3,
                opacity: 0.7,
                smoothFactor: 1
            }).addTo(this.map);
            
            // Calculate total distance
            this.calculateTotalDistance();
        }
    }
    
    async checkNearbyRoads() {
        if (!this.userLocation) return;
        
        // In a real implementation, this would query OpenStreetMap's Overpass API
        // to get actual road data near the user's location
        // For now, we'll create a simplified version that detects road proximity
        
        // Simulate road discovery based on user movement
        const roadId = this.generateRoadId(this.userLocation);
        
        if (!this.discoveredRoads.has(roadId)) {
            this.discoverRoad(roadId, this.userLocation);
        }
    }
    
    generateRoadId(location) {
        // Generate a grid-based road ID (simplified approach)
        const gridSize = 0.001; // approximately 100 meters
        const gridLat = Math.floor(location.lat / gridSize);
        const gridLng = Math.floor(location.lng / gridSize);
        return `road_${gridLat}_${gridLng}`;
    }
    
    discoverRoad(roadId, location) {
        this.discoveredRoads.add(roadId);
        
        // Store road segment
        this.roadSegments.set(roadId, {
            id: roadId,
            center: location,
            discovered: true,
            timestamp: Date.now()
        });
        
        // Draw discovered road segment
        this.drawRoadSegment(roadId);
        
        // Save progress
        this.saveProgress();
        this.updateStats();
        
        // Show notification
        this.showInfo(`New road discovered! Total: ${this.discoveredRoads.size}`);
    }
    
    drawRoadSegment(roadId) {
        const segment = this.roadSegments.get(roadId);
        if (!segment) return;
        
        // Create a small circle to represent the discovered road segment
        const circle = L.circle([segment.center.lat, segment.center.lng], {
            color: '#4CAF50',
            fillColor: '#4CAF50',
            fillOpacity: 0.3,
            radius: 50, // 50 meter radius
            weight: 2
        }).addTo(this.map);
        
        circle.bindPopup(`<b>Discovered Road</b><br>Traveled: ${new Date(segment.timestamp).toLocaleString()}`);
        
        segment.layer = circle;
    }
    
    handleMapClick(e) {
        if (!this.routePlanningMode) return;
        
        const clickedLat = e.latlng.lat;
        const clickedLng = e.latlng.lng;
        
        // Check if clicked near a discovered road
        let nearestRoad = null;
        let minDistance = Infinity;
        
        for (const [roadId, segment] of this.roadSegments) {
            const distance = this.calculateDistance(
                clickedLat, clickedLng,
                segment.center.lat, segment.center.lng
            );
            
            if (distance < 100 && distance < minDistance) {
                minDistance = distance;
                nearestRoad = { roadId, segment };
            }
        }
        
        if (nearestRoad) {
            this.addToPlannedRoute(nearestRoad.roadId, nearestRoad.segment);
        } else {
            this.showInfo('Please click on a traveled road segment');
        }
    }
    
    addToPlannedRoute(roadId, segment) {
        // Check if already in route
        if (this.plannedRoute.find(r => r.roadId === roadId)) {
            this.showInfo('Road segment already in route');
            return;
        }
        
        this.plannedRoute.push({ roadId, segment });
        
        // Draw route segment
        const marker = L.circleMarker([segment.center.lat, segment.center.lng], {
            radius: 8,
            fillColor: '#2196F3',
            color: '#ffffff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(this.map);
        
        marker.bindPopup(`<b>Route Point ${this.plannedRoute.length}</b><br>Click to remove`);
        marker.on('click', () => this.removeFromPlannedRoute(roadId));
        
        segment.routeMarker = marker;
        
        // Draw line connecting route points
        this.drawRoutePath();
        
        this.showInfo(`Added to route (${this.plannedRoute.length} points)`);
        document.getElementById('clear-route-btn').style.display = 'block';
    }
    
    removeFromPlannedRoute(roadId) {
        const index = this.plannedRoute.findIndex(r => r.roadId === roadId);
        if (index === -1) return;
        
        const item = this.plannedRoute[index];
        if (item.segment.routeMarker) {
            this.map.removeLayer(item.segment.routeMarker);
        }
        
        this.plannedRoute.splice(index, 1);
        this.drawRoutePath();
        
        if (this.plannedRoute.length === 0) {
            document.getElementById('clear-route-btn').style.display = 'none';
        }
    }
    
    drawRoutePath() {
        // Remove old route path
        if (this.routePathPolyline) {
            this.map.removeLayer(this.routePathPolyline);
        }
        
        if (this.plannedRoute.length < 2) return;
        
        // Draw path connecting route points
        const routeCoords = this.plannedRoute.map(r => [r.segment.center.lat, r.segment.center.lng]);
        
        this.routePathPolyline = L.polyline(routeCoords, {
            color: '#2196F3',
            weight: 4,
            opacity: 0.7,
            dashArray: '10, 10'
        }).addTo(this.map);
    }
    
    clearPlannedRoute() {
        // Remove all route markers
        this.plannedRoute.forEach(item => {
            if (item.segment.routeMarker) {
                this.map.removeLayer(item.segment.routeMarker);
            }
        });
        
        // Remove route path
        if (this.routePathPolyline) {
            this.map.removeLayer(this.routePathPolyline);
        }
        
        this.plannedRoute = [];
        document.getElementById('clear-route-btn').style.display = 'none';
        this.showInfo('Route cleared');
    }
    
    calculateDistance(lat1, lng1, lat2, lng2) {
        // Haversine formula to calculate distance in meters
        const R = 6371e3;
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lng2 - lng1) * Math.PI / 180;
        
        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        
        return R * c;
    }
    
    calculateTotalDistance() {
        let distance = 0;
        
        for (let i = 1; i < this.travelPath.length; i++) {
            const prev = this.travelPath[i - 1];
            const curr = this.travelPath[i];
            distance += this.calculateDistance(prev.lat, prev.lng, curr.lat, curr.lng);
        }
        
        this.totalDistance = distance;
    }
    
    updateStats() {
        const distanceKm = (this.totalDistance / 1000).toFixed(1);
        document.getElementById('distance-traveled').textContent = `Distance: ${distanceKm} km`;
        document.getElementById('roads-discovered').textContent = `Roads: ${this.discoveredRoads.size}`;
    }
    
    showInfo(message) {
        const infoPanel = document.getElementById('info-panel');
        const originalContent = infoPanel.innerHTML;
        
        infoPanel.innerHTML = `<p style="color: #4CAF50; font-weight: bold;">ℹ️ ${message}</p>`;
        
        setTimeout(() => {
            infoPanel.innerHTML = originalContent;
        }, 3000);
    }
    
    showLocationError() {
        const infoPanel = document.getElementById('info-panel');
        infoPanel.innerHTML = '<p style="color: #f44336;">⚠️ Location access is required. Please enable location services.</p>';
    }
    
    saveProgress() {
        const progress = {
            discoveredRoads: Array.from(this.discoveredRoads),
            roadSegments: Array.from(this.roadSegments.entries()).map(([id, segment]) => ({
                id,
                center: segment.center,
                timestamp: segment.timestamp
            })),
            totalDistance: this.totalDistance
        };
        
        localStorage.setItem('roadDiscoveryProgress', JSON.stringify(progress));
    }
    
    loadProgress() {
        const saved = localStorage.getItem('roadDiscoveryProgress');
        if (!saved) return;
        
        try {
            const progress = JSON.parse(saved);
            
            // Restore discovered roads
            this.discoveredRoads = new Set(progress.discoveredRoads || []);
            
            // Restore road segments
            if (progress.roadSegments) {
                progress.roadSegments.forEach(segment => {
                    this.roadSegments.set(segment.id, {
                        id: segment.id,
                        center: segment.center,
                        discovered: true,
                        timestamp: segment.timestamp
                    });
                    this.drawRoadSegment(segment.id);
                });
            }
            
            this.totalDistance = progress.totalDistance || 0;
        } catch (error) {
            console.error('Error loading progress:', error);
        }
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new RoadDiscoveryMap();
});
