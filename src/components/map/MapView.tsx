

import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, ZoomControl, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Post, Coordinates } from '../../types/index.ts';

// A mapping of categories to their visual properties
const categoryStyles: { [key: string]: { icon: string; color: string } } = {
  general: { icon: 'flame', color: '#f59e0b' }, // amber-500
  party: { icon: 'party', color: '#ec4899' }, // pink-500
  food: { icon: 'food', color: '#f97316' }, // orange-500
  music: { icon: 'music', color: '#3b82f6' }, // blue-500
  art: { icon: 'art', color: '#10b981' }, // emerald-500
  default: { icon: 'flame', color: '#f59e0b' },
};

const getSvgIcon = (iconName: string, color: string): string => {
  const commonProps = `width="36" height="36" viewBox="0 0 24 24" stroke-width="1.5" stroke="#ffffff" fill="${color}" stroke-linecap="round" stroke-linejoin="round"`;
  switch (iconName) {
    case 'party':
      return `<svg xmlns="http://www.w3.org/2000/svg" ${commonProps}><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 5h16a1 1 0 0 1 1 1v3a1 1 0 0 1 -1 1h-16a1 1 0 0 1 -1 -1v-3a1 1 0 0 1 1 -1z" /><path d="M12 5v-2" /><path d="M12 10v12" /><path d="M15 14h-6" /></svg>`; // Gift Box
    case 'food':
      return `<svg xmlns="http://www.w3.org/2000/svg" ${commonProps}><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 15h16a1 1 0 0 0 1 -1v-2a1 1 0 0 0 -1 -1H4a1 1 0 0 0 -1 1v2a1 1 0 0 0 1 1z" /><path d="M18 15v3a1 1 0 0 1 -1 1H7a1 1 0 0 1 -1 -1v-3" /><path d="M4 11V8a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v3" /></svg>`; // Burger
    case 'music':
      return `<svg xmlns="http://www.w3.org/2000/svg" ${commonProps}><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 17a3 3 0 1 0 6 0a3 3 0 0 0-6 0" /><path d="M9 17V4h10v13" /><path d="M9 8h10" /></svg>`; // Music note
    case 'art':
      return `<svg xmlns="http://www.w3.org/2000/svg" ${commonProps}><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 21a9 9 0 0 1 0-18a9 8 0 0 1 9 8a4.5 4 0 0 1-4.5 4H10a2 2 0 0 0-1 3.75A1.3 1.3 0 0 1 7.75 21" /><path d="M8.5 10.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M12.5 7.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M16.5 10.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /></svg>`; // Palette
    case 'flame':
    default:
      return `<svg xmlns="http://www.w3.org/2000/svg" ${commonProps}><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M12 12c2 -2.96 0 -7 -1 -8c-1 -1 -2.5 -1 -3.5 0c-1.988 1.988 -2 4.714 -1 8c1.5 4.5 6 3 6 3"></path><path d="M16 12c1.5 -2 1.5 -6 0 -8c-1.5 -2 -3.5 -2 -5 0c-2.472 2.472 -2.5 6.344 -1 9.5c2 4.5 7 2.5 7 2.5"></path></svg>`;
  }
};

const iconCache: { [key: string]: L.DivIcon } = {};

const getMarkerIcon = (category: string): L.DivIcon => {
    const style = categoryStyles[category] || categoryStyles.default;
    const cacheKey = category;

    if (iconCache[cacheKey]) {
        return iconCache[cacheKey];
    }
    
    const shadowColor = style.color;
    
    const iconHtml = `
      <div class="event-marker-icon" style="--shadow-color1: ${shadowColor}99; --shadow-color2: ${shadowColor};">
        ${getSvgIcon(style.icon, style.color)}
      </div>
    `.replace(/\s\s+/g, ' ');

    const icon = new L.DivIcon({
        html: iconHtml,
        className: '', // No extra class on the wrapper
        iconSize: [36, 36],
        iconAnchor: [18, 36], // Anchor at the bottom center
    });

    iconCache[cacheKey] = icon;
    return icon;
};

const MapResizeHandler = () => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => clearTimeout(timer);
  }, [map]);
  return null;
};

const ChangeView: React.FC<{ center: Coordinates; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    // flyTo is better for user-driven changes like search
    // setView is better for initial load or programmatic changes
    map.flyTo([center.lat, center.lng], zoom);
  }, [center, zoom, map]);
  return null;
};

const UserLocationMarker: React.FC<{ position: Coordinates }> = ({ position }) => {
  const userIcon = new L.DivIcon({
    html: `<div class="w-4 h-4 bg-blue-400 rounded-full border-2 border-white shadow-md"></div>`,
    className: 'leaflet-usermarker-icon',
    iconSize: [16, 16],
  });

  return <Marker position={[position.lat, position.lng]} icon={userIcon} />;
}

interface MapStyle {
  url: string;
  attribution: string;
}

interface MapViewProps {
  posts: Post[];
  onMarkerClick: (post: Post) => void;
  center: Coordinates;
  userLocation: Coordinates | null;
  mapStyle: MapStyle;
  zoom: number;
  onMoveEnd: (center: Coordinates, zoom: number) => void;
}

const MapEventsHandler: React.FC<{ onMoveEnd: (center: Coordinates, zoom: number) => void }> = ({ onMoveEnd }) => {
  const map = useMapEvents({
    moveend: () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      onMoveEnd({ lat: center.lat, lng: center.lng }, zoom);
    },
  });
  return null;
};


const MapView: React.FC<MapViewProps> = ({ posts, onMarkerClick, center, userLocation, mapStyle, zoom, onMoveEnd }) => {
  const mapRef = useRef<L.Map>(null);

  return (
    <div className="flex-grow w-full h-full">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
        zoomControl={false} // Disable default zoom control
      >
        <MapResizeHandler />
        <ZoomControl position="bottomleft" />
        <ChangeView center={center} zoom={zoom} />
        <MapEventsHandler onMoveEnd={onMoveEnd} />

        <TileLayer
          key={mapStyle.url} // Force re-render when style changes
          url={mapStyle.url}
          attribution={mapStyle.attribution}
        />
        
        {userLocation && <UserLocationMarker position={userLocation} />}

        {posts.map(post => (
          <Marker
            key={post.id}
            position={[post.coordinates.lat, post.coordinates.lng]}
            icon={getMarkerIcon(post.category)}
            eventHandlers={{
              click: () => {
                onMarkerClick(post);
              },
            }}
          />
        ))}
      </MapContainer>
    </div>
  );
};

export default MapView;