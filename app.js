// Discovery Map Application
class DiscoveryMap {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.userLocation = null;
        this.locations = [];
        this.discoveryRadius = 100; // meters - radius to consider a location "visited"
        
        // Map view state
        this.viewCenter = { lat: 40.7128, lng: -74.0060 }; // Default: New York City
        this.zoom = 13;
        this.scale = 5000; // pixels per degree at base zoom level
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.hoveredLocation = null;
        
        // Performance optimization
        this.renderRequested = false;
        this.lastRenderTime = 0;
        this.renderThrottle = 16; // ~60fps max
        
        this.init();
    }
    
    init() {
        this.initMap();
        this.loadLocations();
        this.loadProgress();
        this.startLocationTracking();
        this.updateStats();
        this.setupEventListeners();
        this.render();
    }
    
    initMap() {
        this.canvas = document.getElementById('map');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        const container = document.getElementById('map-container');
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        this.requestRender();
    }
    
    setupEventListeners() {
        // Mouse events for dragging
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handleMouseUp(e));
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        // Wheel event for zoom
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
    }
    
    handleMouseDown(e) {
        this.isDragging = true;
        this.dragStart = { x: e.clientX, y: e.clientY };
    }
    
    handleMouseMove(e) {
        if (this.isDragging) {
            const dx = e.clientX - this.dragStart.x;
            const dy = e.clientY - this.dragStart.y;
            
            // Update view center
            this.viewCenter.lng -= dx / (this.scale * Math.pow(2, this.zoom - 10));
            this.viewCenter.lat += dy / (this.scale * Math.pow(2, this.zoom - 10));
            
            this.dragStart = { x: e.clientX, y: e.clientY };
            this.requestRender();
        } else {
            // Check for hover
            this.checkHover(e.offsetX, e.offsetY);
        }
    }
    
    handleMouseUp(e) {
        this.isDragging = false;
    }
    
    handleTouchStart(e) {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            this.isDragging = true;
            this.dragStart = { x: touch.clientX, y: touch.clientY };
            e.preventDefault();
        }
    }
    
    handleTouchMove(e) {
        if (this.isDragging && e.touches.length === 1) {
            const touch = e.touches[0];
            const dx = touch.clientX - this.dragStart.x;
            const dy = touch.clientY - this.dragStart.y;
            
            this.viewCenter.lng -= dx / (this.scale * Math.pow(2, this.zoom - 10));
            this.viewCenter.lat += dy / (this.scale * Math.pow(2, this.zoom - 10));
            
            this.dragStart = { x: touch.clientX, y: touch.clientY };
            this.requestRender();
            e.preventDefault();
        }
    }
    
    handleTouchEnd(e) {
        this.isDragging = false;
    }
    
    handleWheel(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.5 : 0.5;
        this.zoom = Math.max(10, Math.min(18, this.zoom + delta));
        this.requestRender();
    }
    
    checkHover(x, y) {
        let foundHover = null;
        
        // Only check visible locations for hover (performance optimization)
        for (const location of this.locations) {
            const pos = this.latLngToCanvas(location.lat, location.lng);
            
            // Skip if marker is off-screen (with margin)
            if (pos.x < -50 || pos.x > this.canvas.width + 50 ||
                pos.y < -50 || pos.y > this.canvas.height + 50) {
                continue;
            }
            
            const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
            
            if (distance < 15) {
                foundHover = location;
                break;
            }
        }
        
        if (foundHover !== this.hoveredLocation) {
            this.hoveredLocation = foundHover;
            this.showLocationInfo(foundHover, x, y);
            this.requestRender();
        }
    }
    
    showLocationInfo(location, x, y) {
        const infoPanel = document.getElementById('location-info');
        
        if (!location) {
            infoPanel.style.display = 'none';
            return;
        }
        
        const statusText = location.discovered ? 'Discovered!' : 
                          (location.type === 'private' ? 'Private - Visit to unlock' : 'Not yet discovered');
        
        infoPanel.innerHTML = `
            <h3>${location.name}</h3>
            <p>${location.description}</p>
            <p><strong>Status:</strong> ${statusText}</p>
            ${location.type === 'private' ? '<p style="color: #f44336;">🔒 Members Only</p>' : ''}
        `;
        
        infoPanel.style.display = 'block';
        infoPanel.style.left = (x + 10) + 'px';
        infoPanel.style.top = (y + 10) + 'px';
    }
    
    latLngToCanvas(lat, lng) {
        const scaleFactor = this.scale * Math.pow(2, this.zoom - 10);
        const x = this.canvas.width / 2 + (lng - this.viewCenter.lng) * scaleFactor;
        const y = this.canvas.height / 2 - (lat - this.viewCenter.lat) * scaleFactor;
        return { x, y };
    }
    
    requestRender() {
        if (this.renderRequested) return;
        
        this.renderRequested = true;
        requestAnimationFrame(() => {
            const now = performance.now();
            
            // Throttle to ~60fps
            if (now - this.lastRenderTime >= this.renderThrottle) {
                this.render();
                this.lastRenderTime = now;
                this.renderRequested = false;
            } else {
                // Schedule another frame if throttled
                this.renderRequested = false;
                this.requestRender();
            }
        });
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid lines for reference (only at higher zoom levels for performance)
        if (this.zoom >= 12) {
            this.drawGrid();
        }
        
        // Draw locations with culling (only draw what's visible)
        this.locations.forEach(location => {
            this.drawLocation(location);
        });
        
        // Draw user location
        if (this.userLocation) {
            this.drawUserLocation();
        }
    }
    
    drawGrid() {
        // Simplified grid drawing for better performance
        this.ctx.strokeStyle = '#2d2d2d';
        this.ctx.lineWidth = 1;
        
        const scaleFactor = this.scale * Math.pow(2, this.zoom - 10);
        const gridSpacing = this.zoom >= 15 ? 0.001 : 0.01; // Adaptive grid density
        
        // Calculate visible bounds
        const margin = 0.05; // degrees
        const lngStart = this.viewCenter.lng - margin;
        const lngEnd = this.viewCenter.lng + margin;
        const latStart = this.viewCenter.lat - margin;
        const latEnd = this.viewCenter.lat + margin;
        
        // Limit grid lines to reduce draw calls
        const maxLines = 20;
        let lineCount = 0;
        
        // Vertical lines
        for (let lng = Math.floor(lngStart * 100) / 100; 
             lng <= lngEnd && lineCount < maxLines; 
             lng += gridSpacing) {
            const pos = this.latLngToCanvas(this.viewCenter.lat, lng);
            if (pos.x >= 0 && pos.x <= this.canvas.width) {
                this.ctx.beginPath();
                this.ctx.moveTo(pos.x, 0);
                this.ctx.lineTo(pos.x, this.canvas.height);
                this.ctx.stroke();
                lineCount++;
            }
        }
        
        lineCount = 0;
        // Horizontal lines
        for (let lat = Math.floor(latStart * 100) / 100; 
             lat <= latEnd && lineCount < maxLines; 
             lat += gridSpacing) {
            const pos = this.latLngToCanvas(lat, this.viewCenter.lng);
            if (pos.y >= 0 && pos.y <= this.canvas.height) {
                this.ctx.beginPath();
                this.ctx.moveTo(0, pos.y);
                this.ctx.lineTo(this.canvas.width, pos.y);
                this.ctx.stroke();
                lineCount++;
            }
        }
    }
    
    drawLocation(location) {
        const pos = this.latLngToCanvas(location.lat, location.lng);
        
        // Culling: Skip markers outside viewport (with margin for hover detection)
        const margin = 50;
        if (pos.x < -margin || pos.x > this.canvas.width + margin ||
            pos.y < -margin || pos.y > this.canvas.height + margin) {
            return;
        }
        
        // Determine color based on discovery state and type
        let fillColor;
        if (!location.discovered) {
            fillColor = location.type === 'private' ? '#f44336' : '#333333';
        } else {
            fillColor = '#4CAF50';
        }
        
        // Draw marker circle
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
        this.ctx.fillStyle = fillColor;
        this.ctx.fill();
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Highlight if hovered
        if (this.hoveredLocation === location) {
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, 12, 0, Math.PI * 2);
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
        }
    }
    
    drawUserLocation() {
        const pos = this.latLngToCanvas(this.userLocation.lat, this.userLocation.lng);
        
        // Draw pulsing circle
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, 10, 0, Math.PI * 2);
        this.ctx.fillStyle = '#2196F3';
        this.ctx.fill();
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        // Draw outer glow
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, 15, 0, Math.PI * 2);
        this.ctx.strokeStyle = 'rgba(33, 150, 243, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }
    
    loadLocations() {
        // Sample locations - mix of public and private places
        // In a real app, these would come from an API
        this.locations = [
            {
                id: 1,
                name: "Central Park",
                lat: 40.7829,
                lng: -73.9654,
                type: "public",
                discovered: false,
                description: "A large public park"
            },
            {
                id: 2,
                name: "Times Square",
                lat: 40.7580,
                lng: -73.9855,
                type: "public",
                discovered: false,
                description: "Famous commercial intersection"
            },
            {
                id: 3,
                name: "Brooklyn Bridge",
                lat: 40.7061,
                lng: -73.9969,
                type: "public",
                discovered: false,
                description: "Historic bridge connecting Manhattan and Brooklyn"
            },
            {
                id: 4,
                name: "Elite Country Club",
                lat: 40.7489,
                lng: -73.9680,
                type: "private",
                discovered: false,
                description: "Private country club - Members only"
            },
            {
                id: 5,
                name: "Luxury Gated Community",
                lat: 40.7289,
                lng: -73.9900,
                type: "private",
                discovered: false,
                description: "Private residential community"
            },
            {
                id: 6,
                name: "Metropolitan Museum",
                lat: 40.7794,
                lng: -73.9632,
                type: "public",
                discovered: false,
                description: "World-famous art museum"
            },
            {
                id: 7,
                name: "Exclusive Golf Club",
                lat: 40.7650,
                lng: -73.9700,
                type: "private",
                discovered: false,
                description: "Private golf club - Membership required"
            },
            {
                id: 8,
                name: "Grand Central Terminal",
                lat: 40.7527,
                lng: -73.9772,
                type: "public",
                discovered: false,
                description: "Historic train station"
            }
        ];
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
                    maximumAge: 10000,
                    timeout: 5000
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
        
        // Center map on user location (only on first update)
        if (isFirstUpdate) {
            this.viewCenter = { lat, lng };
        }
        
        this.requestRender();
        
        // Check for nearby locations to discover
        this.checkDiscoveries();
    }
    
    checkDiscoveries() {
        if (!this.userLocation) return;
        
        let newDiscoveries = false;
        
        this.locations.forEach(location => {
            if (!location.discovered) {
                const distance = this.calculateDistance(
                    this.userLocation.lat,
                    this.userLocation.lng,
                    location.lat,
                    location.lng
                );
                
                // Discover location if within radius
                if (distance <= this.discoveryRadius) {
                    location.discovered = true;
                    newDiscoveries = true;
                    this.updateMarker(location);
                    this.showDiscoveryNotification(location);
                }
            }
        });
        
        if (newDiscoveries) {
            this.saveProgress();
            this.updateStats();
        }
    }
    
    calculateDistance(lat1, lng1, lat2, lng2) {
        // Haversine formula to calculate distance in meters
        const R = 6371e3; // Earth's radius in meters
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
    
    showDiscoveryNotification(location) {
        // Show notification in info panel
        const infoPanel = document.getElementById('info-panel');
        const originalContent = infoPanel.innerHTML;
        
        infoPanel.innerHTML = `<p style="color: #4CAF50; font-weight: bold;">🎉 Discovered: ${location.name}!</p>`;
        
        setTimeout(() => {
            infoPanel.innerHTML = originalContent;
        }, 3000);
        
        this.requestRender();
    }
    
    updateStats() {
        const discovered = this.locations.filter(l => l.discovered).length;
        const total = this.locations.length;
        
        document.getElementById('discovered-count').textContent = `Discovered: ${discovered}`;
        document.getElementById('total-count').textContent = `Total: ${total}`;
    }
    
    saveProgress() {
        const progress = this.locations.map(l => ({
            id: l.id,
            discovered: l.discovered
        }));
        localStorage.setItem('discoveryProgress', JSON.stringify(progress));
    }
    
    loadProgress() {
        const saved = localStorage.getItem('discoveryProgress');
        if (saved) {
            try {
                const progress = JSON.parse(saved);
                progress.forEach(p => {
                    const location = this.locations.find(l => l.id === p.id);
                    if (location) {
                        location.discovered = p.discovered;
                        if (p.discovered) {
                            this.updateMarker(location);
                        }
                    }
                });
            } catch (error) {
                console.error('Error loading progress:', error);
            }
        }
    }
    
    showLocationError() {
        const infoPanel = document.getElementById('info-panel');
        infoPanel.innerHTML = '<p style="color: #f44336;">Location access is required for this app to work. Please enable location services.</p>';
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new DiscoveryMap();
});
