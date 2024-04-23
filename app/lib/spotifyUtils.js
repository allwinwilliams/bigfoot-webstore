export default async function fetchSpotifyData(trackId, accessToken) {
    
    if (!trackId) {
        console.error('Invalid track ID');
        return;
    }

    console.log("FETCH SPOTIFY WITH", `https://api.spotify.com/v1/tracks/${trackId}`);

    console.log("TOKEN", accessToken);
    const requestOptions = {
        method: 'GET',
        headers: {'Authorization': `Bearer ${accessToken}`},
      };
    try {
        // Fetch track details from Spotify API
        const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, requestOptions);
        if (!response.ok) {
            throw new Error(`Failed to fetch song data: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        console.log("Spotify data for Canvas:", data);
        return data;
    } catch (error) {
        console.error("Error fetching Spotify data:", error);
        return null;  // Return null or a default object as per error handling logic
    }
}