// Utilitaires pour la carte

// Calculer la distance entre deux points (formule de Haversine)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance en km
}

// Trouver les entreprises les plus proches
function findNearestLocations(userLat, userLng, locations, limit = 5) {
    return locations
        .map(loc => ({
            ...loc,
            distance: calculateDistance(
                userLat, userLng,
                parseFloat(loc.adresse.latitude),
                parseFloat(loc.adresse.longitude)
            )
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, limit);
}

// Formater la distance
function formatDistance(km) {
    if (km < 1) {
        return Math.round(km * 1000) + ' m';
    }
    return km.toFixed(1) + ' km';
}

// Export
window.calculateDistance = calculateDistance;
window.findNearestLocations = findNearestLocations;
window.formatDistance = formatDistance;

