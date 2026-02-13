"use client";

import Link from "next/link";

type SiteHeaderProps = {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
};

export default function SiteHeader({ searchValue, onSearchChange }: SiteHeaderProps) {
  return (
    <header>
      <div className="nav">
        <div className="page-shell nav-inner">
          <Link href="/" className="logo">
            FS
          </Link>
          {onSearchChange && (
            <label className="nav-search">
              <span className="sr-only">Search</span>
              <input
                type="search"
                placeholder="Search"
                value={searchValue ?? ""}
                onChange={(event) => onSearchChange(event.target.value)}
              />
            </label>
          )}
        </div>
      </div>
    </header>
  );
}
