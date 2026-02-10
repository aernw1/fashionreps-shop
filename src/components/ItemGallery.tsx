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
      <div className="panel p-8 text-center text-[color:var(--muted)]">
        No images available
      </div>
    );
  }

  return (
    <div>
      <div className="panel p-4">
        <img
          src={current.url}
          alt="Item"
          className="w-full max-h-[480px] object-cover rounded-[20px]"
        />
      </div>
      {images.length > 1 && (
        <div className="mt-4 grid grid-cols-4 gap-3">
          {images.map((image, index) => (
            <button
              key={image.url}
              className={`rounded-[16px] overflow-hidden border transition-all ${
                index === active
                  ? "border-[color:var(--accent)] scale-[1.02]"
                  : "border-transparent"
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
