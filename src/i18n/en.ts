// Locale copy for en. See src/i18n/index.ts for fallback rules.
export default {
  "nav": {
    "projects": "Projects",
    "blog": "Blog",
    "about": "About",
    "bio": "Bio",
    "now": "Now",
    "terminal": "Terminal"
  },
  "lang": {
    "switch": "Switch language",
    "target": "English",
    "note": "Japanese is AI-translated, not self-written."
  },
  "home": {
    "greeting": "hey, i'm w0pal.",
    "tagline": "informatics, linux, and street photography.",
    "bio1": "I like building things, breaking stuff (sometimes), and figuring out how things work. Most of what I build comes from curiosity: trying to solve my own problems or exploring ideas that seem interesting at the time. Some of it turns into websites, software, scripts, and Linux customization.",
    "bio2": "Outside of that, I take street photos, binge anime, and occasionally spend time on PC building."
  },
  "bio": {
    "title": "Biography",
    "subtitle": "A short record of how I got here.",
    "journey": {
      "y2020": "Built my first PC.",
      "y2023linux": "Started using Linux as my daily desktop.",
      "y2023docs": "Handled documentation for a campus organisation.",
      "y2025server": "First worked with Linux on a server.",
      "y2026": "Started as a graphic designer and computer repair support at PT. Kaldyta Mega Tech, and joined a Data Science apprenticeship at Coding Camp 2026."
    }
  },
  "about": {
    "title": "About",
    "subtitle": "Someone obsessed with Linux.",
    "intro1": "I'm w0pal (Naufal), a final-year informatics engineering student at Nusa Putra University. It started when I built my first PC in 2020.",
    "introLinux": "My first Linux desktop was on an old laptop I wanted to bring back to life, the same one I used for college. I asked a friend on campus which distro to use and tried his suggestion. Not long after, the laptop smelled like smoke and stopped booting. I needed a new one. I had already done the reading, so I installed Linux on the replacement and removed the Windows 11 it came with.",
    "introPhoto": "Photography started for me on social media. Later I became a documentation officer in a campus organisation. I did not see it as a career path, so I sold the camera. It stayed with me for a while, and I even joked about calling it my girlfriend. Here is a photo I took with it:",
    "photoCaption": "A photo I took with the Fujifilm X-T10.",
    "cameraAfter": "The camera was a Fujifilm X-T10. These days, phone photos are more than enough for me.",
    "introServer": "I first met Linux on the server side in 2025, when I was trusted to troubleshoot a VPS for the [[Reverse Vending Machine|/projects#reverse-vending-machine]] project. That machine ran AlmaLinux. In early 2026 I bought a modified Indihome set-top box with Armbian installed. That is where I learned self-hosting and Docker containers. I ran a few services, including AdGuard Home, Vaultwarden, and Nginx Proxy Manager. My current homelab is listed on this page with live specs, monitored from a container isolated from Docker.",
    "introJapanese": "I study Japanese in my free time. I got into it because I like Japanese culture, especially the music. Lately I have kept at it with Anki using the Kaishi 1.5k deck. You can see my progress on the [[Anki tracker|/now]].",
    "machines": "Machines",
    "desk": "Desk setup",
    "journey": "Journey",
    "experience": "Experience",
    "education": "Education",
    "expEmpty": "Work experience will be added here.",
    "specsPending": "Specs to be added.",
    "retired": "retired",
    "role": {
      "homelab": "homelab, \"takamatsu\"",
      "daily": "daily driver",
      "firstBuild": "first PC build",
      "formerServer": "former homeserver"
    },
    "note": {
      "eliteDesk": "Runs the Docker stack: AdGuard Home, Nginx Proxy Manager, Vaultwarden, and the live-status collectors behind this site.",
      "firstBuild": "The RAM overclocking experiment written up on Medium started on this machine.",
      "zte": "The original homelab box, a repurposed TV set-top box. Retired when the EliteDesk took over.",
      "homelabLive": "Live specs from the collector running on this machine."
    },
    "journeyText": {
      "y2020": "Got into PC building. Assembling, optimizing, and figuring out how the hardware works.",
      "y2023linux": "Switched to Linux as my daily desktop.",
      "y2023uni": "Started Informatics Engineering at Nusa Putra University.",
      "y2025": "First touched Linux servers while troubleshooting a VPS for the Reverse Vending Machine project.",
      "photo": "Photography became the second hobby. Mostly street shots, with a camera and with my phone.",
      "y2026": "First professional roles: graphic design and computer repair at PT. Kaldyta Mega Tech. Also joined the Data Science cohort at Coding Camp (DBS Foundation) and built DyslexiaLens with the team.",
      "now": "Running a homelab, keeping this site as a record of what I build, and writing about what I learn."
    },
    "expRole": {
      "gd": "Graphic Designer",
      "repair": "Computer Repair Support",
      "ds": "Data Science Cohort (Independent Study)"
    },
    "expDesc": {
      "gd": "Made 3 Instagram posts a week: educational content on hardware maintenance, GPU cooling, and malware prevention, plus national-holiday graphics for Feed and Stories. Kept the branding consistent.",
      "repair": "Diagnostics and customer support for hardware and software repairs: client consultations, root-cause analysis, cost estimates, OS reinstalls, and system maintenance.",
      "ds": "Capstone: DyslexiaLens, an AI-powered early dyslexia detection platform. Prepared datasets, integrated models via FastAPI and Hugging Face, and worked on REST APIs and Supabase in a cross-functional agile team."
    },
    "eduDegree": {
      "uni": "Bachelor's degree, Informatics Engineering",
      "hs": "Natural Science major"
    },
    "period": {
      "gd": "Feb 2026 – Aug 2026",
      "ds": "Feb 2026 – Jul 2026",
      "uni": "2023 – 2027 (expected)",
      "hs": "2020 – 2023"
    },
    "photoAlt": "Photo taken with a Fujifilm X-T10",
    "deskAlt1": "Desk setup with two monitors and the custom PC",
    "deskAlt2": "HP EliteDesk homelab machine on the desk",
    "laptopAlt": "Laptop setup photo"
  },
  "projects": {
    "title": "Projects",
    "subtitle": "Things I've built and worked on.",
    "empty": "Nothing here yet. Check back later.",
    "desc": {
      "rvm": "Contributed to Sukabumi City's first Reverse Vending Machine (RVM), a plastic-recycling initiative publicly launched with the Vice Mayor in attendance. I helped choose and assemble the computer hardware, supported basic microcontroller wiring, and worked with a multidisciplinary team. (May–Aug 2025)",
      "x17blake": "Linux configuration tool for the Fantech X17 Blake gaming mouse: DPI stages, polling rate, lighting, and button remapping over vendor HID. I reverse engineered the protocol from the Windows driver. Pure Python stdlib, no daemon.",
      "snowsky": "Native Linux configurator for the FiiO SNOWSKY TINY A/B DSP dongle: 10-band parametric EQ, presets, volume/balance/mic over vendor HID. Reverse engineered from the FiiO Control web bundle and verified with USB captures.",
      "homelab": "GitOps repository for my home server. Docker Compose stacks for AdGuard Home, Nginx Proxy Manager, Vaultwarden, and the live-status collectors behind this site.",
      "dyslexia": "Data science work for DyslexiaLens, an AI-powered early dyslexia detection platform. Dataset preparation and model development for the Coding Camp 2026 capstone.",
      "pdf": "As the name suggests. Still in development.",
      "token": "A website for exchanging coins (dummy coins, ERC-20) using SepoliaETH testnet.",
      "survey": "Created for the Pre-Internship final assignment.",
      "cachyos": "Modified CachyOS CLI kernel builder for Debian-based systems.",
      "troubleshooter": "My first AI-driven skill.md: guided troubleshooting for Linux machines.",
      "hadoop": "Pre-configured Docker environment for Apache Hadoop 3.3.6 in pseudo-distributed mode. HDFS formats itself on start, with NameNode, DataNode, and YARN ready to go. Published on Docker Hub.",
      "enkripsi": "Hybrid AES-256 + ECC (secp256k1) encryption simulation for e-KTP data protection. Research implementation with a dummy data generator and encrypt/decrypt tooling.",
      "iot": "Smart door lock final project: WeMos ESP32 D1 R32 + SG90 servo, controlled over MQTT (HiveMQ) with TLS.",
      "zshrc": "My zsh configuration."
    }
  },
  "blog": {
    "title": "Blog",
    "subtitle": "Writing about software, linux, and photography.",
    "search": "Search posts...",
    "loading": "Loading...",
    "noMatch": "No matching posts found.",
    "noPosts": "No posts yet."
  },
  "now": {
    "title": "Now",
    "subtitle": "What I'm up to these days.",
    "status": "Status",
    "anki": "Anki",
    "homelab": "Homelab",
    "goals": "Goals",
    "interests": "Interests",
    "goal0": "Graduate college using Linux (journals, thesis, etc.)",
    "interest": {
      "photo": "Street photography",
      "pc": "PC building & optimization",
      "linux": "Linux customization",
      "web": "Web development"
    },
    "ankiWaiting": "Waiting for Anki sync. Open Anki and your streak and review stats will show up here.",
    "statusWaiting": "Waiting for Anki sync. Open Anki and what you're studying shows up here.",
    "ankiSummary": "{cards} cards · {streak} day streak · {today} today",
    "ankiSummaryNoCards": "{streak} day streak · {today} today",
    "synced": "Synced from Anki {date}"
  },
  "homelab": {
    "offline": "the homelab is turned off.",
    "lastSeen": "last seen {time}",
    "connecting": "connecting to the homelab…",
    "ago": {
      "now": "just now",
      "s": "{n}s ago",
      "m": "{m}m ago",
      "h": "{h}h ago",
      "d": "{d}d ago"
    }
  },
  "ankiCard": {
    "playing": "PLAYING A GAME",
    "offline": "OFFLINE",
    "notStudying": "Not studying right now",
    "chilling": "Chilling in the menus",
    "studying": "Studying",
    "elapsed": "{time} elapsed",
    "less": "Less",
    "more": "More"
  },
  "nowPlaying": {
    "playing": "Now playing",
    "nothing": "Nothing playing",
    "checkBack": "Check back later",
    "toggle": "Now Playing"
  },
  "terminal": {
    "banner1": "w0pal's homelab: public read-only shell",
    "banner2": "Commands run in an isolated container on the lab. No writes, no sudo.",
    "banner3": "Type 'help' for available commands.",
    "helpHomelab": "── Homelab ──",
    "helpShell": "── Shell ──",
    "helpFooter": "Read-only: commands run in an isolated container on the lab.\nUp/Down for history, Tab to complete.",
    "cmd": {
      "fastfetch": "System overview",
      "top": "Resource monitor (live snapshot)",
      "df": "Disk usage",
      "free": "Memory usage",
      "uptime": "Uptime & load",
      "uname": "Kernel info",
      "hostname": "Lab hostname",
      "date": "Lab date & time",
      "lsblk": "Block devices",
      "lscpu": "CPU architecture",
      "vmstat": "Virtual memory stats",
      "whoami": "Current user",
      "id": "User & group IDs",
      "groups": "Group names",
      "who": "Logged-in users",
      "w": "Who is logged in & doing what",
      "users": "Logged-in usernames",
      "logname": "Login name",
      "tty": "Terminal name",
      "pwd": "Working directory",
      "arch": "Machine architecture",
      "nproc": "CPU count",
      "cal": "Calendar",
      "echo": "Print text",
      "help": "Show this list",
      "clear": "Clear the screen"
    },
    "lab": "lab",
    "online": "online",
    "offline": "offline",
    "offlineNote": "commands will not run until it is back",
    "running": "… running {cmd} on the lab",
    "noResponse": "no response from the homelab. it may be turned off; try again later.",
    "apiUnreachable": "could not reach the tracker API. check your connection.",
    "notAllowed": "{cmd}: command not allowed. Type 'help' to see available commands.",
    "noHistory": "no history",
    "noOutput": "(no output)",
    "requestFailed": "request failed (HTTP {status})",
    "placeholder": "type a command (help)",
    "placeholderBusy": "running on the lab…"
  },
  "aria": {
    "toggleNav": "Toggle navigation",
    "primaryNav": "Primary",
    "toggleNowPlaying": "Toggle now playing"
  },
  "blogDetail": {
    "notFound": "Post Not Found",
    "back": "Back to Blog",
    "readOnMedium": "Read full article on Medium",
    "mediumNotice": "This article was published on Medium. Click below to read the full version.",
    "local": "Local"
  }
}
