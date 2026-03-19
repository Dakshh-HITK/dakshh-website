export type SponsorTier = "diamond" | "gold" | "silver";

export interface Sponsor {
  id: string;
  name: string;
  logo_url: string;
  website_url?: string;
  tier: SponsorTier;
}

export const sponsors: Sponsor[] = [
  // Diamond
  {
    id: "d1",
    name: "Punjab National Bank",
    logo_url:
      "https://res.cloudinary.com/dnil7l0j1/image/upload/v1773354376/pnb_kgs8s6.png",
    website_url: "https://www.instagram.com/pnbindia?igsh=b2hsYWxqNXpiZDQx",
    tier: "diamond",
  },
  // Gold
  {
    id: "g1",
    name: "PassPass",
    logo_url:
      "https://res.cloudinary.com/dnil7l0j1/image/upload/v1773354137/Pass_Pass_Logo_lmyaph.png",
    website_url: "https://www.instagram.com/passpassmf?igsh=ZTJrNjZleXU2ODc0",
    tier: "gold",
  },
  // Silver
  {
    id: "s1",
    name: "Institute of Academic Excellence",
    logo_url:
      "https://res.cloudinary.com/dnil7l0j1/image/upload/v1773354543/iae_gmab6f.png",
    website_url: "https://iaegroup.in/",
    tier: "silver",
  },
  {
    id: "s2",
    name: "IDP Education",
    logo_url:
      "https://res.cloudinary.com/dnil7l0j1/image/upload/v1773354664/idp_gfe6of.jpg",
    website_url:
      "https://form.idp.com/india/5kuqKYfmlUhODWdYkvtDL4?utm_source=bing&utm_medium=cpc&utm_campaign=bing_Brand&msclkid=bbc930ef2e8d129a0a08595c1196c05e",
    tier: "silver",
  },
  {
    id: "s3",
    name: "Banner and Co.",
    logo_url:
      "https://res.cloudinary.com/dnil7l0j1/image/upload/v1773432113/banner_and_co_dh3dn0.jpg",
    // website_url: "https://example.com",
    tier: "silver",
  },
];
