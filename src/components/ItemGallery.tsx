"use client";

import { useState } from "react";

type GalleryImage = {
  url: string;
};

export default function ItemGallery({ images }: { images: GalleryImage[] }) {
  const [active, setActive] = useState(0);
  const current = images[active];

  if (!images.length) {
    return (
      <div className="detail-panel text-center text-[color:var(--muted)]">
        No images available
      </div>
    );
  }

  return (
    <div>
      <div className="detail-panel">
        <img src={current.url} alt="Item" className="w-full h-[520px] object-cover" />
      </div>
      {images.length > 1 && (
        <div className="mt-4 grid grid-cols-4 gap-3">
          {images.map((image, index) => (
            <button
              key={image.url}
              className={`border ${
                index === active ? "border-black" : "border-transparent"
              }`}
              onClick={() => setActive(index)}
            >
              <img src={image.url} alt="Item" className="h-20 w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
