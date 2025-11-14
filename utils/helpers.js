exports.randomCharacters = (length)=>{
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

exports.randomNumber = (length)=>{
    const chars = '0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

exports.getBoundingBox = ( latitude, longitude, radiusKm = 10 ) => {
    const earthRadiusKm = 6371;

    // Approximate degree difference for 1 km
    const deltaLat = radiusKm / 111; // 1° lat ≈ 111 km
    const deltaLng = radiusKm / (111 * Math.cos(latitude * Math.PI / 180)); // adjusted for latitude

    const result = {
        minLat: latitude - deltaLat,
        maxLat: latitude + deltaLat,
        minLng: longitude - deltaLng,
        maxLng: longitude + deltaLng
    };
    console.log(result);
    return result
}

exports.validateGeolocation = (geoLocation) => {
    try {
        if (geoLocation && geoLocation.length !== 0) {
            const parsedLocation = typeof geoLocation === 'string' 
                ? JSON.parse(geoLocation) 
                : geoLocation;
                
            if (Array.isArray(parsedLocation) && parsedLocation.length === 2) {
                console.log('Valid coordinates:', parsedLocation);
                return parsedLocation;
            }else {
                console.log(geoLocation);
                return [];
            }

        } else {
            console.log('Empty or null geoLocation');
            return [];
        }
    } catch (error) {
        console.error('Error parsing geoLocation:', error);
        return [];
    }
}