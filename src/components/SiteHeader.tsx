"use client";

import Link from "next/link";

type SiteHeaderProps = {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
};

export default function SiteHeader({ searchValue, onSearchChange }: SiteHeaderProps) {
  return (
    <header>
      <div className="topbar">
        <div className="page-shell topbar-inner">
          <div className="topbar-left">Shipping only • Local catalog</div>
          <div className="topbar-links">
            <span>Find a store</span>
            <span>Help</span>
            <span>Join us</span>
            <span>Sign in</span>
          </div>
        </div>
      </div>

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
          <div className="nav-icons">
            <button type="button">Wishlist</button>
            <button type="button">Bag</button>
          </div>
        </div>
      </div>

      <div className="subnav">
        <div className="page-shell subnav-inner">
          <span>View all new arrivals</span>
          <span className="subnav-link">Shop</span>
        </div>
      </div>
    </header>
  );
}
