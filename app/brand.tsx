// The AssetMeet wordmark, as in the reference design.
export function AssetWordmark() {
  return (
    <span className="asset-wordmark" aria-label="AssetMeet">
      <span className="am-symbol" aria-hidden="true">am</span>
      <span className="am-name">
        <span>asset</span>
        <strong>meet</strong>
        <small>.com</small>
      </span>
    </span>
  );
}

// Illustrative photography by property type. Real listings carry no photos yet.
const photos: Record<string, string> = {
  Commercial: "photo-1486406146926-c627a92ad1ab",
  Industrial: "photo-1586528116311-ad8dd3c8310d",
  Warehouse: "photo-1586528116311-ad8dd3c8310d",
  Residential: "photo-1600585154340-be6161a56a0c",
  Land: "photo-1500382017468-9049fed747ef",
  Office: "photo-1497366754035-f200968a6e72",
};
export const photo = (type: string, w = 1100) =>
  `https://images.unsplash.com/${photos[type] ?? photos.Commercial}?auto=format&fit=crop&w=${w}&q=85`;
