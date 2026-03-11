/**
 * Seed data for CTF challenges and sections.
 * This file is ONLY used by the /api/admin/seed route to populate the DB.
 * The frontend fetches from the DB via /api/challenges instead.
 */

export interface ChallengeData {
  id: number;
  title: string;
  category: string;
  difficulty: "easy" | "ez-med" | "medium" | "hard";
  points: number;
  description: string;
  placeholder: string;
  section: string;
  sectionColor: string;
}

export interface ChallengeSeedData extends ChallengeData {
  flag: string;
}

export interface SectionData {
  key: string;
  title: string;
  subtitle: string;
  color: string;
  order: number;
}

export const SEED_SECTIONS: SectionData[] = [
  {
    key: "intro",
    title: "🔰 Introductory Challenges",
    subtitle: "Perfect for beginners — ease into the game.",
    color: "#00ff41",
    order: 0,
  },
  {
    key: "web",
    title: "🌐 Web Exploitation",
    subtitle: "Inspect, inject, and exploit web-based vulnerabilities.",
    color: "#00ccff",
    order: 1,
  },
  {
    key: "crypto",
    title: "🔐 Cryptography & Encoding",
    subtitle: "Crack codes, decode secrets, and break ciphers.",
    color: "#ffaa00",
    order: 2,
  },
  {
    key: "forensics",
    title: "🔍 Forensics & Steganography",
    subtitle: "Uncover hidden data and analyze digital evidence.",
    color: "#ff44aa",
    order: 3,
  },
  {
    key: "osint",
    title: "🕵 OSINT & Recon",
    subtitle: "Use open-source intelligence to find the hidden.",
    color: "#aa66ff",
    order: 4,
  },
  {
    key: "misc",
    title: "🧩 Miscellaneous",
    subtitle: "Oddball challenges that don't fit the mold.",
    color: "#ff6644",
    order: 5,
  },
];

export const SEED_CHALLENGES: ChallengeSeedData[] = [
  // ── Intro ──
  {
    id: 1,
    title: "Welcome Flag",
    category: "Introduction",
    difficulty: "easy",
    points: 10,
    description:
      "Every journey starts with a first step. The flag is: DAKSHH{w3lc0me_t0_cyb3rqu3st}",
    placeholder: "DAKSHH{...}",
    section: "intro",
    sectionColor: "#00ff41",
    flag: "DAKSHH{w3lc0me_t0_cyb3rqu3st}",
  },
  {
    id: 2,
    title: "Base-ics",
    category: "Introduction",
    difficulty: "easy",
    points: 15,
    description:
      "Decode this Base64 string: REFLY1NIe2I0czNfNjRfZGVjMGRlZH0=",
    placeholder: "DAKSHH{...}",
    section: "intro",
    sectionColor: "#00ff41",
    flag: "DAKSHH{b4s3_64_dec0ded}",
  },
  {
    id: 3,
    title: "Inspect Element",
    category: "Introduction",
    difficulty: "easy",
    points: 15,
    description:
      "Sometimes the answer is right in front of you. Check the page source.",
    placeholder: "DAKSHH{...}",
    section: "intro",
    sectionColor: "#00ff41",
    flag: "DAKSHH{1nsp3ct_th3_s0urc3}",
  },
  // ── Web ──
  {
    id: 4,
    title: "Cookie Monster",
    category: "Web Exploitation",
    difficulty: "easy",
    points: 20,
    description:
      "Some websites store secrets in cookies. Can you find the hidden cookie?",
    placeholder: "DAKSHH{...}",
    section: "web",
    sectionColor: "#00ccff",
    flag: "DAKSHH{c00ki3_m0nst3r_f0und}",
  },
  {
    id: 5,
    title: "Robots.txt Recon",
    category: "Web Exploitation",
    difficulty: "easy",
    points: 20,
    description:
      "Not all paths are meant to be seen by search engines. What does robots.txt reveal?",
    placeholder: "DAKSHH{...}",
    section: "web",
    sectionColor: "#00ccff",
    flag: "DAKSHH{r0b0ts_g0t_s3cr3ts}",
  },
  {
    id: 6,
    title: "SQL Injection 101",
    category: "Web Exploitation",
    difficulty: "medium",
    points: 40,
    description:
      "The login form below is vulnerable. Can you bypass the authentication?",
    placeholder: "DAKSHH{...}",
    section: "web",
    sectionColor: "#00ccff",
    flag: "DAKSHH{sql_1nj3ct10n_m4st3r}",
  },
  {
    id: 7,
    title: "XSS Playground",
    category: "Web Exploitation",
    difficulty: "hard",
    points: 60,
    description:
      "This comment box doesn't sanitize input properly. Craft an XSS payload to steal the flag.",
    placeholder: "DAKSHH{...}",
    section: "web",
    sectionColor: "#00ccff",
    flag: "DAKSHH{xss_p4yl0ad_3x3cut3d}",
  },
  // ── Crypto ──
  {
    id: 8,
    title: "Caesar Says",
    category: "Cryptography",
    difficulty: "easy",
    points: 20,
    description:
      "Julius Caesar used a simple cipher. Decrypt: GDNVKK{f4hv4u_v41g3u}",
    placeholder: "DAKSHH{...}",
    section: "crypto",
    sectionColor: "#ffaa00",
    flag: "DAKSHH{c4es4r_s41d3r}",
  },
  {
    id: 9,
    title: "Hex Madness",
    category: "Cryptography",
    difficulty: "ez-med",
    points: 25,
    description:
      "Convert from hex: 44414b5348487b6833785f6d346433217d",
    placeholder: "DAKSHH{...}",
    section: "crypto",
    sectionColor: "#ffaa00",
    flag: "DAKSHH{h3x_m4d3!}",
  },
  {
    id: 10,
    title: "Vigenère Vault",
    category: "Cryptography",
    difficulty: "hard",
    points: 50,
    description:
      "The encrypted message was encoded with a Vigenère cipher. The key is 'DAKSHH'. Decrypt: HEKWMN{v1g3o4u3_vu4zt3e}",
    placeholder: "DAKSHH{...}",
    section: "crypto",
    sectionColor: "#ffaa00",
    flag: "DAKSHH{v1g3n4r3_cr4ck3d}",
  },
  // ── Forensics ──
  {
    id: 11,
    title: "Hidden in Plain Sight",
    category: "Forensics",
    difficulty: "ez-med",
    points: 30,
    description:
      "A PNG file was shared. Look beyond the pixels — the flag is embedded in the metadata.",
    placeholder: "DAKSHH{...}",
    section: "forensics",
    sectionColor: "#ff44aa",
    flag: "DAKSHH{m3t4d4t4_h1dd3n}",
  },
  {
    id: 12,
    title: "Steg-o-saurus",
    category: "Steganography",
    difficulty: "medium",
    points: 40,
    description:
      "The image looks normal, but data is hidden within using LSB steganography. Download the attached image and extract the flag.",
    placeholder: "DAKSHH{...}",
    section: "forensics",
    sectionColor: "#ff44aa",
    flag: "DAKSHH{st3g0_l5b_3xtr4ct}",
  },
  // ── OSINT ──
  {
    id: 13,
    title: "Social Sleuth",
    category: "OSINT",
    difficulty: "medium",
    points: 35,
    description:
      "Find the flag hidden in the DAKSHH club's public social media profile. Look carefully at the bio.",
    placeholder: "DAKSHH{...}",
    section: "osint",
    sectionColor: "#aa66ff",
    flag: "DAKSHH{s0c14l_sl3uth_f0und}",
  },
  {
    id: 14,
    title: "Geo-Guesser",
    category: "OSINT",
    difficulty: "hard",
    points: 50,
    description:
      "This satellite image was taken near a well-known landmark. Identify the location and construct the flag as DAKSHH{landmark_name_lowercase}.",
    placeholder: "DAKSHH{...}",
    section: "osint",
    sectionColor: "#aa66ff",
    flag: "DAKSHH{victoria_memorial}",
  },
  // ── Misc ──
  {
    id: 15,
    title: "Binary Brainteaser",
    category: "Miscellaneous",
    difficulty: "ez-med",
    points: 25,
    description:
      "Convert this binary to ASCII: 01000100 01000001 01001011 01010011 01001000 01001000 01111011 01100010 00110001 01101110 01100100 01110010 01111001 01011111 01100010 00110000 01110011 01110011 01111101",
    placeholder: "DAKSHH{...}",
    section: "misc",
    sectionColor: "#ff6644",
    flag: "DAKSHH{b1ndry_b0ss}",
  },
  {
    id: 16,
    title: "QR Quest",
    category: "Miscellaneous",
    difficulty: "medium",
    points: 30,
    description:
      "A QR code was found at the event venue. Scan it to reveal the flag. (Hint: Check the event registration desk)",
    placeholder: "DAKSHH{...}",
    section: "misc",
    sectionColor: "#ff6644",
    flag: "DAKSHH{qr_qu3st_c0mpl3t3}",
  },
];
